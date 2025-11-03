import { LogOut, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TopNavgiationProp } from "@app-types/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function TopNav({ onMenuToggle }: TopNavgiationProp) {
	const [upperNavContent, setUpperNavContent] = useState("");
	const location = useLocation();
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);

	useEffect(() => {
		const pathSegment = location.pathname.split("/").pop();
		switch (pathSegment) {
			case "dashboard":
				setUpperNavContent("Admin Dashboard");
				break;
			case "trains":
				setUpperNavContent("All Trains");
				break;
			case "stations":
				setUpperNavContent("All Stations");
				break;
			case "routes":
				setUpperNavContent("Available Routes");
				break;
			default:
				setUpperNavContent("Admin Panel");
				break;
		}
	}, [location.pathname]);

	const handleLogout = () => {
		logout();
		navigate("/admin/login", { replace: true });
	};

	return (
		<div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
			<div className="flex items-center gap-4">
				{/* Hamburger Menu Button - Only visible on mobile (lg:hidden) */}
				<button
					onClick={onMenuToggle}
					className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
					aria-label="Open navigation"
				>
					<Menu className="w-6 h-6" />
				</button>
				<div className="text-lg text-primary-950 font-bold">
					{upperNavContent}
				</div>
			</div>
			<div className="flex items-center gap-4">
				{/* Hide "Welcome, Admin" on extra-small screens */}
				<div className="hidden sm:block text-base text-gray-600 font-normal">
					Welcome, Admin
				</div>
				<button
					onClick={handleLogout}
					className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					aria-label="Log out"
				>
					<LogOut className="w-5 h-5 text-gray-600 hover:text-red-500" />
				</button>
			</div>
		</div>
	);
}
