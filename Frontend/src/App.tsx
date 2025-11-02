import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@features/admin/components/adminLayout";
import AdminDashboard from "@features/admin/pages/adminDashboard";
import AdminStationRoutes from "./features/admin/pages/adminStationRoutes";
import AdminStations from "@features/admin/pages/adminStations";
import AdminTrains from "@features/admin/pages/adminTrains";

// Import the new components
import ProtectedLayout from "@components/protectedLayout"; // We will update this next
import UserLoginPage from "@pages/userLoginPage";
import UserRegisterPage from "@pages/userRegisterPage";
import AdminLoginPage from "@pages/adminLoginPage";

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
				</Route>
			</Route>

			{/* Fallback redirect */}
			<Route path="/" element={<Navigate to="/login" />} />

			{/* TODO: Add user dashboard routes here, e.g. /user/dashboard */}
		</Routes>
	);
}
