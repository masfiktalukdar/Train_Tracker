import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { register, type AuthCredentials } from "@/features/auth/api/authApi";
import BRLogo from "@assets/bangaldesh-railway-logo.png";
import { isAxiosError } from "axios"; // Import isAxiosError

export default function UserRegisterPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const mutation = useMutation({
		mutationFn: (credentials: AuthCredentials) => register(credentials),
		onError: (err) => {
			// Extract specific error message
			if (isAxiosError(err) && err.response?.data?.error) {
				setError(err.response.data.error);
			} else {
				setError(err.message || "Registration failed. Please try again.");
			}
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 6) {
			setError("Password must be at least 6 characters long.");
			return;
		}
		setError(null);
		mutation.mutate({ email, password });
	};

	if (mutation.isSuccess) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-primary-100 p-6">
				<div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl text-center">
					<h2 className="text-3xl font-bold text-green-600 mb-4">Success!</h2>
					<p className="text-lg text-gray-700 mb-6">{mutation.data?.message}</p>
					<Link
						to="/login"
						className="w-full inline-block bg-primary-700 text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-800 transition-colors"
					>
						Back to Login
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen">
			{/* Left Side (Branding) */}
			<div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-primary-800 text-white p-12">
				<img src={BRLogo} alt="Bangladesh Railway" className="w-48 mb-6" />
				<h1 className="text-4xl font-bold mb-4">Create Your Account</h1>
				<p className="text-xl text-primary-200 text-center">
					Get real-time updates and track your train.
				</p>
			</div>

			{/* Right Side (Form) */}
			<div className="flex-1 flex items-center justify-center p-6 bg-primary-100">
				<div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
					<h2 className="text-3xl font-bold text-primary-900 mb-6 text-center">
						Sign Up
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
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Confirm Password
							</label>
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
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
							{mutation.isPending ? "Creating account..." : "Create Account"}
						</button>
					</form>
					<p className="text-center text-sm text-gray-600 mt-6">
						Already have an account?{" "}
						<Link
							to="/login"
							className="font-medium text-primary-700 hover:underline"
						>
							Log In
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
