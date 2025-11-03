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
import { getRoutes, ApiRoute } from "@/features/admin/api/routesApi";

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

			// Check if "Arrived Now"
			if (status.last_completed_station_id === stationId) {
				arrived.push(train);
				return;
			}

			// Check if "Arriving Soon" (i.e., at the previous station)
			const route = allRoutes.find((r) => r.id === train.routeId);
			if (!route) return;

			// Find the index of *this* station in the train's journey
			const stoppageMap = new Map(train.stoppages.map((s) => [s.stationId, s]));
			const actualStoppagesOnRoute =
				route.stations.filter((station) =>
					stoppageMap.has(station.stationId)
				) || [];

			const firstLegStations =
				train.direction === "up"
					? [...actualStoppagesOnRoute]
					: [...actualStoppagesOnRoute].reverse();

			const journey = [
				...firstLegStations,
				...firstLegStations.reverse().slice(1),
			];
			const thisStationJourneyIndex = journey.findIndex(
				(s) => s.stationId === stationId
			);

			if (thisStationJourneyIndex > 0) {
				// Find the previous station in the *full journey*
				const prevStationInJourney = journey[thisStationJourneyIndex - 1];
				if (
					status.last_completed_station_id === prevStationInJourney.stationId
				) {
					soon.push(train);
				}
			}
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
			<h1 className="text-4xl font-extrabold text-primary-900 text-center mb-8">
				{station.stationName}
			</h1>

			{/* Arrived Now */}
			<div className="mb-8">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">Arrived Now</h2>
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
						No trains are currently at this station.
					</p>
				)}
			</div>

			{/* Arriving Soon */}
			<div>
				<h2 className="text-2xl font-bold text-gray-800 mb-4">Arriving Soon</h2>
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
						No trains are arriving soon.
					</p>
				)}
			</div>
		</div>
	);
}
