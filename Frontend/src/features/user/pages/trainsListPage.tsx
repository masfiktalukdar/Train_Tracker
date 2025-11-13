import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRoutes, ApiRoute } from "@features/admin/api/routesApi";
import { getTrains, ApiTrain } from "@features/admin/api/trainsApi";
import {
	getDailyStatus,
	DailyTrainStatus,
} from "@features/admin/api/statusApi";
import LoadingSpinner from "@features/user/components/loadingSpinner";
import ErrorDisplay from "@features/user/components/errorDisplay";
import TrainCard from "@features/user/components/trainCard";
import { ChevronDown } from "lucide-react";

export default function TrainListPage() {
	const [selectedRouteId, setSelectedRouteId] = useState<string>("");

	// 1. Fetch all routes
	const {
		data: routes = [],
		isLoading: isLoadingRoutes,
		isError: isErrorRoutes,
		error: errorRoutes,
		refetch: refetchRoutes,
	} = useQuery<ApiRoute[]>({
		queryKey: ["routes"],
		queryFn: getRoutes,
	});

	// 2. Fetch all trains
	const {
		data: allTrains = [],
		isLoading: isLoadingTrains,
		isError: isErrorTrains,
		error: errorTrains,
		refetch: refetchTrains,
	} = useQuery<ApiTrain[]>({
		queryKey: ["trains"],
		queryFn: getTrains,
	});

	useEffect(() => {
		if (!selectedRouteId && routes.length > 0) {
			setSelectedRouteId(routes[0].id.toString());
		}
	}, [routes, selectedRouteId]); 

	// 3. Filter trains based on selected route
	const filteredTrains = allTrains.filter(
		(train) => train.routeId.toString() === selectedRouteId
	);

	// 4. Fetch status ONLY for the filtered trains
	// This query's key depends on selectedRouteId, so it will refetch when that changes
	const { data: trainStatuses, isLoading: isLoadingStatuses } = useQuery<
		Map<number, DailyTrainStatus | null>
	>({
		queryKey: ["trainStatuses", selectedRouteId],
		queryFn: async () => {
			const currentFilteredTrains = allTrains.filter(
				(train) => train.routeId.toString() === selectedRouteId
			);

			const statuses = new Map<number, DailyTrainStatus | null>();
			const today = new Date().toISOString().split("T")[0];

			const statusPromises = currentFilteredTrains.map((train) =>
				getDailyStatus(train.id, today).then((status) => ({
					trainId: train.id,
					status: status,
				}))
			);

			const results = await Promise.all(statusPromises);
			for (const result of results) {
				statuses.set(result.trainId, result.status);
			}
			return statuses;
		},
		enabled:
			!isLoadingRoutes &&
			!isLoadingTrains &&
			filteredTrains.length > 0 &&
			!!selectedRouteId,
	});

	const isLoading = isLoadingRoutes || isLoadingTrains;
	const isError = isErrorRoutes || isErrorTrains;
	const error = errorRoutes || errorTrains;

	const renderContent = () => {
		if (isLoading) {
			return <LoadingSpinner text="Loading train data..." fullPage />;
		}
		if (isError) {
			return (
				<ErrorDisplay
					title="Failed to load data"
					message={error?.message || "An unknown error occurred"}
					onRetry={() => {
						refetchRoutes();
						refetchTrains();
					}}
					fullPage
				/>
			);
		}
		// Show error if no routes exist
		if (routes.length === 0) {
			return (
				<ErrorDisplay
					title="No routes found"
					message="Admin needs to create a route first."
					fullPage
				/>
			);
		}

		// Show status loader ONLY if we are fetching statuses
		if (isLoadingStatuses) {
			return <LoadingSpinner text="Fetching live status..." fullPage />;
		}

		// Show if no trains are on this route
		if (filteredTrains.length === 0) {
			return (
				<div className="text-center p-10 bg-white rounded-xl shadow border">
					<h3 className="text-xl font-medium text-gray-700">No trains found</h3>
					<p className="text-gray-500 mt-2">
						There are no trains available on this route yet...
					</p>
				</div>
			);
		}

		// Otherwise, render the list
		return (
			<div className="space-y-4">
				{filteredTrains.map((train) => (
					<TrainCard
						key={train.id}
						train={train}
						route={routes.find((r) => r.id === train.routeId)}
						status={trainStatuses?.get(train.id)}
					/>
				))}
			</div>
		);
	};

	return (
		<div className="bg-gray-100 min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-64px)]">
			<div className="container mx-auto max-w-3xl py-6 px-4 pb-24 md:pb-6">
				{/* --- Route Selector --- */}
				<div className="relative mb-6">
					<label
						htmlFor="route-select"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Select Your Route
					</label>
					<div className="relative">
						<select
							id="route-select"
							value={selectedRouteId}
							onChange={(e) => setSelectedRouteId(e.target.value)}
							className="w-full pl-4 pr-10 py-3 text-base font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none bg-white shadow-sm"
							disabled={isLoadingRoutes}
						>
							{routes.map((route) => (
								<option
									key={route.id}
									value={route.id.toString()}
									className="font-medium"
								>
									{route.name}
								</option>
							))}
						</select>
						<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
					</div>
				</div>

				{/* --- Train List --- */}
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					Available Trains
				</h2>
				{renderContent()}
			</div>
		</div>
	);
}
