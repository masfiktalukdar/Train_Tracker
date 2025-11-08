import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Train, Building } from "lucide-react";
import backgroundImage from "../../../assets/Train_Illustration.jpg";

export default function UserHomePage() {
	const [showNotice, setShowNotice] = useState(true);
	const [greeting, setGreeting] = useState("");

	// Handle greeting based on time
	useEffect(() => {
		const hour = new Date().getHours();
		if (hour < 12) setGreeting("Let’s start a fresh journey.");
		else if (hour < 18) setGreeting("Let’s continue our journey.");
		else setGreeting("Let’s end the day on track.");
	}, []);

	// Load or save notice preference
	useEffect(() => {
		const hideNotice = localStorage.getItem("hideNotice");
		if (hideNotice === "true") setShowNotice(false);
	}, []);

	const handleHideNotice = () => {
		setShowNotice(false);
		localStorage.setItem("hideNotice", "true");
	};

	return (
		<div className="relative flex flex-col min-h-screen bg-gray-50">
			{/* --- Top Notice --- */}
			{showNotice && (
				<div className="bg-yellow-100 text-yellow-900 px-4 py-2 text-center text-sm md:text-base flex items-center justify-center gap-3">
					<span>
						🚆 TrainTracker uses only arrival times, so it may miscalculate a
						train’s crossing time.
					</span>
					<button
						onClick={handleHideNotice}
						className="text-yellow-700 underline hover:text-yellow-900"
					>
						Never show again
					</button>
				</div>
			)}


			{/* --- Hero Section --- */}
			<div
				className="relative h-72 md:h-96 bg-cover bg-center shadow-lg"
				style={{
					backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${backgroundImage})`,
				}}
			>
				<div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
					<h1 className="text-4xl md:text-5xl font-bold drop-shadow-lg mb-3">
						{greeting}
					</h1>
					<p className="text-lg md:text-xl text-gray-200">
						Plan. Track. Arrive on time.
					</p>
				</div>
			</div>

			{/* --- Navigation Cards --- */}
			<div className="flex-1 p-8 md:p-12">
				<div className="container mx-auto max-w-3xl">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Trains Card */}
						<Link
							to="/trains"
							className="group flex flex-col items-center justify-center bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all"
						>
							<div className="p-5 bg-primary-100 rounded-full mb-4 group-hover:bg-primary-200 transition">
								<Train className="h-10 w-10 text-primary-700" />
							</div>
							<h2 className="text-2xl font-semibold text-primary-900">
								Trains
							</h2>
							<p className="text-gray-600 mt-2">Find trains by route</p>
						</Link>

						{/* Stations Card */}
						<Link
							to="/stations"
							className="group flex flex-col items-center justify-center bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all"
						>
							<div className="p-5 bg-primary-100 rounded-full mb-4 group-hover:bg-primary-200 transition">
								<Building className="h-10 w-10 text-primary-700" />
							</div>
							<h2 className="text-2xl font-semibold text-primary-900">
								Stations
							</h2>
							<p className="text-gray-600 mt-2">See arrivals by station</p>
						</Link>
					</div>

					<div className="text-center mt-12">
						<p className="text-gray-500">More services coming soon...</p>
					</div>
				</div>
			</div>
		</div>
	);
}
