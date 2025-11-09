import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login, type AuthCredentials } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/store/useAuthStore";
import AdminAvatar from "@assets/admin-avatar.png";
import { isAxiosError } from "axios"; // Import isAxiosError

export default function AdminLoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const authLogin = useAuthStore((state) => state.login);

	const mutation = useMutation({
		mutationFn: (credentials: AuthCredentials) => login(credentials),
		onSuccess: (data) => {
			if (data.user.role === "admin") {
				authLogin(data.token, data.user);
				navigate("/admin/dashboard");
			} else {
				setError("Access Forbidden: You are not an administrator.");
			}
		},
		onError: (err) => {
			// Extract specific error message from backend response
			if (isAxiosError(err) && err.response?.data?.error) {
				setError(err.response.data.error);
			} else {
				setError(err.message || "An unexpected error occurred.");
			}
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		mutation.mutate({ email, password });
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-primary-950 p-6">
			<div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-2xl">
				<img src={AdminAvatar} alt="Admin" className="w-24 h-24 mx-auto mb-4" />
				<h2 className="text-3xl font-bold text-primary-900 mb-6 text-center">
					Admin Portal
				</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							placeholder="admin@example.com"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1 w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							placeholder="••••••••"
							required
						/>
					</div>
					{/* Display the error state, which now holds the better message */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
							{error}
						</div>
					)}
					<button
						type="submit"
						disabled={mutation.isPending}
						className="w-full bg-primary-800 text-white py-3 rounded-md font-semibold hover:bg-primary-900 disabled:opacity-50 transition-colors"
					>
						{mutation.isPending ? "Signing In..." : "Sign In"}
					</button>
				</form>
			</div>
		</div>
	);
}
