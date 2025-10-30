import { useAdminStationRoutesData } from "@store/adminRoutesStore";
import { ButtonPrimary, RoundedBlinkingButton } from "@/components/button";
import Footer from "@/components/footer";
import AdminWhiteBoardBuilder from "@/components/adminWhiteboardBuilder";

// helper function


export default function AdminStationRoutes() {
	// getting data
	const { activeRouteId, createNewRoute } = useAdminStationRoutesData();

	return (
		<div className="w-full min-h-full bg-primary-100 flex-1 flex flex-col">
			{!activeRouteId ? (
				<RoundedBlinkingButton onClick={createNewRoute} />
			) : (
				/* Header add station and search section */
				<div className="mx-6">
					<div className="flex gap-4 justify-end mt-5 mb-6">
						<ButtonPrimary onClick={createNewRoute}>
							Add new station
						</ButtonPrimary>
						<input
							type="input"
							placeholder="Search stations..."
							className="w-60 max-w-sm px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition placeholder:text-gray-400 text-sm bg-white"
						/>
					</div>
					<AdminWhiteBoardBuilder/>
				</div>
			)}
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
