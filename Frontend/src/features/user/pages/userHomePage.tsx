import { Link } from "react-router-dom";
import { Train, Building } from "lucide-react";

const backgroundImageUrl =
	"https://images.unsplash.com/photo-1600989007594-c81e830d1105?w=1200&q=80";

export default function UserHomePage() {
	return (
		<div className="flex flex-col min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-64px)]">
			{/* --- Hero Section --- */}
			<div
				className="relative h-48 md:h-64 bg-cover bg-center"
				style={{ backgroundImage: `url(${backgroundImageUrl})` }}
			>
				<div className="absolute inset-0 bg-primary-900/70" />
				<div className="absolute inset-0 flex items-center justify-center">
					<h1 className="text-3xl md:text-5xl font-bold text-white shadow-lg">
						Where to today?
					</h1>
				</div>
			</div>

			{/* --- Navigation Cards --- */}
			<div className="flex-1 bg-gray-50 p-6 md:p-12">
				<div className="container mx-auto max-w-3xl">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
						{/* Trains Card */}
						<Link
							to="/trains"
							className="group flex flex-col items-center justify-center bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all"
						>
							<div className="p-5 bg-primary-100 rounded-full mb-5 transition-colors group-hover:bg-primary-200">
								<Train className="h-10 w-10 md:h-14 md:w-14 text-primary-700" />
							</div>
							<h2 className="text-2xl md:text-3xl font-bold text-primary-900">
								Trains
							</h2>
							<p className="mt-2 text-gray-600">Find trains by route</p>
						</Link>

						{/* Stations Card */}
						<Link
							to="/stations"
							className="group flex flex-col items-center justify-center bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all"
						>
							<div className="p-5 bg-primary-100 rounded-full mb-5 transition-colors group-hover:bg-primary-200">
								<Building className="h-10 w-10 md:h-14 md:w-14 text-primary-700" />
							</div>
							<h2 className="text-2xl md:text-3xl font-bold text-primary-900">
								Stations
							</h2>
							<p className="mt-2 text-gray-600">See arrivals by station</p>
						</Link>
					</div>

					<div className="text-center mt-12 md:mt-16">
						<p className="text-gray-500">More services coming soon.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
