import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useMemo, useState } from "react";
import { Menu, X, LogOut, Home, Train, Building } from "lucide-react";

/**
 * UserLayout.tsx
 * - Left: Hamburger + "Train Tracker"
 * - Center: empty
 * - Right: Logout button (functional)
 * - Slide-in nav drawer (CSS + React)
 */

interface HeaderConfig {
	title: string;
	showBack: boolean;
	showLogo: boolean;
}

const useHeaderConfig = (pathname: string, userEmail?: string): HeaderConfig =>
	useMemo(() => {
		if (pathname === "/") {
			return {
				title: `Welcome, ${userEmail?.split("@")[0] || "User"}!`,
				showBack: false,
				showLogo: true,
			};
		}

		if (pathname.startsWith("/trains/"))
			return { title: "Train Status", showBack: true, showLogo: false };

		if (pathname === "/trains")
			return { title: "Select a Train", showBack: true, showLogo: false };

		if (pathname.startsWith("/stations/"))
			return { title: "Station Status", showBack: true, showLogo: false };

		if (pathname === "/stations")
			return { title: "Select a Station", showBack: true, showLogo: false };

		return { title: "Train Tracker", showBack: false, showLogo: true };
	}, [pathname, userEmail]);

export default function UserLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const logout = useAuthStore((state) => state.logout);
	const user = useAuthStore((state) => state.user);
	const { title } = useHeaderConfig(location.pathname, user?.email);

	const [menuOpen, setMenuOpen] = useState(false);

	const handleLogout = () => {
		// call your auth store logout, then navigate to login
		logout();
		navigate("/login");
	};

	const closeMenuAndNavigate = (to: string) => {
		setMenuOpen(false);
		navigate(to);
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
			{/* === Header === */}
			<header className="sticky top-0 z-40 w-full bg-white shadow-md">
				<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						{/* LEFT: Hamburger + "Train Tracker" */}
						<div className="flex items-center gap-3">
							<button
								onClick={() => setMenuOpen(true)}
								className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
								aria-label="Open menu"
							>
								<Menu className="h-6 w-6" />
							</button>

							<span className="text-lg font-semibold text-primary-900 select-none">
								{title}
							</span>
						</div>

						{/* RIGHT: Logout */}
						<div className="flex items-center justify-end">
							<button
								onClick={handleLogout}
								className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
								aria-label="Log out"
								title="Log out"
							>
								<LogOut className="h-6 w-6" />
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* === Slide-in Drawer === */}
			<aside
				className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 z-50 ${
					menuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
				aria-hidden={!menuOpen}
			>
				<div className="flex items-center justify-between p-5 border-b border-gray-200">
					<div className="flex items-center gap-2">
						<Menu className="h-5 w-5 text-gray-700" />
						<span className="font-semibold text-gray-800">Menu</span>
					</div>
					<button
						onClick={() => setMenuOpen(false)}
						className="p-2 rounded-md hover:bg-gray-100 transition"
						aria-label="Close menu"
					>
						<X className="h-5 w-5 text-gray-700" />
					</button>
				</div>

				<nav className="p-4 flex flex-col gap-3">
					<button
						onClick={() => closeMenuAndNavigate("/")}
						className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition ${
							location.pathname === "/"
								? "bg-gray-100 font-medium"
								: "text-gray-700"
						}`}
					>
						<div className="flex items-center gap-3">
							<Home className="h-5 w-5" />
							<span>Home</span>
						</div>
					</button>

					<button
						onClick={() => closeMenuAndNavigate("/trains")}
						className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition ${
							location.pathname.startsWith("/trains")
								? "bg-gray-100 font-medium"
								: "text-gray-700"
						}`}
					>
						<div className="flex items-center gap-3">
							<Train className="h-5 w-5" />
							<span>Trains</span>
						</div>
					</button>

					<button
						onClick={() => closeMenuAndNavigate("/stations")}
						className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition ${
							location.pathname.startsWith("/stations")
								? "bg-gray-100 font-medium"
								: "text-gray-700"
						}`}
					>
						<div className="flex items-center gap-3">
							<Building className="h-5 w-5" />
							<span>Stations</span>
						</div>
					</button>

					<hr className="my-2 border-gray-200" />

					<Link
						to="/about"
						onClick={() => closeMenuAndNavigate("/about")}
						className="px-3 py-2 rounded-md hover:bg-gray-50 transition text-gray-700"
					>
						About
					</Link>
					<Link
						to="/contact"
						onClick={() => setMenuOpen(false)}
						className="px-3 py-2 rounded-md hover:bg-gray-50 transition text-gray-700"
					>
						Contact
					</Link>
				</nav>

				<div className="mt-auto p-4 border-t border-gray-100">
					<div className="text-sm text-gray-600 mb-2">Signed in as</div>
					<div className="text-sm font-medium text-gray-900 truncate">
						{user?.email ?? "User"}
					</div>
				</div>
			</aside>

			{/* Overlay */}
			{menuOpen && (
				<div
					onClick={() => setMenuOpen(false)}
					className="fixed inset-0 bg-black/40 z-40"
					aria-hidden
				/>
			)}

			{/* === Main Content === */}
			<main className="flex-1">
				<Outlet />
			</main>

			{/* === Bottom Navigation (Mobile only) === */}
			<nav className="sticky bottom-0 z-30 w-full bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.06)] md:hidden">
				<div className="flex justify-around items-center h-16">
					<Link
						to="/"
						className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
							location.pathname === "/"
								? "text-primary-700"
								: "text-gray-500 hover:bg-gray-100"
						}`}
					>
						<Home className="h-6 w-6 mb-1" />
						<span className="text-xs font-medium">Home</span>
					</Link>

					<Link
						to="/trains"
						className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
							location.pathname.startsWith("/trains")
								? "text-primary-700"
								: "text-gray-500 hover:bg-gray-100"
						}`}
					>
						<Train className="h-6 w-6 mb-1" />
						<span className="text-xs font-medium">Trains</span>
					</Link>

					<Link
						to="/stations"
						className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
							location.pathname.startsWith("/stations")
								? "text-primary-700"
								: "text-gray-500 hover:bg-gray-100"
						}`}
					>
						<Building className="h-6 w-6 mb-1" />
						<span className="text-xs font-medium">Stations</span>
					</Link>
				</div>
			</nav>
		</div>
	);
}
