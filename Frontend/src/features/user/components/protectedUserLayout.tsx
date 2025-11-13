import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * Protects routes that require a logged-in user.
 * Redirects to the /login page if the user is not authenticated.
 */
export default function ProtectedUserLayout() {
	const user = useAuthStore((state) => state.user);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (user?.role === "admin") {
		return <Navigate to="/admin/dashboard" replace />;
	}

	return <Outlet />;
}
