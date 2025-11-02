import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2 } from "lucide-react";
import TrainCard from "../components/AdminTrainCart";
import TrainFormDialog from "../components/adminTrainFormDialoge";
import TrainJourneyModal from "../components/adminTrainJourneyModal";
import Footer from "@/components/footer";
import { getRoutes, ApiRoute } from "@/features/admin/api/routesApi";
import {
	getTrains,
	deleteTrain,
	ApiTrain,
} from "@/features/admin/api/trainsApi";

export default function AdminTrainPage() {
	const queryClient = useQueryClient();

	// --- Local UI State ---
	const [selectedRouteId, setSelectedRouteId] = useState<string>("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isJourneyOpen, setIsJourneyOpen] = useState(false);
	const [selectedTrain, setSelectedTrain] = useState<ApiTrain | null>(null);

	// --- Data Fetching ---
	const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<
		ApiRoute[]
	>({
		queryKey: ["routes"],
		queryFn: getRoutes,
	});

	const { data: trains = [], isLoading: isLoadingTrains } = useQuery<
		ApiTrain[]
	>({
		queryKey: ["trains"],
		queryFn: getTrains,
	});

	const isLoading = isLoadingRoutes || isLoadingTrains;

	// --- Mutations ---
	const deleteTrainMutation = useMutation({
		mutationFn: deleteTrain,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trains"] });
		},
		onError: (err) => console.error("Failed to delete train:", err),
	});

	// --- Memoized Data ---
	const routeList = routes;
	const routesMap = useMemo(
		() => new Map(routes.map((r) => [r.id, r])),
		[routes]
	);

	const filteredTrains = useMemo(() => {
		return trains.filter((train) => {
			const routeMatch =
				selectedRouteId === "all" ||
				train.routeId.toString() === selectedRouteId;
			const searchMatch =
				train.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				train.code.toLowerCase().includes(searchTerm.toLowerCase());
			return routeMatch && searchMatch;
		});
	}, [trains, selectedRouteId, searchTerm]);

	// --- Handlers ---
	const handleOpenAdd = () => {
		// FIX: This 'if' block was causing a state race condition.
		// We remove it entirely. The logic to pick the first route
		// is already handled by 'selectedRouteForModal'.
		/*
		if (selectedRouteId === "all" && routeList.length > 0) {
			setSelectedRouteId(routeList[0].id.toString());
		} else 
		*/
		if (routeList.length === 0) {
			console.warn("Please create a route first.");
			return;
		}
		setSelectedTrain(null);
		setIsFormOpen(true);
	};

	const handleOpenEdit = (train: ApiTrain) => {
		setSelectedRouteId(train.routeId.toString()); // Ensure the correct route is selected
		setSelectedTrain(train);
		setIsFormOpen(true);
	};

	const handleOpenJourney = (train: ApiTrain) => {
		setSelectedTrain(train);
		setIsJourneyOpen(true);
	};

	const handleDelete = (trainId: number) => {
		// Re-enabling confirm() as it's the intended behavior for now.
		// A custom modal is better, but this is functional.
		if (confirm("Are you sure you want to delete this train?")) {
			deleteTrainMutation.mutate(trainId);
		}
	};

	// This variable now correctly handles all cases without a race condition.
	// 1. If "all" is selected -> use first route ID.
	// 2. If a specific route is selected -> use that route ID.
	const selectedRouteForModal =
		selectedRouteId === "all" && routeList.length > 0
			? routeList[0].id
			: parseInt(selectedRouteId, 10);

	const selectedRouteForJourney = selectedTrain
		? routesMap.get(selectedTrain.routeId)
		: undefined;

	return (
		<div className="w-full flex-1 min-h-full bg-primary-100 flex flex-col">
			<div className="p-6 mb-6">
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
							className="w-full p-2 pl-10 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<select
						className="w-full p-2 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
						className="flex items-center justify-center p-2 bg-primary-900 text-white rounded-[4px] shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
						onClick={handleOpenAdd}
						disabled={routeList.length === 0}
					>
						<Plus className="w-5 h-5 mr-2" />
						Add New Train
					</button>
				</div>

				{/* --- Train List --- */}
				{isLoading ? (
					<div className="flex justify-center items-center py-10">
						<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
						<span className="ml-4 text-gray-600">Loading trains...</span>
					</div>
				) : (
					<div className="space-y-4">
						{filteredTrains.length > 0 ? (
							filteredTrains.map((train) => (
								<TrainCard
									key={train.id}
									train={train}
									route={routesMap.get(train.routeId)}
									onEdit={handleOpenEdit}
									onDelete={handleDelete}
									onViewJourney={handleOpenJourney}
								/>
							))
						) : (
							<p className="text-center text-gray-500 py-10">
								{trains.length === 0
									? "No trains created yet."
									: "No trains match your search."}
							</p>
						)}
					</div>
				)}

				{/* --- Modals --- */}
				{isFormOpen && (
					<TrainFormDialog
						trainToEdit={selectedTrain}
						selectedRouteId={selectedRouteForModal}
						onClose={() => setIsFormOpen(false)}
					/>
				)}

				{isJourneyOpen && selectedTrain && selectedRouteForJourney && (
					<TrainJourneyModal
						train={selectedTrain}
						route={selectedRouteForJourney}
						onClose={() => setIsJourneyOpen(false)}
					/>
				)}
			</div>

			{/* Footer Section */}
			<Footer />
		</div>
	);
}
