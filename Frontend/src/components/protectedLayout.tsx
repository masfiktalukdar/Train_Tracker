import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedLayout() {
	const user = useAuthStore((state) => state.user);
	const location = useLocation();

	if (!user || user.role !== "admin") {
		return <Navigate to="/admin/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
}
