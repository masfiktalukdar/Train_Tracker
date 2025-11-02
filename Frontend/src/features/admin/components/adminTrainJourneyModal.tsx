import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import type { ApiRoute } from "@/features/admin/api/routesApi";
import type { ApiTrain } from "@/features/admin/api/trainsApi";
import type { Station } from "@/types/dataModels";
import {
	getDailyStatus,
	updateDailyStatus,
	getTodayDateString,
	UpdateStatusPayload,
	DailyTrainStatus,
	StationArrivalRecord,
} from "@/features/admin/api/statusApi";
import {
	ArrowRight,
	CheckCircle,
	CornerDownRight,
	Flag,
	TrainFront,
	X,
	Loader2,
} from "lucide-react";

type TrainJourneyModalProps = {
	train: ApiTrain;
	route: ApiRoute;
	onClose: () => void;
};

// This helper is still valid, as it just processes props
function getFullRoundTripJourney(route: ApiRoute, train: ApiTrain) {
	const routeStations = route.stations;
	if (!routeStations || routeStations.length === 0) return [];

	const stoppageMap = new Map(train.stoppages.map((s) => [s.stationId, s]));

	const actualStoppagesOnRoute = routeStations.filter((station) =>
		stoppageMap.has(station.stationId)
	);

	if (actualStoppagesOnRoute.length === 0) return [];

	const firstLegStations =
		train.direction === "up"
			? [...actualStoppagesOnRoute]
			: [...actualStoppagesOnRoute].reverse();

	const secondLegStations = [...firstLegStations].reverse().slice(1);

	const fullJourneyPath = [...firstLegStations, ...secondLegStations];

	return fullJourneyPath.map((station, index) => {
		const stoppageData = stoppageMap.get(station.stationId)!;
		const isFirstLeg = index < firstLegStations.length;
		const trainsPrimaryDirection = train.direction;

		let defaultTime;
		if (isFirstLeg) {
			defaultTime =
				trainsPrimaryDirection === "up"
					? stoppageData.upArrivalTime
					: stoppageData.downArrivalTime;
		} else {
			defaultTime =
				trainsPrimaryDirection === "up"
					? stoppageData.downArrivalTime
					: stoppageData.upArrivalTime;
		}

		return {
			...station,
			journeyIndex: index,
			isStoppage: true,
			defaultTime: defaultTime,
		};
	});
}

export default function TrainJourneyModal({
	train,
	route,
	onClose,
}: TrainJourneyModalProps) {
	const queryClient = useQueryClient();
	const today = getTodayDateString();

	// --- Data Fetching ---
	const queryKey = ["dailyStatus", train.id, today];

	const { data: todaysStatus, isLoading } = useQuery<DailyTrainStatus | null>({
		queryKey: queryKey,
		queryFn: () => getDailyStatus(train.id, today),
	});

	// --- Mutations ---
	const statusUpdateMutation = useMutation({
		mutationFn: updateDailyStatus,
		onSuccess: (updatedStatus) => {
			// Optimistically update the cache
			queryClient.setQueryData(queryKey, updatedStatus);
		},
		onError: (err) => {
			console.error("Failed to update status:", err);
			// Refetch to revert optimistic update
			queryClient.invalidateQueries({ queryKey: queryKey });
		},
	});

	// --- Memoized Values ---
	const fullJourney = useMemo(
		() => getFullRoundTripJourney(route, train),
		[route, train]
	);

	const firstLegLength = useMemo(() => {
		const stoppageMap = new Map(train.stoppages.map((s) => [s.stationId, s]));
		return route.stations.filter((station) =>
			stoppageMap.has(station.stationId)
		).length;
	}, [route, train]);

	// Create a default status object for mutations if none exists
	const defaultStatus: DailyTrainStatus = {
		train_id: train.id,
		date: today,
		lap_completed: false,
		arrivals: [],
		last_completed_station_id: null,
	};

	const status = todaysStatus || defaultStatus;
	const { lap_completed: lapCompleted } = status;
	const lastCompletedIndex = status.arrivals.length - 1;

	// --- Handlers ---
	const handleStationClick = (
		station: Station & { journeyIndex: number; defaultTime: string }
	) => {
		if (lapCompleted || statusUpdateMutation.isPending) return;

		const clickedIndex = station.journeyIndex;
		let newStatus: UpdateStatusPayload;

		if (clickedIndex <= lastCompletedIndex) {
			// --- UNDO ---
			const newLastStation =
				clickedIndex > 0 ? fullJourney[clickedIndex - 1] : null;
			const newLastStationId = newLastStation ? newLastStation.stationId : null;

			const newArrivals = status.arrivals.slice(0, clickedIndex);

			newStatus = {
				...status,
				arrivals: newArrivals,
				last_completed_station_id: newLastStationId,
				lap_completed: false, // Can't be completed if we just undid
			};
		} else if (clickedIndex === lastCompletedIndex + 1) {
			// --- ADVANCE ---
			const newArrival: StationArrivalRecord = {
				id: uuid(),
				stationId: station.stationId,
				stationName: station.stationName,
				arrivedAt: new Date().toISOString(),
			};
			newStatus = {
				...status,
				arrivals: [...status.arrivals, newArrival],
				last_completed_station_id: station.stationId,
			};
		} else {
			// Clicked too far ahead, do nothing
			return;
		}

		// Optimistically update before firing mutation
		queryClient.setQueryData(queryKey, newStatus);
		statusUpdateMutation.mutate(newStatus);
	};

	const handleCompleteLap = () => {
		if (lapCompleted || statusUpdateMutation.isPending) return;

		if (lastCompletedIndex === fullJourney.length - 1) {
			const newStatus: UpdateStatusPayload = {
				...status,
				lap_completed: true,
			};
			queryClient.setQueryData(queryKey, newStatus);
			statusUpdateMutation.mutate(newStatus);
		} else {
			console.warn("Please mark all stations as arrived first.");
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
				{/* --- Header --- */}
				<div className="p-4 border-b flex justify-between items-center">
					<div>
						<h2 className="text-xl font-bold">
							{train.name} ({train.code}) - Daily Journey
						</h2>
						<p className="text-sm text-gray-600">
							{lapCompleted
								? "This train's lap for today is complete."
								: "Click the *next* stoppage to mark arrival, or a *completed* one to undo."}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-200"
					>
						<X className="w-6 h-6 text-gray-600" />
					</button>
				</div>

				{/* --- Journey Body --- */}
				{isLoading ? (
					<div className="p-10 flex justify-center items-center">
						<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
						<span className="ml-4 text-gray-600">Loading daily status...</span>
					</div>
				) : (
					<div className="p-6 space-y-4 overflow-y-auto">
						<div className="flex flex-wrap items-center gap-2">
							{fullJourney.map((station, index) => {
								const isCompleted = index <= lastCompletedIndex;
								const isCurrent = index === lastCompletedIndex + 1;
								const isTurnaround = index === firstLegLength - 1;
								const isClickable = !lapCompleted && (isCompleted || isCurrent);

								const title = isClickable
									? isCompleted
										? `Click to undo (go back to ${
												fullJourney[index - 1]?.stationName || "start"
											})`
										: "Click to mark as arrived"
									: lapCompleted
										? "Lap complete"
										: "Cannot arrive here yet";

								return (
									<React.Fragment key={`${station.stationId}-${index}`}>
										{/* Station Block */}
										<div
											className={`flex items-center gap-3 p-3 rounded-lg border ${
												isClickable ? "cursor-pointer" : "cursor-not-allowed"
											} ${
												isCompleted ? "bg-gray-100 text-gray-500" : "bg-white"
											} ${
												isCurrent && !lapCompleted
													? "border-blue-500 ring-2 ring-blue-500"
													: "border-gray-300"
											}`}
											onClick={() => handleStationClick(station)}
											title={title}
										>
											{/* Icon */}
											<div>
												{isCompleted ? (
													<CheckCircle className="w-5 h-5 text-green-500" />
												) : isCurrent && !lapCompleted ? (
													<TrainFront className="w-5 h-5 text-blue-500" />
												) : (
													<div className="w-5 h-5 flex items-center justify-center">
														<div className="w-2 h-2 bg-gray-400 rounded-full"></div>
													</div>
												)}
											</div>
											<div className="flex-shrink min-w-0">
												<span className="block font-bold truncate">
													{station.stationName}
												</span>
												<span className="text-xs text-blue-600 font-mono">
													({station.defaultTime})
												</span>
											</div>
										</div>

										{/* Arrow or Turnaround Block */}
										{isTurnaround ? (
											<div className="flex items-center p-3 text-red-600 font-semibold">
												<CornerDownRight className="w-5 h-5 mr-2" />
												TURNAROUND
											</div>
										) : index < fullJourney.length - 1 ? (
											<div className="flex items-center justify-center p-2 text-gray-300">
												<ArrowRight className="w-5 h-5" />
											</div>
										) : null}
									</React.Fragment>
								);
							})}
						</div>

						{/* --- Lap Completion Button --- */}
						{lastCompletedIndex === fullJourney.length - 1 && !lapCompleted && (
							<div className="pt-4 text-center">
								<button
									className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
									onClick={handleCompleteLap}
									disabled={statusUpdateMutation.isPending}
								>
									<Flag className="w-5 h-5" />
									Mark Daily Lap as Complete
								</button>
							</div>
						)}
						{lapCompleted && (
							<div className="pt-4 text-center">
								<p className="px-6 py-3 bg-green-100 text-green-800 font-semibold rounded-lg flex items-center gap-2 justify-center">
									<CheckCircle className="w-5 h-5" />
									Daily Lap Completed
								</p>
							</div>
						)}

						{/* --- Arrival Log --- */}
						{status.arrivals.length > 0 && (
							<div className="pt-4">
								<h4 className="text-sm font-semibold text-gray-700 mb-2">
									Today's Arrival Log
								</h4>
								<div className="max-h-32 overflow-y-auto bg-gray-50 border rounded-md p-2 space-y-1">
									{status.arrivals
										.map((arrival) => (
											<p
												key={arrival.id}
												className="text-xs text-gray-600 font-mono"
											>
												<span className="font-bold text-black">
													{arrival.stationName}
												</span>
												{": "}
												{new Date(arrival.arrivedAt).toLocaleTimeString()}
											</p>
										))
										.reverse()}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
