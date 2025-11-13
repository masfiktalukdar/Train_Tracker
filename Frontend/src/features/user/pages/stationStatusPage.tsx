import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getStations, ApiStation } from "@/features/admin/api/stationsApi";
import { getTrains, ApiTrain } from "@/features/admin/api/trainsApi";
import {
	getDailyStatus,
	DailyTrainStatus,
} from "@/features/admin/api/statusApi";
import LoadingSpinner from "@features/user/components/loadingSpinner";
import ErrorDisplay from "@features/user/components/errorDisplay";
import TrainCard from "@features/user/components/trainCard";
import { getRoutes, ApiRoute } from "@features/admin/api/routesApi";
import { MapPin, ExternalLink } from "lucide-react";
import { getFullJourney } from "../utils/predictionLogic"; // Import helper

export default function StationStatusPage() {
	const { stationId } = useParams<{ stationId: string }>();

	// 1. Fetch all stations (to find this one)
	const { data: stations = [], isLoading: isLoadingStations } = useQuery<
		ApiStation[]
	>({
		queryKey: ["stations"],
		queryFn: getStations,
	});

	// 2. Fetch all trains
	const { data: allTrains = [], isLoading: isLoadingTrains } = useQuery<
		ApiTrain[]
	>({
		queryKey: ["trains"],
		queryFn: getTrains,
	});

	// 3. Fetch all routes
	const { data: allRoutes = [], isLoading: isLoadingRoutes } = useQuery<
		ApiRoute[]
	>({
		queryKey: ["routes"],
		queryFn: getRoutes,
	});

	// Find the trains that stop at this station
	const relevantTrains = useMemo(() => {
		return allTrains.filter((train) =>
			train.stoppages.some((s) => s.stationId === stationId)
		);
	}, [allTrains, stationId]);

	// 4. Fetch statuses ONLY for relevant trains
	const today = new Date().toISOString().split("T")[0];
	const statusQueries = useQueries({
		queries: relevantTrains.map((train) => ({
			queryKey: ["dailyStatus", train.id, today],
			queryFn: () => getDailyStatus(train.id, today),
			staleTime: 1000 * 60, // Cache status for 1 minute
			refetchInterval: 10000, // Refetch every 10 seconds
		})),
	});

	const isLoading =
		isLoadingStations ||
		isLoadingTrains ||
		isLoadingRoutes ||
		statusQueries.some((q) => q.isLoading);
	const station = stations.find((s) => s.stationId === stationId);

	// Process data to find trains "Arrived Now" and "Arriving Soon"
	const { arrivedNow, arrivingSoon } = useMemo(() => {
		const arrived: ApiTrain[] = [];
		const soon: ApiTrain[] = [];

		relevantTrains.forEach((train, index) => {
			const statusResult = statusQueries[index];
			if (!statusResult || !statusResult.data) return;

			const status = statusResult.data as DailyTrainStatus | null;
			if (!status || status.lap_completed) return;

			const arrivalsCount = status.arrivals.length || 0;
			const departuresCount = status.departures?.length || 0;
			const lastArrivalRecord = status.arrivals[arrivalsCount - 1];

			// --- "Arrived Now" Logic ---
			// Train is "Arrived Now" if its last arrival was *this* station
			// AND it has *not yet departed* from it.
			if (
				lastArrivalRecord &&
				lastArrivalRecord.stationId === stationId &&
				arrivalsCount > departuresCount
			) {
				arrived.push(train);
				return;
			}

			// --- "Arriving Soon" Logic ---
			const route = allRoutes.find((r) => r.id === train.routeId);
			if (!route) return;

			const journey = getFullJourney(
				route.stations,
				train.stoppages,
				train.direction
			);
			if (journey.length === 0) return;

			if (arrivalsCount === 0) {
				// Case 1: PENDING DEPARTURE.
				// If this is the first station in the journey, it's "Arriving Soon" (as in, "at station, pending").
				const firstStationInJourney = journey[0];
				if (
					firstStationInJourney &&
					firstStationInJourney.stationId === stationId
				) {
					soon.push(train);
				}
			} else if (arrivalsCount === departuresCount) {
				// Case 2: EN ROUTE.
				// The train has departed its last stop. Check if its *next*
				// stop (at index `arrivalsCount`) is this station.
				const nextStationInJourney = journey[arrivalsCount];
				if (
					nextStationInJourney &&
					nextStationInJourney.stationId === stationId
				) {
					soon.push(train);
				}
			}
			// If (arrivalsCount > departuresCount), train is AT a station (handled by "Arrived Now").
			// If it's at a *different* station, it's neither "Arrived Now" nor "Arriving Soon"
			// for *this* station, so we do nothing.
		});

		return { arrivedNow: arrived, arrivingSoon: soon };
	}, [relevantTrains, statusQueries, stationId, allRoutes]);

	if (isLoading) {
		return <LoadingSpinner text="Loading station data..." fullPage />;
	}

	if (!station) {
		return (
			<ErrorDisplay
				title="Station not found"
				message="This station data could not be found."
				fullPage
			/>
		);
	}

	const getStatusForTrain = (trainId: number) => {
		const trainIndex = relevantTrains.findIndex((t) => t.id === trainId);
		if (trainIndex === -1) return null;
		const queryResult = statusQueries[trainIndex];
		return queryResult?.data as DailyTrainStatus | null | undefined;
	};

	return (
		<div className="container mx-auto max-w-3xl py-6 px-4 pb-24 md:pb-6">
			{/* --- Improved Header --- */}
			<div className="text-center mb-8 bg-white p-6 rounded-xl shadow-md border border-gray-200">
				<h1 className="text-3xl font-extrabold text-primary-900 mb-2">
					{station.stationName}
				</h1>
				<div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
					<MapPin className="h-5 w-5" />
					<span className="text-lg">{station.stationLocation}</span>
				</div>
				{station.stationLocationURL && (
					<a
						href={station.stationLocationURL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-colors"
					>
						View on Map
						<ExternalLink className="h-4 w-4" />
					</a>
				)}
			</div>

			{/* Arrived Now */}
			<div className="mb-8">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					Arrived Now (On Platform)
				</h2>
				{arrivedNow.length > 0 ? (
					<div className="space-y-4">
						{arrivedNow.map((train) => (
							<TrainCard
								key={train.id}
								train={train}
								route={allRoutes.find((r) => r.id === train.routeId)}
								status={getStatusForTrain(train.id)}
							/>
						))}
					</div>
				) : (
					<p className="text-gray-500 text-center p-6 bg-white rounded-xl shadow-md border">
						No trains are currently at this station platform.
					</p>
				)}
			</div>

			{/* Arriving Soon */}
			<div>
				<h2 className="text-2xl font-bold text-gray-800 mb-4">Arriving Next</h2>
				{arrivingSoon.length > 0 ? (
					<div className="space-y-4">
						{arrivingSoon.map((train) => (
							<TrainCard
								key={train.id}
								train={train}
								route={allRoutes.find((r) => r.id === train.routeId)}
								status={getStatusForTrain(train.id)}
							/>
						))}
					</div>
				) : (
					<p className="text-gray-500 text-center p-6 bg-white rounded-xl shadow-md border">
						No incoming trains detected for this station right now.
					</p>
				)}
			</div>
		</div>
	);
}
