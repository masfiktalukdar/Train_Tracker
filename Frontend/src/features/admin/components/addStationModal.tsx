import {
	useAdminStationModalToogle,
	// We no longer need useAdminStationData
} from "@/store/adminStationStore";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createStation,
	updateStation,
	ApiStation,
	NewStationData,
	UpdateStationData,
} from "@/features/admin/api/stationsApi"; // Import API functions

// Update the props to receive a full station object
type operationName = {
	operation: "add" | "update";
	stationToEdit: ApiStation | null;
};

export default function AdminStationModal({
	operation,
	stationToEdit,
}: operationName) {
	const { closeModal } = useAdminStationModalToogle();
	const queryClient = useQueryClient();

	// --- Local Form State ---
	const [stationName, setStationName] = useState("");
	const [stationLocation, setStationLocation] = useState("");
	const [stationLocationURL, setStationLocationURL] = useState("");
	const [error, setError] = useState<string>();

	const previousData = stationToEdit;

	// Check if form data is unchanged from the original
	const same =
		previousData &&
		previousData.stationName === stationName &&
		previousData.stationLocation === stationLocation &&
		previousData.stationLocationURL === stationLocationURL;

	// --- Effect to populate form when `stationToEdit` changes ---
	useEffect(() => {
		if (operation === "update" && previousData) {
			setStationName(previousData.stationName ?? "");
			setStationLocation(previousData.stationLocation ?? "");
			setStationLocationURL(previousData.stationLocationURL ?? "");
			setError(undefined);
		}

		// Clearing all the fields when switching to "add" mode
		if (operation === "add") {
			setStationName("");
			setStationLocation("");
			setStationLocationURL("");
			setError(undefined);
		}
	}, [operation, previousData]);

	// --- TanStack Query Mutations ---

	// Mutation for Creating a Station
	const createStationMutation = useMutation({
		mutationFn: createStation,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stations"] });
			closeModal();
		},
		onError: (err) => setError(err.message),
	});

	// Mutation for Updating a Station
	const updateStationMutation = useMutation({
		mutationFn: updateStation,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stations"] });
			closeModal();
		},
		onError: (err) => setError(err.message),
	});

	// --- Event Handlers ---

	const updateHandler = function (e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		if (!stationToEdit) {
			setError("No station selected to update.");
			return;
		}

		if (!stationName || !stationLocation || !stationLocationURL) {
			setError("! All the fields are requred");
			return;
		}

		// Create an object with only the changed fields
		const updates: UpdateStationData = {};
		if (stationName !== stationToEdit.stationName)
			updates.stationName = stationName;
		if (stationLocation !== stationToEdit.stationLocation)
			updates.stationLocation = stationLocation;
		if (stationLocationURL !== stationToEdit.stationLocationURL)
			updates.stationLocationURL = stationLocationURL;

		if (Object.keys(updates).length > 0) {
			// Only mutate if there are changes
			updateStationMutation.mutate({ id: stationToEdit.id, updates });
		} else {
			closeModal(); // No changes, just close
		}
	};

	const submitHandler = function (e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		if (!stationName || !stationLocation || !stationLocationURL) {
			setError("All the fields are requred");
			return;
		}

		const newStation: NewStationData = {
			stationName,
			stationLocation,
			stationLocationURL,
		};
		createStationMutation.mutate(newStation);
	};

	const isPending =
		createStationMutation.isPending || updateStationMutation.isPending;

	return (
		<div
			onClick={closeModal}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6"
			>
				{/* Close Button */}
				<button
					onClick={closeModal}
					className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
				>
					&times;
				</button>

				{/* Modal Title */}
				<h2 className="text-2xl font-semibold text-primary-800 mb-4 font-mono">
					{operation === "add" ? "Add New Station" : "Update Station"}
				</h2>

				{/* Form Fields */}
				<form className="flex flex-col gap-4">
					<label className="flex flex-col font-mono text-sm text-gray-700">
						Station Name
						<input
							type="text"
							placeholder="Enter station name"
							className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							onChange={(e) => setStationName(e.target.value)}
							value={stationName}
						/>
					</label>

					<label className="flex flex-col font-mono text-sm text-gray-700">
						Station Location
						<input
							type="text"
							placeholder="Enter location"
							className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							onChange={(e) => setStationLocation(e.target.value)}
							value={stationLocation}
						/>
					</label>

					<label className="flex flex-col font-mono text-sm text-gray-700">
						Map URL
						<input
							type="url"
							placeholder="Paste map URL"
							className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							onChange={(e) => setStationLocationURL(e.target.value)}
							value={stationLocationURL}
						/>
					</label>

					{/* Error Message */}
					{error && <pre className=" text-red-500">! {error}</pre>}

					{/* Submit Button */}
					<button
						type="submit"
						className="mt-4 bg-primary-800 text-white py-2 px-4 rounded-md hover:bg-primary-700 font-mono disabled:opacity-70"
						disabled={same || isPending}
						onClick={operation === "add" ? submitHandler : updateHandler}
					>
						{isPending
							? "Saving..."
							: operation === "add"
								? "Save Station"
								: "Update Station"}
					</button>
				</form>
			</div>
		</div>
	);
}
