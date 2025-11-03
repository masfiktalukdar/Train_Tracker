import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getTrains, ApiTrain } from "@/features/admin/api/trainsApi";
import { getRoutes, ApiRoute } from "@/features/admin/api/routesApi";
import {
	getDailyStatus,
	DailyTrainStatus,
} from "@/features/admin/api/statusApi";
import { useTrainPrediction } from "@features/user/hooks/useTrainPrediction";
import LoadingSpinner from "@features/user/components/loadingSpinner";
import ErrorDisplay from "@features/user/components/errorDisplay";
import TrainProgressBar from "@features/user/components/trainProgressBar";
import {
	CheckCircle,
	AlertTriangle,
	Calendar,
	Info,
  X,
} from "lucide-react";
import { useState } from "react";

export default function TrainStatusPage() {
	const { trainId } = useParams<{ trainId: string }>();
	const [showSchedule, setShowSchedule] = useState(false);

	// 1. Fetch this specific train
	const { data: train, isLoading: isLoadingTrain } = useQuery<
		ApiTrain | undefined
	>({
		queryKey: ["trains", trainId],
		queryFn: async () => {
			const trains = await getTrains();
			return trains.find((t) => t.id.toString() === trainId);
		},
	});

	// 2. Fetch all routes (needed to find the train's route)
	const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<
		ApiRoute[]
	>({
		queryKey: ["routes"],
		queryFn: getRoutes,
	});

	// 3. Get today's status for this train
	const {
		data: status,
		isLoading: isLoadingStatus,
		isError,
		error,
		refetch,
	} = useQuery<DailyTrainStatus | null>({
		queryKey: ["dailyStatus", trainId, new Date().toISOString().split("T")[0]],
		queryFn: () =>
			getDailyStatus(Number(trainId), new Date().toISOString().split("T")[0]),
		enabled: !!trainId,
		// Refetch status every 30 seconds
		refetchInterval: 30000,
	});

	// Find the train's route object
	const route = train ? routes.find((r) => r.id === train.routeId) : undefined;

	// 4. Get predictions
	const {
		predictions,
		currentTravelInfo,
		warning,
		isLoading: isLoadingPrediction,
	} = useTrainPrediction(train, route, status);

	const isLoading = isLoadingTrain || isLoadingRoutes || isLoadingStatus;

	// --- Render Schedule Modal ---
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
									UP: {stoppage.upArrivalTime}
								</span>
								<span className="text-red-600" title="Down Arrival">
									DN: {stoppage.downArrivalTime}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);

	// --- Render Main Content ---
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

	if (!train || !route) {
		return (
			<ErrorDisplay
				title="Train not found"
				message="This train data could not be found."
				fullPage
			/>
		);
	}

	const lastArrival = status?.arrivals.length
		? status.arrivals[status.arrivals.length - 1]
		: null;

	return (
		<>
			{showSchedule && renderScheduleModal()}
			<div className="container mx-auto max-w-3xl py-6 px-4 pb-24 md:pb-6">
				{/* --- Header --- */}
				<div className="text-center mb-6">
					<h1 className="text-4xl font-extrabold text-primary-900">
						{train.name}
					</h1>
					<p className="text-lg text-gray-600 font-mono">{train.code}</p>
				</div>

				{/* --- Lateness Warning --- */}
				{warning && (
					<div className="flex items-center gap-3 bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-6">
						<AlertTriangle className="h-6 w-6 flex-shrink-0" />
						<p className="font-medium">{warning}</p>
					</div>
				)}

				{/* --- Current Status / Progress Bar --- */}
				<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
					{status?.lap_completed ? (
						<div className="flex flex-col items-center justify-center p-6 text-center">
							<CheckCircle className="h-16 w-16 text-green-500 mb-4" />
							<h2 className="text-2xl font-bold text-gray-800">
								Journey Completed
							</h2>
							<p className="text-gray-600 mt-1">
								This train has completed its lap for today.
							</p>
						</div>
					) : currentTravelInfo ? (
						<TrainProgressBar info={currentTravelInfo} />
					) : (
						<div className="flex flex-col items-center justify-center p-6 text-center">
							<Info className="h-16 w-16 text-blue-500 mb-4" />
							<h2 className="text-2xl font-bold text-gray-800">
								Pending Departure
							</h2>
							<p className="text-gray-600 mt-1">
								This train has not started its journey yet.
							</p>
						</div>
					)}
					{lastArrival && !status?.lap_completed && (
						<p className="text-center text-sm text-gray-600 mt-4">
							Last arrival:{" "}
							<span className="font-bold">{lastArrival.stationName}</span> at{" "}
							{new Date(lastArrival.arrivedAt).toLocaleTimeString()}
						</p>
					)}
				</div>

				{/* --- Schedule Button --- */}
				<div className="mb-6">
					<button
						onClick={() => setShowSchedule(true)}
						className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-primary-700 text-white font-semibold rounded-lg shadow-md hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
					>
						<Calendar className="h-5 w-5" />
						View Official Schedule
					</button>
				</div>

				{/* --- Next Arrivals --- */}
				<div>
					<h2 className="text-2xl font-bold text-gray-800 mb-4">
						Next Arrivals
					</h2>
					{isLoadingPrediction ? (
						<LoadingSpinner text="Calculating predictions..." />
					) : predictions.length > 0 ? (
						<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
							<ul className="divide-y divide-gray-200">
								{predictions.map((p) => (
									<li
										key={p.stationId}
										className="flex items-center justify-between p-4"
									>
										<span className="text-lg font-medium text-gray-800">
											{p.stationName}
										</span>
										<div className="flex items-center gap-2">
											<span
												className={`text-sm font-semibold ${p.type === "average" ? "text-blue-600" : "text-gray-500"}`}
												title={
													p.type === "average"
														? "Based on 7-day average"
														: "Based on default schedule"
												}
											>
												{p.type === "average" ? "Avg" : "Est"}
											</span>
											<span className="text-lg font-bold text-gray-900 font-mono">
												~{" "}
												{p.predictedTime?.toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												}) || "..."}
											</span>
										</div>
									</li>
								))}
							</ul>
						</div>
					) : (
						<div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-200">
							<p className="text-gray-600">
								No further arrivals for this trip.
							</p>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
