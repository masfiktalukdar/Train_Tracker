import { useAdminStationRoutesData, type Train } from "@/store/adminRoutesStore";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import TrainCard from "../components/trainCart";
import TrainFormDialog from "../components/trainFormDialoge";
import TrainJourneyModal from "../components/trainJourneyModal";

export default function AdminTrainPage() {
	const { routes, trains } = useAdminStationRoutesData();
	const [selectedRouteId, setSelectedRouteId] = useState<string | "all">("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isJourneyOpen, setIsJourneyOpen] = useState(false);
	const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);

	const routeList = Object.values(routes);

	const filteredTrains = useMemo(() => {
		return Object.values(trains).filter((train) => {
			const routeMatch =
				selectedRouteId === "all" || train.routeId === selectedRouteId;
			const searchMatch =
				train.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				train.code.toLowerCase().includes(searchTerm.toLowerCase());
			return routeMatch && searchMatch;
		});
	}, [trains, selectedRouteId, searchTerm]);

	// --- Handlers ---
	const handleOpenAdd = () => {
		if (selectedRouteId === "all" && routeList.length > 0) {
			// If "All" is selected, default to the first route
			setSelectedRouteId(routeList[0].id);
		} else if (routeList.length === 0) {
			alert("Please create a route first.");
			return;
		}
		setSelectedTrain(null);
		setIsFormOpen(true);
	};

	const handleOpenEdit = (train: Train) => {
		setSelectedRouteId(train.routeId); // Ensure the correct route is selected
		setSelectedTrain(train);
		setIsFormOpen(true);
	};

	const handleOpenJourney = (train: Train) => {
		setSelectedTrain(train);
		setIsJourneyOpen(true);
	};

	const { removeTrain } = useAdminStationRoutesData();
	const handleDelete = (trainId: string) => {
		if (window.confirm("Are you sure you want to delete this train?")) {
			removeTrain(trainId);
		}
	};

	return (
		<div className="p-4 md:p-8 bg-gray-50 min-h-screen">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				Train Management
			</h1>

			{/* --- Controls --- */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search by name or code..."
						className="w-full p-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<select
					className="w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					value={selectedRouteId}
					onChange={(e) => setSelectedRouteId(e.target.value)}
				>
					<option value="all">All Routes</option>
					{routeList.map((route) => (
						<option key={route.id} value={route.id}>
							{route.name}
						</option>
					))}
				</select>
				<button
					className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
					onClick={handleOpenAdd}
					disabled={routeList.length === 0}
				>
					<Plus className="w-5 h-5 mr-2" />
					Add New Train
				</button>
			</div>

			{/* --- Train List --- */}
			<div className="space-y-4">
				{filteredTrains.length > 0 ? (
					filteredTrains.map((train) => (
						<TrainCard
							key={train.id}
							train={train}
							onEdit={handleOpenEdit}
							onDelete={handleDelete}
							onViewJourney={handleOpenJourney}
						/>
					))
				) : (
					<p className="text-center text-gray-500 py-10">
						{Object.keys(trains).length === 0
							? "No trains created yet."
							: "No trains match your search."}
					</p>
				)}
			</div>

			{/* --- Modals --- */}
			{isFormOpen && (
				<TrainFormDialog
					trainToEdit={selectedTrain}
					routeId={selectedRouteId as string} // Is never 'all' when form is open
					onClose={() => setIsFormOpen(false)}
				/>
			)}

			{isJourneyOpen && selectedTrain && (
				<TrainJourneyModal
					train={selectedTrain}
					onClose={() => setIsJourneyOpen(false)}
				/>
			)}
		</div>
	);
}
