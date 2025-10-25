// pages/404.tsx (Next.js) or NotFound.tsx (React)
import { Link } from "react-router-dom";

export default function NotFoundPage() {
	return (
		<main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
			<div className="text-center">
				<h1 className="text-9xl font-extrabold text-primary-950 tracking-tight">
					404
				</h1>
				<p className="mt-4 text-lg text-gray-600">Page Not Found</p>

				<div className="mt-8 flex justify-center gap-4">
					<Link
						href="/admin/dashboard"
						className="px-6 py-2 rounded-md bg-primary-950 text-white text-sm font-medium hover:bg-gray-800 transition"
					>
						Go Home
					</Link>
					<button
						onClick={() => window.history.back()}
						className="px-6 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
					>
						Go Back
					</button>
				</div>
			</div>
		</main>
	);
}
