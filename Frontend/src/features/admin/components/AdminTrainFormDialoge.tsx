import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { TrainStoppage } from "@/types/dataModels";
import type { Station } from "@/types/dataModels";
import type {
	ApiTrain,
	NewTrainData,
	UpdateTrainData,
} from "@/features/admin/api/trainsApi";
import { createTrain, updateTrain } from "@/features/admin/api/trainsApi";
import type { ApiRoute } from "@/features/admin/api/routesApi";

type TrainFormDialogProps = {
	trainToEdit: ApiTrain | null;
	route: ApiRoute | undefined; 
	onClose: () => void;
};

export default function TrainFormDialog({
	trainToEdit,
	route,
	onClose,
}: TrainFormDialogProps) {
	const queryClient = useQueryClient();

	const selectedRoute = route;
	const routeStations = selectedRoute?.stations || [];

	// --- Local Form State ---
	const [name, setName] = useState(trainToEdit?.name || "");
	const [code, setCode] = useState(trainToEdit?.code || "");
	const [direction, setDirection] = useState<"up" | "down">(
		trainToEdit?.direction || "up"
	);
	const [stoppages, setStoppages] = useState<TrainStoppage[]>(
		trainToEdit?.stoppages || []
	);

	// --- Mutations ---
	const createTrainMutation = useMutation({
		mutationFn: createTrain,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trains"] });
			onClose();
		},
		onError: (err) => console.error("Failed to create train:", err),
	});

	const updateTrainMutation = useMutation({
		mutationFn: updateTrain,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trains"] });
			onClose();
		},
		onError: (err) => console.error("Failed to update train:", err),
	});

	// --- Handlers ---
	const handleStoppageToggle = (station: Station) => {
		const isStoppage = stoppages.some((s) => s.stationId === station.stationId);
		if (isStoppage) {
			setStoppages(stoppages.filter((s) => s.stationId !== station.stationId));
		} else {
			const newStoppage = {
				stationId: station.stationId,
				stationName: station.stationName,
				upArrivalTime: "00:00",
				downArrivalTime: "00:00",
			};
			const newStoppages = [...stoppages, newStoppage];
			newStoppages.sort((a, b) => {
				const indexA = routeStations.findIndex(
					(s) => s.stationId === a.stationId
				);
				const indexB = routeStations.findIndex(
					(s) => s.stationId === b.stationId
				);
				return indexA - indexB;
			});
			setStoppages(newStoppages);
		}
	};

	const handleTimeChange = (
		stationId: string,
		time: string,
		direction: "up" | "down"
	) => {
		setStoppages(
			stoppages.map((s) => {
				if (s.stationId !== stationId) return s;
				if (direction === "up") {
					return { ...s, upArrivalTime: time };
				} else {
					return { ...s, downArrivalTime: time };
				}
			})
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedRoute || !name || !code || stoppages.length <= 1) {
			console.warn(
				"Please select a valid route, fill in all fields, and select at least two stoppages."
			);
			return;
		}

		if (trainToEdit) {
			// Update existing train
			const trainData: UpdateTrainData = {
				name,
				code,
				route_id: selectedRoute.id,
				direction,
				stoppages,
			};
			updateTrainMutation.mutate({ id: trainToEdit.id, updates: trainData });
		} else {
			// Create new train
			const trainData: NewTrainData = {
				name,
				code,
				route_id: selectedRoute.id,
				direction,
				stoppages,
			};
			createTrainMutation.mutate(trainData);
		}
	};

	const isPending =
		createTrainMutation.isPending || updateTrainMutation.isPending;

	return (
		<div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
			<form
				className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
				onSubmit={handleSubmit}
			>
				{/* --- Header --- */}
				<div className="p-4 border-b flex justify-between items-center">
					<h2 className="text-xl font-bold">
						{trainToEdit ? "Edit Train" : "Add New Train"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-200"
					>
						<X className="w-6 h-6 text-gray-600" />
					</button>
				</div>

				{/* --- Form Body --- */}
				<div className="p-6 space-y-4 overflow-y-auto">
					{/* Basic Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Train Name
							</label>
							<input
								type="text"
								className="w-full p-2 border rounded-md"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Train Code
							</label>
							<input
								type="text"
								className="w-full p-2 border rounded-md"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								required
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Primary Direction
						</label>
						<div className="flex gap-4">
							<label className="flex items-center gap-2">
								<input
									type="radio"
									value="up"
									checked={direction === "up"}
									onChange={() => setDirection("up")}
								/>
								Up
							</label>
							<label className="flex items-center gap-2">
								<input
									type="radio"
									value="down"
									checked={direction === "down"}
									onChange={() => setDirection("down")}
								/>
								Down
							</label>
						</div>
					</div>

					{/* Stoppages */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Stoppages & Times
						</label>
						<p className="text-xs text-gray-500 mb-2">
							Route: {selectedRoute?.name || "Loading..."}
						</p>
						<div className="border rounded-lg max-h-64 overflow-y-auto">
							{routeStations.length > 0 ? (
								routeStations.map((station) => {
									const stoppage = stoppages.find(
										(s) => s.stationId === station.stationId
									);
									const isStoppage = !!stoppage;
									return (
										<div
											key={station.stationId}
											className="flex flex-col sm:flex-row items-center justify-between p-3 border-b last:border-b-0"
										>
											<label className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
												<input
													type="checkbox"
													className="w-4 h-4"
													checked={isStoppage}
													onChange={() => handleStoppageToggle(station)}
												/>
												{station.stationName}
											</label>
											<div className="flex items-center gap-4">
												<label className="flex items-center gap-2 text-sm">
													<ArrowUp
														className={`w-4 h-4 ${
															isStoppage ? "text-green-500" : "text-gray-300"
														}`}
													/>
													<input
														type="time"
														className="p-1 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
														value={stoppage?.upArrivalTime || "00:00"}
														disabled={!isStoppage}
														onChange={(e) =>
															handleTimeChange(
																station.stationId,
																e.target.value,
																"up"
															)
														}
													/>
												</label>
												<label className="flex items-center gap-2 text-sm">
													<ArrowDown
														className={`w-4 h-4 ${
															isStoppage ? "text-red-500" : "text-gray-300"
														}`}
													/>
													<input
														type="time"
														className="p-1 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
														value={stoppage?.downArrivalTime || "00:00"}
														disabled={!isStoppage}
														onChange={(e) =>
															handleTimeChange(
																station.stationId,
																e.target.value,
																"down"
															)
														}
													/>
												</label>
											</div>
										</div>
									);
								})
							) : (
								<p className="p-4 text-gray-500">This route has no stations.</p>
							)}
						</div>
					</div>
				</div>

				{/* --- Footer --- */}
				<div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
					<button
						type="button"
						className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						disabled={isPending}
					>
						{isPending
							? "Saving..."
							: trainToEdit
								? "Save Changes"
								: "Create Train"}
					</button>
				</div>
			</form>
		</div>
	);
}
