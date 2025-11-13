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
	StationDepartureRecord, 
} from "@/features/admin/api/statusApi";
import {
	ArrowRight,
	CheckCircle,
	CornerDownRight,
	Flag,
	TrainFront,
	X,
	Loader2,
	LogOut, 
	Undo2, 
} from "lucide-react";
import {
	format24HourTime,
	formatTimeFromDate,
} from "@/features/user/utils/formatTime"; 
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
			queryClient.setQueryData(queryKey, updatedStatus);
		},
		onError: (err) => {
			console.error("Failed to update status:", err);
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
		departures: [],
		last_completed_station_id: null,
	};

	const status = todaysStatus || defaultStatus;
	const { lap_completed: lapCompleted } = status;
	const lastCompletedArrivalIndex = status.arrivals.length - 1;
	const arrivalsCount = status.arrivals.length;
	const departuresCount = status.departures.length;

	// --- Handlers ---
	const handleArrive = (
		station: Station & { journeyIndex: number; defaultTime: string }
	) => {
		if (
			lapCompleted ||
			statusUpdateMutation.isPending ||
			station.journeyIndex !== arrivalsCount || 
			arrivalsCount !== departuresCount 
		) {
			return; 
		}

		const newArrival: StationArrivalRecord = {
			id: uuid(),
			stationId: station.stationId,
			stationName: station.stationName,
			arrivedAt: new Date().toISOString(),
		};

		const newStatus: UpdateStatusPayload = {
			...status,
			arrivals: [...status.arrivals, newArrival],
			last_completed_station_id: station.stationId,
		};
		queryClient.setQueryData(queryKey, newStatus);
		statusUpdateMutation.mutate(newStatus);
	};

	const handleDepart = (
		station: Station & { journeyIndex: number; defaultTime: string }
	) => {
		if (
			lapCompleted ||
			statusUpdateMutation.isPending ||
			station.journeyIndex !== lastCompletedArrivalIndex ||
			station.journeyIndex !== departuresCount 
		) {
			return;
		}

		const newDeparture: StationDepartureRecord = {
			id: uuid(),
			stationId: station.stationId,
			stationName: station.stationName,
			departedAt: new Date().toISOString(),
		};

		const newStatus: UpdateStatusPayload = {
			...status,
			departures: [...status.departures, newDeparture],
		};
		queryClient.setQueryData(queryKey, newStatus);
		statusUpdateMutation.mutate(newStatus);
	};

	const handleUndo = () => {
		if (lapCompleted || statusUpdateMutation.isPending) return;

		let newStatus: UpdateStatusPayload;
		const arrivalsCount = status.arrivals.length;
		const departuresCount = status.departures.length;

		if (arrivalsCount > departuresCount) {
			const newArrivals = status.arrivals.slice(0, -1);
			const newLastStationId =
				newArrivals.length > 0
					? newArrivals[newArrivals.length - 1].stationId
					: null;
			newStatus = {
				...status,
				arrivals: newArrivals,
				last_completed_station_id: newLastStationId,
				lap_completed: false,
			};
		} else if (arrivalsCount === departuresCount && arrivalsCount > 0) {
			const newDepartures = status.departures.slice(0, -1);
			newStatus = {
				...status,
				departures: newDepartures,
				lap_completed: false,
			};
		} else {
			return;
		}

		queryClient.setQueryData(queryKey, newStatus);
		statusUpdateMutation.mutate(newStatus);
	};

	const handleCompleteLap = () => {
		if (lapCompleted || statusUpdateMutation.isPending) return;
		if (lastCompletedArrivalIndex === fullJourney.length - 1) {
			const newStatus: UpdateStatusPayload = {
				...status,
				lap_completed: true,
			};
			queryClient.setQueryData(queryKey, newStatus);
			statusUpdateMutation.mutate(newStatus);
		} else {
			// Don't use alert()
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
								: "Click station to Arrive, or Depart button to Depart."}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleUndo}
							title="Undo last action"
							disabled={
								lapCompleted ||
								statusUpdateMutation.isPending ||
								(status.arrivals.length === 0 && status.departures.length === 0)
							}
							className="p-2 rounded-full hover:bg-gray-200 text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
						>
							<Undo2 className="w-5 h-5" />
						</button>
						<button
							type="button"
							onClick={onClose}
							className="p-1 rounded-full hover:bg-gray-200"
						>
							<X className="w-6 h-6 text-gray-600" />
						</button>
					</div>
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
								const hasArrived = index < arrivalsCount;
								const hasDeparted = index < departuresCount;
								const isNextToArrive = index === arrivalsCount;
								const isWaitingToDepart = hasArrived && !hasDeparted;

								const isClickableToArrive =
									!lapCompleted &&
									isNextToArrive &&
									arrivalsCount === departuresCount;
								const isFinalStation = index === fullJourney.length - 1;
								const isClickableToDepart =
									!lapCompleted && isWaitingToDepart && !isFinalStation;

								let title = "Not yet arrived";
								if (isClickableToArrive) title = "Click to mark as Arrived";
								if (isWaitingToDepart && !isFinalStation)
									title = "Waiting to depart. Click 'Depart' button.";
								if (isWaitingToDepart && isFinalStation)
									title = "Final station reached. Click 'Complete Lap' below.";
								if (hasDeparted) title = "Arrived and Departed";
								if (lapCompleted) title = "Lap complete";

								return (
									<React.Fragment key={`${station.stationId}-${index}`}>
										{/* Station Block */}
										<div
											className={`flex items-center gap-3 p-3 rounded-lg border ${
												isClickableToArrive
													? "cursor-pointer"
													: "cursor-default"
											} ${
												hasArrived
													? "bg-gray-100 text-gray-600"
													: "bg-white text-gray-800"
											} ${
												isNextToArrive && !lapCompleted && isClickableToArrive
													? "border-blue-500 ring-2 ring-blue-500"
													: "border-gray-300"
											} ${
												isWaitingToDepart && !lapCompleted
													? "border-yellow-500"
													: ""
											}
											${isWaitingToDepart && isFinalStation ? "border-green-500" : ""}
											`}
											onClick={() => handleArrive(station)}
											title={title}
										>
											{/* Icon */}
											<div>
												{hasDeparted ? (
													<CheckCircle className="w-5 h-5 text-green-500" />
												) : isWaitingToDepart ? (
													<TrainFront
														className={`w-5 h-5 ${
															isFinalStation
																? "text-green-600"
																: "text-yellow-600"
														}`}
													/>
												) : isNextToArrive && !lapCompleted ? (
													<TrainFront className="w-5 h-5 text-blue-500" />
												) : (
													<div className="w-5 h-5 flex items-center justify-center">
														<div className="w-2 h-2 bg-gray-400 rounded-full"></div>
													</div>
												)}
											</div>
											{/* Name & Time */}
											<div className="flex-shrink min-w-0">
												<span className="block font-bold truncate">
													{station.stationName}
												</span>
												<span className="text-xs text-blue-600 font-mono">
													({format24HourTime(station.defaultTime)})
												</span>
											</div>
											{/* Depart Button */}
											{isClickableToDepart && (
												<button
													title={`Click to mark as Departed from ${station.stationName}`}
													className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded-md text-xs font-bold hover:bg-yellow-600 flex items-center gap-1"
													onClick={(e) => {
														e.stopPropagation(); 
														handleDepart(station);
													}}
													disabled={statusUpdateMutation.isPending}
												>
													<LogOut className="w-3 h-3" />
													Depart
												</button>
											)}
										</div>

										{/* Arrow or Turnaround Block */}
										{index === firstLegLength - 1 ? (
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
						{lastCompletedArrivalIndex === fullJourney.length - 1 &&
							!lapCompleted && (
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

						{/* --- Arrival/Departure Log --- */}
						{(status.arrivals.length > 0 || status.departures.length > 0) && (
							<div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<h4 className="text-sm font-semibold text-gray-700 mb-2">
										Today's Arrival Log
									</h4>
									<div className="max-h-32 overflow-y-auto bg-gray-50 border rounded-md p-2 space-y-1">
										{[...status.arrivals].reverse().map((arrival) => (
											<p
												key={arrival.id}
												className="text-xs text-gray-600 font-mono"
											>
												<span className="font-bold text-black">
													{arrival.stationName}
												</span>
												{": "}
												{formatTimeFromDate(arrival.arrivedAt)}
											</p>
										))}
									</div>
								</div>
								<div>
									<h4 className="text-sm font-semibold text-gray-700 mb-2">
										Today's Departure Log
									</h4>
									<div className="max-h-32 overflow-y-auto bg-gray-50 border rounded-md p-2 space-y-1">
										{[...status.departures].reverse().map((departure) => (
											<p
												key={departure.id}
												className="text-xs text-gray-600 font-mono"
											>
												<span className="font-bold text-black">
													{departure.stationName}
												</span>
												{": "}
												{formatTimeFromDate(departure.departedAt)}
											</p>
										))}
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
