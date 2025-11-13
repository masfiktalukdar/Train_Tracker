import { Link } from "react-router-dom";
import { TrainFront, Clock, MapPin, Globe, CheckCircle } from "lucide-react";
import BRLogo from "@assets/bangaldesh-railway-logo.png"; // Assuming this is the correct path

export default function AboutPage() {
	const features = [
		{
			icon: Clock,
			title: "Real-Time Tracking",
			description:
				"Precise, up-to-the-minute updates on train location and status, ensuring you are always informed.",
		},
		{
			icon: MapPin,
			title: "Predictive ETAs",
			description:
				"Using historical data and live status, we provide accurate Estimated Times of Arrival for every stop.",
		},
		{
			icon: CheckCircle,
			title: "Turnaround Visibility",
			description:
				"Clear status and countdowns during critical turnaround periods at final stations.",
		},
		{
			icon: Globe,
			title: "Comprehensive Coverage",
			description:
				"Detailed route information, schedules, and status for all registered trains and stations.",
		},
	];

	return (
		<div className="flex flex-col min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-64px)] bg-gray-50">
			{/* --- Header/Hero Section --- */}
			<div className="bg-primary-900 text-white py-16 px-4 text-center">
				<div className="container mx-auto max-w-4xl">
					<img
						src={BRLogo}
						alt="Train Tracker Logo"
						className="w-24 h-24 mx-auto mb-4"
					/>
					<h1 className="text-4xl md:text-5xl font-extrabold mb-3">
						About Train Nojor
					</h1>
					<p className="text-xl text-primary-200">
						Your reliable source for digital rail status and predictive journey
						information in Bangladesh.
					</p>
				</div>
			</div>

			{/* --- Mission & Value Proposition --- */}
			<div className="container mx-auto max-w-4xl py-12 px-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					<div className="space-y-6">
						<h2 className="text-3xl font-bold text-primary-800">
							Our Mission: Making Rail Travel Stress-Free
						</h2>
						<p className="text-gray-700 text-lg">
							We believe that tracking your train shouldn't be a guessing game.
							TrainTracker was built to bridge the information gap, offering
							transparent, accurate, and real-time data so passengers can travel
							with confidence. Our focus is on providing actionable insights,
							from predicted arrivals to immediate turnaround status.
						</p>
						<Link
							to="/trains"
							className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 text-white font-semibold rounded-lg shadow-lg hover:bg-primary-800 transition-colors"
						>
							<TrainFront className="h-5 w-5" />
							Start Tracking Now
						</Link>
					</div>
					<div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
						<h3 className="text-xl font-bold text-gray-800 mb-3">
							Why TrainTracker?
						</h3>
						<ul className="space-y-2 text-gray-600">
							<li className="flex items-center">
								<CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
								Avoid waiting unnecessarily at stations.
							</li>
							<li className="flex items-center">
								<CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
								Plan your transfers and final mile journey effectively.
							</li>
							<li className="flex items-center">
								<CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
								Get the most accurate ETA predictions in the industry.
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* --- Key Features Section --- */}
			<div className="bg-white py-16 px-4">
				<div className="container mx-auto max-w-5xl text-center">
					<h2 className="text-3xl font-bold text-primary-900 mb-10">
						The Power of Precision
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature, index) => {
							const Icon = feature.icon;
							return (
								<div
									key={index}
									className="p-6 rounded-xl shadow-lg border border-gray-100 transition-all hover:shadow-2xl hover:border-primary-300 transform hover:-translate-y-0.5"
								>
									<Icon className="h-10 w-10 text-primary-700 mx-auto mb-4" />
									<h3 className="text-xl font-semibold text-gray-900 mb-2">
										{feature.title}
									</h3>
									<p className="text-gray-600 text-sm">{feature.description}</p>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* --- Footer Contact Placeholder --- */}
			<div className="py-5 px-4 text-center">
				<p className="text-sm lg:text-lg text-gray-600">
					Have questions or feedback? <Link className="text-primary-600 underline font-medium" to={"/contact"}>Contact us</Link>
				</p>
			</div>
		</div>
	);
}
