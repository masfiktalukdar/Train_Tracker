import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getStations, ApiStation } from "@/features/admin/api/stationsApi";
import { Building, ChevronRight, Search } from "lucide-react";
import LoadingSpinner from "@features/user/components/loadingSpinner";
import ErrorDisplay from "@features/user/components/errorDisplay";

export default function StationListPage() {
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: stations = [],
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery<ApiStation[]>({
		queryKey: ["stations"],
		queryFn: getStations,
	});

	const filteredStations = stations.filter((station) =>
		station.stationName.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const renderContent = () => {
		if (isLoading) {
			return <LoadingSpinner text="Fetching stations..." fullPage />;
		}

		if (isError) {
			return (
				<ErrorDisplay
					title="Failed to load stations"
					message={error.message}
					onRetry={refetch}
					fullPage
				/>
			);
		}

		if (filteredStations.length === 0) {
			return (
				<div className="text-center p-10">
					<h3 className="text-xl font-medium text-gray-700">
						No stations found
					</h3>
					<p className="text-gray-500 mt-2">
						{stations.length > 0
							? "Try adjusting your search."
							: "There may be no stations in the system."}
					</p>
				</div>
			);
		}

		return (
			<ul className="divide-y divide-gray-200">
				{filteredStations.map((station) => (
					<li key={station.stationId}>
						<Link
							to={`/stations/${station.stationId}`}
							className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
						>
							<div className="flex items-center gap-4">
								<div className="p-2.5 bg-primary-100 rounded-full">
									<Building className="h-5 w-5 text-primary-700" />
								</div>
								<span className="text-lg font-medium text-gray-800">
									{station.stationName}
								</span>
							</div>
							<ChevronRight className="h-5 w-5 text-gray-400" />
						</Link>
					</li>
				))}
			</ul>
		);
	};

	return (
		<div className="container mx-auto max-w-3xl py-6 px-4">
			{/* --- Search Bar --- */}
			<div className="relative mb-6">
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search for a station..."
					className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
				/>
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
			</div>

			{/* --- Station List --- */}
			<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
				{renderContent()}
			</div>
		</div>
	);
}
