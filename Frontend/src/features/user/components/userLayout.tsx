import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, ChevronLeft, Home, Train, Building } from "lucide-react";
import BRLogo from "@assets/bangaldesh-railway-logo.png";

/**
 * The main application shell for a logged-in user.
 * Includes a responsive header and navigation.
 */
export default function UserLayout() {
	const logout = useAuthStore((state) => state.logout);
	const user = useAuthStore((state) => state.user);
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	// Determine title and if back button should show
	const getHeaderConfig = () => {
		const path = location.pathname;
		if (path === "/")
			return {
				title: `Welcome, ${user?.email?.split("@")[0] || "User"}!`,
				showBack: false,
				showLogo: true,
			};
		if (path.startsWith("/trains/"))
			return { title: "Train Status", showBack: true, showLogo: false };
		if (path === "/trains")
			return { title: "Select a Train", showBack: true, showLogo: false };
		if (path.startsWith("/stations/"))
			return { title: "Station Status", showBack: true, showLogo: false };
		if (path === "/stations")
			return { title: "Select a Station", showBack: true, showLogo: false };
		return { title: "Train Tracker", showBack: false, showLogo: true };
	};

	const { title, showBack, showLogo } = getHeaderConfig();

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
			{/* --- Header --- */}
			<header className="sticky top-0 z-30 w-full bg-white shadow-md">
				<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						{/* Left Side: Back Button or Logo */}
						<div className="flex-1 flex justify-start">
							{showBack ? (
								<button
									onClick={() => navigate(-1)}
									className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
									aria-label="Go back"
								>
									<ChevronLeft className="h-6 w-6" />
								</button>
							) : showLogo ? (
								<Link to="/" className="flex items-center gap-2 flex-shrink-0">
									<img className="h-8 w-auto" src={BRLogo} alt="Logo" />
								</Link>
							) : (
								<div className="w-10"></div> // Placeholder for alignment
							)}
						</div>

						{/* Center: Title */}
						<div className="flex-1 flex justify-center">
							<h1 className="text-lg font-bold text-primary-900 truncate px-2">
								{title}
							</h1>
						</div>

						{/* Right Side: Logout */}
						<div className="flex-1 flex justify-end">
							<button
								onClick={handleLogout}
								className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
								aria-label="Log out"
							>
								<LogOut className="h-6 w-6" />
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* --- Main Content --- */}
			<main className="flex-1">
				<Outlet />
			</main>

			{/* --- Bottom Navigation (Mobile Only) --- */}
			<nav className="sticky bottom-0 z-30 w-full bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.06)] md:hidden">
				<div className="flex justify-around items-center h-16">
					<Link
						to="/"
						className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${location.pathname === "/" ? "text-primary-700" : "text-gray-500 hover:bg-gray-100"}`}
					>
						<Home className="h-6 w-6 mb-1" />
						<span className="text-xs font-medium">Home</span>
					</Link>
					<Link
						to="/trains"
						className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${location.pathname.startsWith("/trains") ? "text-primary-700" : "text-gray-500 hover:bg-gray-100"}`}
					>
						<Train className="h-6 w-6 mb-1" />
						<span className="text-xs font-medium">Trains</span>
					</Link>
					<Link
						to="/stations"
						className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${location.pathname.startsWith("/stations") ? "text-primary-700" : "text-gray-500 hover:bg-gray-100"}`}
					>
						<Building className="h-6 w-6 mb-1" />
						<span className="text-xs font-medium">Stations</span>
					</Link>
				</div>
			</nav>
		</div>
	);
}
