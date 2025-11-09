import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStationRoutesData } from "@store/adminRoutesStore";
import {
	getRoutes,
	createRoute,
	ApiRoute,
} from "@/features/admin/api/routesApi";
import { ButtonPrimary, RoundedBlinkingButton } from "@/components/button";
import Footer from "@/components/footer";
import AdminWhiteBoardBuilder from "@/features/admin/components/adminWhiteboardBuilder";
import { useEffect } from "react";

export default function AdminStationRoutes() {
	const queryClient = useQueryClient();

	// Get UI state from Zustand
	const { activeRouteId, setActiveRoute } = useAdminStationRoutesData();

	// Fetch Server State (Routes) with TanStack Query
	const {
		data: routes = [],
		isLoading,
		isError,
	} = useQuery<ApiRoute[]>({
		queryKey: ["routes"],
		queryFn: getRoutes,
	});

	// Create New Route Mutation
	const createRouteMutation = useMutation({
		mutationFn: () => createRoute("Untitled Route"),
		onSuccess: (newRoute) => {
			// Add the new route to the cache
			queryClient.setQueryData(["routes"], (oldData: ApiRoute[] = []) => [
				...oldData,
				newRoute,
			]);
			// Set this new route as active in our UI store
			setActiveRoute(newRoute.id.toString());
		},
	});

	// Effect to set an active route if one isn't set
	useEffect(() => {
		if (!activeRouteId && routes.length > 0) {
			setActiveRoute(routes[0].id.toString());
		}
	}, [activeRouteId, routes, setActiveRoute]);

	const activeRoute = routes.find((r) => r.id.toString() === activeRouteId);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				Loading routes...
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex-1 flex items-center justify-center text-red-500">
				Error loading routes.
			</div>
		);
	}

	return (
		<div className="w-full min-h-full bg-primary-100 flex-1 flex flex-col">
			{routes.length === 0 ? (
				<RoundedBlinkingButton onClick={() => createRouteMutation.mutate()} />
			) : (
				/* Header add station and search section */
				<div className="mx-6">
					<div className="flex gap-4 justify-end mt-5 mb-6">
						<ButtonPrimary onClick={() => createRouteMutation.mutate()}>
							{createRouteMutation.isPending ? "Creating..." : "Add new route"}
						</ButtonPrimary>
						<select
							name="route-select"
							id="route"
							value={activeRouteId ?? ""}
							onChange={(e) => setActiveRoute(e.target.value)}
							className="w-60 px-3 py-2 text-[12px] lg:text-base rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ease-in-out duration-150"
						>
							<option value="" disabled>
								-- Select a route --
							</option>
							{routes.map((route) => (
								<option
									key={route.id}
									value={route.id}
									className="py-2 px-3 text-[10px] w-auto lg:text-base text-gray-700 hover:bg-indigo-100"
								>
									{route.name || "Untitled Route"}
								</option>
							))}
						</select>
					</div>

					{/* Pass the activeRoute object to the whiteboard */}
					{activeRoute ? (
						<AdminWhiteBoardBuilder activeRoute={activeRoute} />
					) : (
						<div className="text-center p-10 text-gray-500">
							Select a route to begin.
						</div>
					)}
				</div>
			)}
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
