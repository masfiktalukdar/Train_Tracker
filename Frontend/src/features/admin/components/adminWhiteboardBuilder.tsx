import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStationRoutesData } from "@store/adminRoutesStore";
import { useMemo, useRef, useState } from "react";
import AdminDataAddDropdown from "./adminDataAddDropdown";
import { Move, RotateCw, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import type { ApiRoute } from "@/features/admin/api/routesApi";
import { updateRoute, deleteRoute } from "@/features/admin/api/routesApi";
import { getStations, ApiStation } from "@/features/admin/api/stationsApi"; // We'll use the station API
import type { Station } from "@/types/dataModels"; // Keep using this simple type for logic

// Helper function to auto-name routes
function formatRouteName(stations: Station[]) {
	if (!stations || stations.length === 0) return "Untitled Route";
	const names = stations.map((s) => s.stationName.split(" ")[0].toUpperCase());
	if (names.length === 1) return names[0];
	return `${names[0]} - ${names[names.length - 1]}`;
}

type WhiteBoardProps = {
	activeRoute: ApiRoute;
};

export default function AdminWhiteBoardBuilder({
	activeRoute,
}: WhiteBoardProps) {
	const queryClient = useQueryClient();
	const { setActiveRoute } = useAdminStationRoutesData();

	// Fetch all available stations for the dropdown
	const { data: allStations = [] } = useQuery<ApiStation[]>({
		queryKey: ["stations"],
		queryFn: getStations,
	});

	// Mutation for updating the route (add/remove/clear stations)
	const updateRouteMutation = useMutation({
		mutationFn: updateRoute,
		onSuccess: (updatedRoute) => {
			// Optimistically update the cache
			queryClient.setQueryData(["routes"], (oldData: ApiRoute[] = []) =>
				oldData.map((route) =>
					route.id === updatedRoute.id ? updatedRoute : route
				)
			);
		},
		onError: (err) => {
			console.error("Failed to update route:", err);
			// You could show an error toast here
			// And invalidate to refetch and revert optimistic update
			queryClient.invalidateQueries({ queryKey: ["routes"] });
		},
	});

	// Mutation for deleting the route
	const deleteRouteMutation = useMutation({
		mutationFn: () => deleteRoute(activeRoute.id),
		onSuccess: () => {
			// Remove from cache
			queryClient.setQueryData(["routes"], (oldData: ApiRoute[] = []) =>
				oldData.filter((route) => route.id !== activeRoute.id)
			);
			// Clear the active route ID in Zustand
			setActiveRoute("");
		},
	});

	// --- Local UI State (All this is perfect) ---
	const [viewport, setViewport] = useState({ x: 50, y: 100, zoom: 1 });
	const [isPanning, setIsPanning] = useState(false);
	const panStartRef = useRef({
		startX: 0,
		startY: 0,
		viewportX: 0,
		viewportY: 0,
	});
	const [showAddModal, setShowAddModal] = useState({
		isOpen: false,
		insertAfterIndex: -1,
	});
	const svgRef = useRef<SVGSVGElement | null>(null);

	// --- Refactored Logic ---

	// Find stations that are NOT already in the active route
	const availableStations = useMemo(() => {
		const activeStationIds = new Set(
			activeRoute.stations.map((s) => s.stationId)
		);
		return allStations.filter((s) => !activeStationIds.has(s.stationId));
	}, [activeRoute, allStations]);

	// Handle adding a station
	const handleAddStation = (station: Station, insertAfterIndex: number) => {
		const newStations = [...activeRoute.stations];
		newStations.splice(insertAfterIndex + 1, 0, station);

		updateRouteMutation.mutate({
			id: activeRoute.id,
			name: formatRouteName(newStations), // Auto-update the name
			stations: newStations,
		});
		setShowAddModal({ isOpen: false, insertAfterIndex: -1 });
	};

	// Handle removing a station
	const handleRemoveStation = (stationId: string) => {
		const newStations = activeRoute.stations.filter(
			(s) => s.stationId !== stationId
		);

		updateRouteMutation.mutate({
			id: activeRoute.id,
			name: formatRouteName(newStations), // Auto-update the name
			stations: newStations,
		});
	};

	// Handle clearing all stations
	const clearStationsFromActiveRoute = () => {
		updateRouteMutation.mutate({
			id: activeRoute.id,
			name: "Untitled Route",
			stations: [],
		});
	};

	// --- (Panning and Zooming handlers are unchanged) ---
	// ... onMouseDown, onMouseMove, onMouseUp, zoom, resetView ...
	type MouseDivEvent = React.MouseEvent<HTMLDivElement>;
	// ... (pasting your existing handlers here for completeness) ...
	const getSvgPoint = (clientX: number, clientY: number) => {
		if (!svgRef.current) return { x: 0, y: 0 };
		const pt = svgRef.current.createSVGPoint();
		pt.x = clientX;
		pt.y = clientY;
		const screenCTM = svgRef.current.getScreenCTM();
		if (screenCTM) return pt.matrixTransform(screenCTM.inverse());
		return pt;
	};
	const onMouseDown = (e: MouseDivEvent) => {
		e.preventDefault();
		setIsPanning(true);
		const startPoint = getSvgPoint(e.clientX, e.clientY);
		panStartRef.current = {
			startX: startPoint.x,
			startY: startPoint.y,
			viewportX: viewport.x,
			viewportY: viewport.y,
		};
	};
	const onMouseMove = (e: MouseDivEvent) => {
		if (!isPanning) return;
		e.preventDefault();
		const { startX, startY, viewportX, viewportY } = panStartRef.current;
		const newPoint = getSvgPoint(e.clientX, e.clientY);
		const deltaX = newPoint.x - startX;
		const deltaY = newPoint.y - startY;
		setViewport((v) => ({
			...v,
			x: viewportX + deltaX,
			y: viewportY + deltaY,
		}));
	};
	const onMouseUp = () => {
		setIsPanning(false);
	};
	const zoom = (factor: number) => {
		setViewport((v) => {
			if (!svgRef.current) return v;
			const newZoom = Math.min(Math.max(v.zoom * factor, 0.2), 3);
			const svgRect = svgRef.current.getBoundingClientRect();
			const centerX = svgRect.width / 2;
			const centerY = svgRect.height / 2;
			const svgPoint = getSvgPoint(centerX, centerY);
			const newX = svgPoint.x - (svgPoint.x - v.x) * (newZoom / v.zoom);
			const newY = svgPoint.y - (svgPoint.y - v.y) * (newZoom / v.zoom);
			return { x: newX, y: newY, zoom: newZoom };
		});
	};
	const resetView = () => {
		setViewport({ x: 50, y: 100, zoom: 1 });
	};
	// --- (End of Panning/Zooming handlers) ---

	const handleShowAddModal = (insertAfterIndex: number) => {
		setShowAddModal({ isOpen: true, insertAfterIndex });
	};

	// --- Constants for drawing (unchanged) ---
	const stationWidth = 160;
	const stationHeight = 60;
	const horizontalSpacing = 120;
	const stationNodeY = 200;
	const trackHeight = 20;

	return (
		<div
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onMouseLeave={onMouseUp}
			className="w-full h-[50vh] md:h-[600px] mb-5 relative bg-gray-100 border border-gray-300 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
		>
			<svg ref={svgRef} className="w-full h-full select-none">
				{/* --- (Defs and G transform are unchanged) --- */}
				<defs>
					<pattern
						id="train-track"
						width={20}
						height={trackHeight}
						patternUnits="userSpaceOnUse"
					>
						<rect x="0" y="0" width="8" height={trackHeight} fill="#8d6e63" />
					</pattern>
				</defs>
				<g
					transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
				>
					{/* --- "Add Entry Point" Button --- */}
					{activeRoute.stations.length === 0 && (
						<g
							className="cursor-pointer group"
							transform={`translate(0, ${stationNodeY})`}
							onClick={() => handleShowAddModal(-1)}
						>
							<rect
								width={stationWidth}
								height={stationHeight}
								rx="30"
								ry="30"
								fill="#4caf50"
								stroke="#fff"
								strokeWidth="2"
								className="group-hover:fill-green-600 transition-colors"
							/>
							<text
								x={stationWidth / 2}
								y={stationHeight / 2}
								dominantBaseline="middle"
								textAnchor="middle"
								fill="#fff"
								className="font-bold text-base select-none pointer-events-none"
							>
								Add Entry Point
							</text>
						</g>
					)}

					{/* --- (Render Stations and Tracks - Unchanged) --- */}
					{activeRoute.stations.map((station, index) => {
						const stationX = index * (stationWidth + horizontalSpacing);
						// ... (trackPath logic is the same) ...
						let trackPath = null;
						if (index > 0) {
							const prevStationX =
								(index - 1) * (stationWidth + horizontalSpacing);
							const startX = prevStationX + stationWidth;
							const startY = stationNodeY + stationHeight / 2;
							const endX = stationX;
							const endY = startY;
							trackPath = (
								<g>
									<rect
										x={startX}
										y={startY - trackHeight / 2}
										width={endX - startX}
										height={trackHeight}
										fill="url(#train-track)"
									/>
									<line
										x1={startX}
										y1={startY - trackHeight / 2 + 3}
										x2={endX}
										y2={endY - trackHeight / 2 + 3}
										stroke="#9e9e9e"
										strokeWidth="4"
									/>
									<line
										x1={startX}
										y1={startY + trackHeight / 2 - 3}
										x2={endX}
										y2={endY + trackHeight / 2 - 3}
										stroke="#9e9e9e"
										strokeWidth="4"
									/>
								</g>
							);
						}

						// ... (addBetweenButton logic is the same) ...
						const btnX = stationX + stationWidth + horizontalSpacing / 2;
						const btnY = stationNodeY + stationHeight / 2;
						const addBetweenButton = (
							<g
								className="cursor-pointer group"
								onClick={(e) => {
									e.stopPropagation();
									handleShowAddModal(index);
								}}
								transform={`translate(${btnX}, ${btnY})`}
							>
								<circle
									r="20"
									fill="#fff"
									stroke="#007bff"
									strokeWidth="2.5"
									className="group-hover:fill-blue-100 transition-colors"
								/>
								<line
									x1="-10"
									y1="0"
									x2="10"
									y2="0"
									stroke="#007bff"
									strokeWidth="3.5"
									strokeLinecap="round"
								/>
								<line
									x1="0"
									y1="-10"
									x2="0"
									y2="10"
									stroke="#007bff"
									strokeWidth="3.5"
									strokeLinecap="round"
								/>
								<title>Add station after {station.stationName}</title>
							</g>
						);

						// ... (Station Node logic is the same, just uses handleRemoveStation) ...
						return (
							<g key={station.stationId}>
								{trackPath}
								{addBetweenButton}
								<g transform={`translate(${stationX}, ${stationNodeY})`}>
									<rect
										width={stationWidth}
										height={stationHeight}
										rx="10"
										ry="10"
										fill="#fff"
										stroke="#4a4a4a"
										strokeWidth="2"
										className="shadow-md"
									/>
									<text
										x={stationWidth / 2}
										y={stationHeight / 2}
										dominantBaseline="middle"
										textAnchor="middle"
										fill="#000"
										className="font-semibold select-none pointer-events-none"
									>
										{station.stationName.split(" ")[0]}
									</text>
									<g
										className="cursor-pointer group"
										transform={`translate(${stationWidth}, 0)`}
										onClick={(e) => {
											e.stopPropagation();
											handleRemoveStation(station.stationId);
										}}
									>
										<circle
											r="12"
											fill="#ef5350"
											className="group-hover:fill-red-700 transition-colors"
										/>
										<line
											x1="-6"
											y1="-6"
											x2="6"
											y2="6"
											stroke="#fff"
											strokeWidth="2.5"
										/>
										<line
											x1="-6"
											y1="6"
											x2="6"
											y2="-6"
											stroke="#fff"
											strokeWidth="2.5"
										/>
										<title>Remove {station.stationName}</title>
									</g>
								</g>
							</g>
						);
					})}
				</g>
			</svg>

			{/* --- (UI Controls are mostly unchanged) --- */}
			<div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
				{/* ... (ZoomIn, ZoomOut, Move buttons) ... */}
				<button
					onClick={() => zoom(1.2)}
					className="p-2 bg-white rounded-md shadow border hover:bg-gray-100 transition-colors"
				>
					<ZoomIn size={20} />
				</button>
				<button
					onClick={() => zoom(0.8)}
					className="p-2 bg-white rounded-md shadow border hover:bg-gray-100 transition-colors"
				>
					<ZoomOut size={20} />
				</button>
				<button
					onClick={resetView}
					className="p-2 bg-white rounded-md shadow border hover:bg-gray-100 transition-colors"
				>
					<Move size={20} />
				</button>
				<button
					onClick={clearStationsFromActiveRoute} // Now fires mutation
					className="p-2 bg-white rounded-md shadow border hover:bg-gray-100 transition-colors"
				>
					<RotateCw size={20} />
				</button>
			</div>
			<div className="absolute bottom-2 right-2 z-10">
				<button
					onClick={() => deleteRouteMutation.mutate()} // Now fires mutation
					disabled={deleteRouteMutation.isPending}
					className="p-2 px-3 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition-colors flex items-center gap-1 disabled:opacity-50"
				>
					<Trash2 size={16} />
					{deleteRouteMutation.isPending ? "Deleting..." : "Delete Route"}
				</button>
			</div>

			{/* --- Add Station Modal --- */}
			{showAddModal.isOpen && (
				<AdminDataAddDropdown
					onClose={() =>
						setShowAddModal({ isOpen: false, insertAfterIndex: -1 })
					}
					onSelect={handleAddStation} // This now fires the mutation
					availableData={availableStations} // This is now from useQuery
					insertedAfterIndex={showAddModal.insertAfterIndex}
				/>
			)}
		</div>
	);
}
