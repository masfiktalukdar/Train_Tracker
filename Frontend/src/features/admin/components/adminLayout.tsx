
import { useState } from "react";
import SideNavigation from "./sideNavigation";
import TopNav from "./topNav";
import { Outlet } from "react-router-dom";

export default function Layout() {
	const [isSideNavOpen, setIsSideNavOpen] = useState(false);

	return (
		<div className="flex h-screen overflow-hidden">
			<SideNavigation
				isOpen={isSideNavOpen}
				onClose={() => setIsSideNavOpen(false)}
			/>
			<div className="flex-1 flex flex-col overflow-hidden">
				<TopNav/>
				<main className="flex-1 overflow-y-auto bg-gray-50">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
