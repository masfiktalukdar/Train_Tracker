import { Routes, Route, Navigate } from "react-router-dom";

// Admin Imports
import Layout from "@features/admin/components/adminLayout";
import AdminDashboard from "@features/admin/pages/adminDashboard";
import AdminStationRoutes from "./features/admin/pages/adminStationRoutes";
import AdminStations from "@features/admin/pages/adminStations";
import AdminTrains from "@features/admin/pages/adminTrains";
import AdminFeedbackPage from "@features/admin/pages/adminFeedback"; // NEW
import ProtectedLayout from "@components/protectedLayout"; // Admin protected layout
import AdminLoginPage from "@pages/adminLoginPage";

// Public Auth Imports
import UserLoginPage from "@pages/userLoginPage";
import UserRegisterPage from "@pages/userRegisterPage";

// New User App Imports
import ProtectedUserLayout from "@features/user/components/protectedUserLayout";
import UserLayout from "@features/user/components/userLayout";
import OnboardingPage from "@features/user/pages/onboardingPage";
import UserHomePage from "@features/user/pages/userHomePage";
import TrainListPage from "@features/user/pages/trainsListPage";
import StationListPage from "@features/user/pages/stationListPage";
import TrainStatusPage from "@features/user/pages/trainStatusPage";
import StationStatusPage from "@features/user/pages/stationStatusPage";
import AboutPage from "./features/user/pages/aboutPage";
import ContactPage from "@features/user/pages/contactPage"; // NEW
import { useInterfaceStore } from "@store/useInterfaceStore";

/**
 * A simple wrapper to handle the one-time onboarding flow.
 */
function OnboardingGate() {
	const hasOnboarded = useInterfaceStore((state) => state.hasOnboarded);
	if (!hasOnboarded) {
		return <OnboardingPage />;
	}
	// User has onboarded, show them the main app layout
	return <UserLayout />;
}

export default function App() {
	return (
		<Routes>
			{/* Public Auth Routes */}
			<Route path="/login" element={<UserLoginPage />} />
			<Route path="/register" element={<UserRegisterPage />} />
			<Route path="/admin/login" element={<AdminLoginPage />} />

			{/* Protected Admin Routes */}
			<Route element={<ProtectedLayout />}>
				<Route path="admin" element={<Layout />}>
					<Route index element={<Navigate to="dashboard" />} />
					<Route path="dashboard" element={<AdminDashboard />} />
					<Route path="routes" element={<AdminStationRoutes />} />
					<Route path="trains" element={<AdminTrains />} />
					<Route path="stations" element={<AdminStations />} />
					{/* NEW ADMIN ROUTE */}
					<Route path="feedback" element={<AdminFeedbackPage />} />
				</Route>
			</Route>

			{/* Protected User Routes */}
			<Route element={<ProtectedUserLayout />}>
				<Route path="/" element={<OnboardingGate />}>
					{/* These routes render inside UserLayout's <Outlet> */}
					<Route index element={<UserHomePage />} />
					<Route path="trains" element={<TrainListPage />} />
					<Route path="trains/:trainId" element={<TrainStatusPage />} />
					<Route path="stations" element={<StationListPage />} />
					<Route path="stations/:stationId" element={<StationStatusPage />} />
					<Route path="about" element={<AboutPage />} />
					{/* NEW USER ROUTE */}
					<Route path="contact" element={<ContactPage />} />
				</Route>
			</Route>

			{/* Fallback redirect for any other path */}
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	);
}
