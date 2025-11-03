import { useState } from "react";
import SideNavigation from "./adminSideNavigation";
import TopNav from "./adminTopNav";
import { Outlet } from "react-router-dom";
import { useMenuToogle } from "@/store/adminStationStore";

export default function Layout() {
	const [isSideNavOpen, setIsSideNavOpen] = useState(false);

	// This is for the station cart menus, not the main layout,
	// so it's correct to keep it.
	const { setOpenMenuIndex } = useMenuToogle();

	return (
		<div
			className="flex h-screen overflow-hidden"
			// Close station cart menus if user clicks anywhere in the layout
			onClick={() => setOpenMenuIndex(null)}
		>
			<SideNavigation
				isOpen={isSideNavOpen}
				onClose={() => setIsSideNavOpen(false)}
			/>
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Pass the toggle function to the TopNav */}
				<TopNav onMenuToggle={() => setIsSideNavOpen(true)} />
				<main className="flex-1 overflow-y-auto bg-gray-50">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
