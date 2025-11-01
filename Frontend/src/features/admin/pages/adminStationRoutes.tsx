import { useAdminStationRoutesData } from "@store/adminRoutesStore";
import { ButtonPrimary, RoundedBlinkingButton } from "@/components/button";
import Footer from "@/components/footer";
import AdminWhiteBoardBuilder from "@/features/admin/components/adminWhiteboardBuilder";

// helper function

export default function AdminStationRoutes() {
	// getting data
	const { activeRouteId, setActiveRoute, createNewRoute, routes } =
		useAdminStationRoutesData();

	return (
		<div className="w-full min-h-full bg-primary-100 flex-1 flex flex-col">
			{!activeRouteId ? (
				<RoundedBlinkingButton onClick={createNewRoute} />
			) : (
				/* Header add station and search section */
				<div className="mx-6">
					<div className="flex gap-4 justify-end mt-5 mb-6">
						<ButtonPrimary onClick={createNewRoute}>
							Add new route
						</ButtonPrimary>
						<select
							name="route-select"
							id="route"
							value={activeRouteId ?? ""}
							onChange={(e) => setActiveRoute(e.target.value)}
							className="w-60 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ease-in-out duration-150"
						>
							<option value="" disabled>
								-- Select a route --
							</option>
							{Object.values(routes).map((route) => (
								<option
									key={route.id}
									value={route.id}
									className="py-2 px-3 text-gray-700 hover:bg-indigo-100"
								>
									{route.name || "Untitled Route"}
								</option>
							))}
						</select>
					</div>
					<h1 className="text-gray-900 text-xl font-semibold mb-6">
						Admin Route Builder (up)
					</h1>
					<AdminWhiteBoardBuilder />
				</div>
			)}
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
