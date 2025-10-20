// ...existing code...
import { useState } from "react";
import SideNavigation from "./sideNavigation";
import TopNav from "./topNav";
import { Outlet } from "react-router-dom";
import Footer from "@components/footer";

export default function Layout() {
	const [isSideNavOpen, setIsSideNavOpen] = useState(false);

	return (
		<div className="flex h-screen overflow-hidden">
			<SideNavigation
				isOpen={isSideNavOpen}
				onClose={() => setIsSideNavOpen(false)}
			/>
			{/* main column: full height, column flex */}
			<div className="flex-1 flex flex-col min-h-0">
				<TopNav />
				<main className="flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<Outlet />
					</div>
					<Footer />
				</main>
			</div>
		</div>
	);
}
