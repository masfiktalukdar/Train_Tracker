import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import AdminStationModal from "@/features/admin/components/addStationModal";
import { ButtonPrimary } from "@/components/button";
import StationCart from "@/features/admin/components/adminStationCart";
import useAdminSearch from "@/hooks/useAdminSearch";
import NotFoundPage from "@/components/notFoundPage";
import Footer from "@/components/footer";

// We ONLY import the UI state stores from Zustand
import {
	useAdminStationModalToogle,
	useAdminStationModalOperation,
} from "@/store/adminStationStore";
// We NO LONGER import useAdminStationData

// Import our new API functions and types
import {
	getStations,
	deleteStation,
	ApiStation,
} from "@/features/admin/api/stationsApi";

export default function AdminStations() {
	const queryClient = useQueryClient();

	// --- Zustand UI State (This is correct) ---
	const { isModalOpen, openModal } = useAdminStationModalToogle();
	const { operation, setOperationAdd, setOperationUpdate } =
		useAdminStationModalOperation();

	// --- Local UI State ---
	// We change this to store the *full station object* for editing
	const [selectedStation, setSelectedStation] = useState<ApiStation | null>(
		null
	);

	// --- TanStack Query Server State ---
	const {
		data: stationList = [],
		isLoading,
		isError,
	} = useQuery<ApiStation[]>({
		queryKey: ["stations"], // This is the cache key
		queryFn: getStations, // This is the fetcher function
	});

	// Use the search hook with the data from useQuery
	const { query, setQuery, filtered, isEmpty } = useAdminSearch(stationList, [
		"stationLocation",
		"stationName",
	]);

	// Mutation for Deleting a Station
	const deleteStationMutation = useMutation({
		mutationFn: deleteStation,
		onSuccess: () => {
			// When delete succeeds, refetch the 'stations' query
			queryClient.invalidateQueries({ queryKey: ["stations"] });
		},
		onError: (err) => {
			// In a real app, you'd show a toast notification
			console.error("Failed to delete station:", err.message);
		},
	});

	// --- Event Handlers ---

	const stationEditModalOpen = (station: ApiStation) => {
		openModal();
		setOperationUpdate();
		setSelectedStation(station); // Set the station to be edited
	};

	const stationAddModalOpener = () => {
		openModal();
		setOperationAdd();
		setSelectedStation(null); // Ensure no station is selected
	};

	const handleDeleteStation = (id: number) => {
		// We can use the browser's confirm, but a custom modal is better
		// For now, this is fine.
		if (confirm("Are you sure you want to delete this station?")) {
			deleteStationMutation.mutate(id);
		}
	};

	// --- Render Logic ---

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				Loading stations...
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex-1 flex items-center justify-center text-red-500">
				Error loading stations.
			</div>
		);
	}

	return (
		<div className="w-full flex-1 min-h-full bg-primary-100 flex flex-col">
			{/* Header add station and search section */}
			<div className="flex gap-4 ml-auto mt-5 px-6 mb-6">
				<ButtonPrimary onClick={stationAddModalOpener}>
					Add new station
				</ButtonPrimary>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search stations..."
					className="w-60 max-w-sm px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition placeholder:text-gray-400 text-sm bg-white"
				/>
			</div>
			{isModalOpen && (
				<AdminStationModal
					operation={operation}
					stationToEdit={selectedStation}
				/>
			)}
			<div className="train-list-container flex flex-col flex-1 mb-6 px-6">
				{isEmpty ? (
					<NotFoundPage />
				) : (
					filtered.map((station, index) => (
						<StationCart
							key={station.id} // Use database ID for the key
							index={index} // Use list index for the menu toggle
							stationName={station.stationName}
							stationLocation={station.stationLocation}
							stationLocationURL={station.stationLocationURL}
							onEdit={() => stationEditModalOpen(station)}
							onDelete={() => handleDeleteStation(station.id)}
						/>
					))
				)}
			</div>
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
