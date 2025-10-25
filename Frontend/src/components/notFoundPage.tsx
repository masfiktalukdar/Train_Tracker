import { Link } from "react-router-dom";

export default function NotFoundPage() {
	return (
		<main className="flex-1 flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-9xl font-bold text-primary-950">404</h1>
				<p className="mt-4 text-2xl font-semibold text-primary-900">
					Not Found
				</p>
				<div className="mt-8 flex justify-center gap-4">
					<Link
						to="/admin/dashboard"
						className="px-6 py-2 rounded-[4px] bg-primary-950 text-white text-base font-medium hover:bg-gray-800 transition"
					>
						Go Home
					</Link>
					<button
						onClick={() => window.history.back()}
						className="px-6 py-2 rounded-md border border-primary-900 text-base font-medium text-primary-900 hover:bg-primary-950 hover:text-white transition"
					>
						Go Back
					</button>
				</div>
			</div>
		</main>
	);
}
