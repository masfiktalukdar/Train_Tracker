import { useState } from "react";
import SideNavigation from "./adminSideNavigation";
import TopNav from "./adminTopNav";
import { Outlet } from "react-router-dom";
import { useMenuToogle } from "@/store/adminStationStore";

export default function Layout() {
	const [isSideNavOpen, setIsSideNavOpen] = useState(false);
	const { setOpenMenuIndex } = useMenuToogle();

	return (
		<div
			className="flex h-screen overflow-hidden"
			onClick={() => setOpenMenuIndex(null)}
		>
			<SideNavigation
				isOpen={isSideNavOpen}
				onClose={() => setIsSideNavOpen(false)}
			/>
			<div className="flex-1 flex flex-col overflow-hidden">
				<TopNav onMenuToggle={() => setIsSideNavOpen(true)} />
				<main className="flex-1 overflow-y-auto bg-gray-50">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
