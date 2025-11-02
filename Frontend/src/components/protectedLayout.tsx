import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedLayout() {
	const user = useAuthStore((state) => state.user);
	const location = useLocation();

	if (!user || user.role !== "admin") {
		// Redirect them to the *admin* login page
		// Save the location they were trying to go to
		return <Navigate to="/admin/login" state={{ from: location }} replace />;
	}

	// User is an admin and is authenticated, render the admin layout
	return <Outlet />;
}
