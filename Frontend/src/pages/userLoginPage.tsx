import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { login, type AuthCredentials } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/store/useAuthStore";
import BRLogo from "@assets/bangaldesh-railway-logo.png";
import { isAxiosError } from "axios"; // Import isAxiosError

export default function UserLoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null); // Add local error state
	const navigate = useNavigate();
	const authLogin = useAuthStore((state) => state.login);

	const mutation = useMutation({
		mutationFn: (credentials: AuthCredentials) => login(credentials),
		onSuccess: (data) => {
			authLogin(data.token, data.user);
			if (data.user.role === "admin") {
				navigate("/admin/dashboard");
			} else {
				navigate("/");
			}
		},
		onError: (err) => {
			// Extract specific error message
			if (isAxiosError(err) && err.response?.data?.error) {
				setError(err.response.data.error);
			} else {
				setError(err.message || "Login failed. Please try again.");
			}
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null); // Clear previous errors
		mutation.mutate({ email, password });
	};

	return (
		<div className="flex min-h-screen">
			{/* Left Side (Branding) */}
			<div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-primary-800 text-white p-12">
				<img src={BRLogo} alt="Bangladesh Railway" className="w-48 mb-6" />
				<h1 className="text-4xl font-bold mb-4">Train Tracker</h1>
				<p className="text-xl text-primary-200 text-center">
					Welcome back. Track your journey with us.
				</p>
			</div>

			{/* Right Side (Form) */}
			<div className="flex-1 flex items-center justify-center p-6 bg-primary-100">
				<div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
					<h2 className="text-3xl font-bold text-primary-900 mb-6 text-center">
						User Login
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
								placeholder="you@example.com"
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

						{/* Improved Error Display */}
						{error && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={mutation.isPending}
							className="w-full bg-primary-700 text-white py-3 rounded-md font-semibold hover:bg-primary-800 disabled:opacity-50 transition-colors"
						>
							{mutation.isPending ? "Logging in..." : "Log In"}
						</button>
					</form>
					<p className="text-center text-sm text-gray-600 mt-6">
						Don't have an account?{" "}
						<Link
							to="/register"
							className="font-medium text-primary-700 hover:underline"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
