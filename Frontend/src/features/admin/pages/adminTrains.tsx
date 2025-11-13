import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2 } from "lucide-react";
import TrainCard from "@features/admin/components/AdminTrainCart";
import TrainFormDialog from "@features/admin/components/AdminTrainFormDialoge";
import TrainJourneyModal from "@features/admin/components/adminTrainJourneyModal";
import Footer from "@components/footer";
import { getRoutes, ApiRoute } from "@features/admin/api/routesApi";
import {
	getTrains,
	deleteTrain,
	ApiTrain,
} from "@features/admin/api/trainsApi";

export default function AdminTrainPage() {
	const queryClient = useQueryClient();

	// --- Local UI State ---
	const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isJourneyOpen, setIsJourneyOpen] = useState(false);
	const [selectedTrain, setSelectedTrain] = useState<ApiTrain | null>(null);
	const [routeForModal, setRouteForModal] = useState<ApiRoute | null>(null);

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

	useEffect(() => {
		if (isLoadingRoutes || routes.length === 0) {
			return;
		}

		const selectedIdIsValid =
			selectedRouteId &&
			routes.some((r) => r.id.toString() === selectedRouteId);
		if (!selectedIdIsValid) {
			setSelectedRouteId(routes[0].id.toString());
		}
	}, [isLoadingRoutes, routes, selectedRouteId]);

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
	const routesMap = useMemo(
		() => new Map(routes.map((r) => [r.id.toString(), r])),
		[routes]
	);

	const filteredTrains = useMemo(() => {
		return trains.filter((train) => {
			if (!selectedRouteId) return false;
			const routeMatch = train.routeId.toString() === selectedRouteId;
			const searchMatch =
				train.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				train.code.toLowerCase().includes(searchTerm.toLowerCase());
			return routeMatch && searchMatch;
		});
	}, [trains, selectedRouteId, searchTerm]);

	// --- Handlers ---
	const handleOpenAdd = () => {
		if (routes.length === 0) {
			console.warn("Please create a route first.");
			return;
		}

		// 1. Determine the route ID to use
		let idToFind: string;
		if (selectedRouteId) {
			idToFind = selectedRouteId;
		} else {
			idToFind = routes[0].id.toString();
			setSelectedRouteId(idToFind); // Sync the state
		}

		const routeToOpen = routesMap.get(idToFind);

		if (routeToOpen) {
			setRouteForModal(routeToOpen);
			setSelectedTrain(null);
			setIsFormOpen(true);
		} else {
			console.error(
				"Could not find route to open modal for. Looked for ID:",
				idToFind
			);
		}
	};

	const handleOpenEdit = (train: ApiTrain) => {
		const routeIdString = train.routeId.toString();
		const route = routesMap.get(routeIdString);
		if (route) {
			setRouteForModal(route);
			setSelectedRouteId(routeIdString); 
			setSelectedTrain(train);
			setIsFormOpen(true);
		} else {
			console.error("Could not find route for the train to edit.");
		}
	};

	const handleOpenJourney = (train: ApiTrain) => {
		setSelectedTrain(train);
		setIsJourneyOpen(true);
	};

	const handleDelete = (trainId: number) => {
		if (confirm("Are you sure you want to delete this train?")) {
			deleteTrainMutation.mutate(trainId);
		}
	};

	const selectedRouteForJourney = selectedTrain
		? routesMap.get(selectedTrain.routeId.toString())
		: undefined;

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setSelectedTrain(null);
		setRouteForModal(null);
	};

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
						className="w-full p-2 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
						value={selectedRouteId || ""} 
						onChange={(e) => setSelectedRouteId(e.target.value)}
						disabled={routes.length === 0}
					>
						{routes.length === 0 ? (
							<option value="">No routes available</option>
						) : (
							routes.map((route) => (
								<option key={route.id} value={route.id.toString()}>
									{route.name}
								</option>
							))
						)}
					</select>
					<button
						className="flex items-center justify-center p-2 bg-primary-900 text-white rounded-[4px] shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
						onClick={handleOpenAdd}
						disabled={routes.length === 0}
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
									route={routesMap.get(train.routeId.toString())}
									onEdit={handleOpenEdit}
									onDelete={handleDelete}
									onViewJourney={handleOpenJourney}
								/>
							))
						) : (
							<p className="text-center text-gray-500 py-10">
								{trains.length === 0
									? "No trains created yet."
									: "No trains found for this route."}
							</p>
						)}
					</div>
				)}

				{/* --- Modals --- */}
				{isFormOpen && routeForModal && (
					<TrainFormDialog
						trainToEdit={selectedTrain}
						route={routeForModal}
						onClose={handleCloseForm}
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
