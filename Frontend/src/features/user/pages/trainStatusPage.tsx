import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getTrains, ApiTrain } from "@/features/admin/api/trainsApi";
import { getRoutes, ApiRoute } from "@/features/admin/api/routesApi";
import {
	getDailyStatus,
	DailyTrainStatus,
} from "@/features/admin/api/statusApi";
import { useTrainPrediction } from "@/features/user/hooks/useTrainPrediction";
import LoadingSpinner from "@/features/user/components/loadingSpinner";
import ErrorDisplay from "@/features/user/components/errorDisplay";
import TrainProgressBar from "@/features/user/components/trainProgressBar";
import {
	CheckCircle,
	AlertTriangle,
	Calendar,
	Info,
	X,
	MapPin,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
	format24HourTime,
	formatTimeFromDate,
} from "@/features/user/utils/formatTime";
import { getFullJourney } from "@/features/user/utils/predictionLogic";
import { Station } from "@/types/dataModels";

function AtStationStatus({
	stationName,
	arrivedAt,
	departureTime,
	isTurnaround,
}: {
	stationName: string;
	arrivedAt: number;
	departureTime: number;
	isTurnaround: boolean;
}) {
	const title = isTurnaround
		? `At ${stationName.split(" ")[0]} (Turnaround)`
		: `At ${stationName.split(" ")[0]}`;
	const detail = isTurnaround
		? "Waiting for turnaround. Departs at ~"
		: "Departs at ~";
	const iconColor = isTurnaround ? "text-red-600" : "text-green-600";
	const timeColor = isTurnaround ? "text-red-700" : "text-green-700";

	return (
		<div className="flex flex-col items-center justify-center p-6 text-center">
			<MapPin className={`h-16 w-16 ${iconColor} mb-4`} />
			<h2 className="text-2xl font-bold text-gray-800">{title}</h2>
			<p className="text-gray-600 mt-1 text-base">
				Arrived:{" "}
				<span className="font-semibold text-gray-700 font-mono">
					{formatTimeFromDate(arrivedAt)}
				</span>
			</p>
			<p className="text-gray-600 mt-1 text-lg">
				{detail}{" "}
				<span className={`font-semibold ${timeColor} font-mono`}>
					{formatTimeFromDate(departureTime)}
				</span>
			</p>
		</div>
	);
}

function AtFinalStationStatus({ stationName }: { stationName: string }) {
	return (
		<div className="flex flex-col items-center justify-center p-6 text-center">
			<MapPin className="h-16 w-16 text-green-600 mb-4" />
			<h2 className="text-2xl font-bold text-gray-800">
				At {stationName.split(" ")[0]}
			</h2>
			<p className="text-gray-600 mt-1 text-lg">Final destination reached.</p>
		</div>
	);
}

function PendingDepartureStatus({
	train,
	journey,
}: {
	train: ApiTrain;
	journey: Station[];
}) {
	const firstStoppage =
		journey.length > 0
			? train.stoppages.find((s) => s.stationId === journey[0].stationId)
			: null;

	const scheduledTime =
		train.direction === "up"
			? firstStoppage?.upArrivalTime
			: firstStoppage?.downArrivalTime;

	return (
		<div className="flex flex-col items-center justify-center p-6 text-center">
			<Info className="h-16 w-16 text-blue-500 mb-4" />
			<h2 className="text-2xl font-bold text-gray-800">Pending Departure</h2>
			<p className="text-gray-600 mt-1 text-lg">
				Scheduled to start at ~{" "}
				<span className="font-semibold text-blue-600 font-mono">
					{format24HourTime(scheduledTime)}
				</span>
			</p>
		</div>
	);
}

export default function TrainStatusPage() {
	const { trainId } = useParams<{ trainId: string }>();

	const [showSchedule, setShowSchedule] = useState(false);

	const { data: train, isLoading: isLoadingTrain } = useQuery<
		ApiTrain | undefined
	>({
		queryKey: ["trains", trainId],
		queryFn: async () => {
			const trains = await getTrains();
			return trains.find((t) => String(t.id) == trainId);
		},
		enabled: !!trainId,
	});

	// 2. Fetch all routes
	const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<
		ApiRoute[]
	>({
		queryKey: ["routes"],
		queryFn: getRoutes,
	});

	// 3. Get today's status
	const {
		data: status,
		isLoading: isLoadingStatus,
		isError,
		error,
		refetch,
	} = useQuery<DailyTrainStatus | null>({
		queryKey: ["dailyStatus", trainId, new Date().toISOString().split("T")[0]],
		queryFn: () =>
			// @ts-expect-error - ignoring potential string/number type mismatch for trainId
			getDailyStatus(trainId, new Date().toISOString().split("T")[0]),
		enabled: !!trainId,
		refetchInterval: 10000, 
		refetchOnWindowFocus: true,
	});

	const route = train ? routes.find((r) => r.id === train.routeId) : undefined;

	const fullJourney: Station[] = useMemo(() => {
		if (!train || !route) return [];
		return getFullJourney(route.stations, train.stoppages, train.direction);
	}, [train, route]);

	// 4. Get predictions
	const {
		predictions,
		currentTravelInfo,
		atStationInfo,
		isJourneyComplete,
		isAtFinalStation,
		warning,
		isLoading: isLoadingPrediction,
	} = useTrainPrediction(train, route, status);

	const isLoading = isLoadingTrain || isLoadingRoutes || isLoadingStatus;

	// --- Render Helpers ---
	const renderScheduleModal = () => (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
				<div className="flex justify-between items-center p-5 border-b">
					<h3 className="text-xl font-bold text-primary-900">
						Official Schedule
					</h3>
					<button
						onClick={() => setShowSchedule(false)}
						className="p-2 rounded-full hover:bg-gray-200 transition-colors"
					>
						<X className="h-6 w-6 text-gray-600" />
					</button>
				</div>
				<div className="p-6 overflow-y-auto space-y-3">
					{train?.stoppages.map((stoppage) => (
						<div
							key={stoppage.stationId}
							className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
						>
							<span className="font-medium text-gray-800">
								{stoppage.stationName}
							</span>
							<div className="flex gap-4 font-mono text-sm">
								<span className="text-green-600" title="Up Arrival">
									UP: {format24HourTime(stoppage.upArrivalTime)}
								</span>
								<span className="text-red-600" title="Down Arrival">
									DN: {format24HourTime(stoppage.downArrivalTime)}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);

	if (isLoading) {
		return <LoadingSpinner text="Loading train status..." fullPage />;
	}

	if (isError) {
		return (
			<ErrorDisplay
				title="Could not load status"
				message={error.message}
				onRetry={refetch}
				fullPage
			/>
		);
	}

	if (!train || !route || !trainId) {
		return (
			<ErrorDisplay
				title="Train not found"
				message={
					!trainId
						? "The URL does not contain a train ID."
						: "This train data could not be found."
				}
				fullPage
			/>
		);
	}

	const lastArrival = status?.arrivals.length
		? status.arrivals[status.arrivals.length - 1]
		: null;

	const showAtFinalStation =
		isAtFinalStation &&
		!atStationInfo &&
		!currentTravelInfo &&
		lastArrival &&
		!isJourneyComplete;

	return (
		<>
			{showSchedule && renderScheduleModal()}
			<div className="container mx-auto max-w-3xl py-6 px-4 pb-24 md:pb-6">
				<div className="text-center mb-6">
					<h1 className="text-3xl lg:text-4xl font-extrabold text-primary-900">
						{train.name}{" "}
						<span className="text-3xl text-primary-700 font-mono">
							({train.code})
						</span>
					</h1>
				</div>

				{/* NEW: Warning block now shows late status from hook */}
				{warning && (
					<div className="flex items-center gap-3 bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg mb-6">
						<AlertTriangle className="h-6 w-6 flex-shrink-0" />
						<p className="font-medium">{warning}</p>
					</div>
				)}

				<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
					{isJourneyComplete ? (
						<div className="flex flex-col items-center justify-center p-6 text-center">
							<CheckCircle className="h-16 w-16 text-green-500 mb-4" />
							<h2 className="text-2xl font-bold text-gray-800">
								Journey Completed
							</h2>
							<p className="text-gray-600 mt-1">
								This train has completed its route for today.
							</p>
						</div>
					) : atStationInfo ? ( 
						<AtStationStatus
							stationName={atStationInfo.stationName}
							arrivedAt={atStationInfo.arrivedAt}
							departureTime={atStationInfo.departureTime}
							isTurnaround={atStationInfo.isTurnaround}
						/>
					) : currentTravelInfo ? (
						<TrainProgressBar info={currentTravelInfo} />
					) : showAtFinalStation ? (
						<AtFinalStationStatus stationName={lastArrival!.stationName} />
					) : (
						<PendingDepartureStatus train={train} journey={fullJourney} />
					)}

					{/* Last Event Log */}
					{lastArrival &&
						!isJourneyComplete &&
						!atStationInfo &&
						!currentTravelInfo && (
							<p className="text-center text-sm text-gray-600 mt-4">
								Last arrival:{" "}
								<span className="font-bold">{lastArrival.stationName}</span> at{" "}
								<span className="font-mono">
									{formatTimeFromDate(lastArrival.arrivedAt)}
								</span>
							</p>
						)}
				</div>

				<div className="mb-6">
					<button
						onClick={() => setShowSchedule(true)}
						className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-primary-700 text-white font-semibold rounded-lg shadow-md hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
					>
						<Calendar className="h-5 w-5" />
						View Official Schedule
					</button>
				</div>

				<div>
					<h2 className="text-2xl font-bold text-gray-800 mb-4">
						Next Arrivals
					</h2>
					{isLoadingPrediction ? (
						<LoadingSpinner text="Calculating predictions..." />
					) : predictions.length > 0 ? (
						<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
							<ul className="divide-y divide-gray-200">
								{predictions.slice(0, 3).map((p, idx) => (
									<li
										key={`${p.stationId}-${idx}`}
										className="flex items-center justify-between p-4"
									>
										<span className="text-lg font-medium text-gray-800">
											{p.stationName}
										</span>
										<div className="flex items-center gap-3">
											<span
												className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
													p.type === "average"
														? "bg-blue-100 text-blue-700"
														: "bg-gray-100 text-gray-600"
												}`}
												title={
													p.type === "average"
														? "Based on 7-day average"
														: "Based on default schedule"
												}
											>
												{p.type === "average" ? "Avg" : "Est"}
											</span>
											<span className="text-lg font-bold text-gray-900 font-mono">
												~ {formatTimeFromDate(p.predictedTime)}
											</span>
										</div>
									</li>
								))}
							</ul>
						</div>
					) : (
						<div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-200">
							<p className="text-gray-600">
								{isJourneyComplete || isAtFinalStation
									? "No further arrivals for this trip."
									: "Calculating arrivals..."}
							</p>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
