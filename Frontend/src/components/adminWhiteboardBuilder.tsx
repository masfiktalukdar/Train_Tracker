import { useAdminStationRoutesData } from "@store/adminRoutesStore";
import { useMemo, useRef, useState } from "react";
import AdminDataAddDropdown from "./adminDataAddDropdown";
import { Move, RotateCw, Trash2, ZoomIn, ZoomOut } from "lucide-react";

export default function AdminWhiteBoardBuilder() {
	const {
		activeRouteId,
		routes,
		stationList,
    deleteRoute,
		addStationToActiveRoute,
		removeStationFromActiveRoute,
		clearStationsFromActiveRoute,
	} = useAdminStationRoutesData();
	const activeRoute = activeRouteId ? routes[activeRouteId] : null;

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

	// returning all the available stations after using
	const availableStations = useMemo(() => {
		const activeStationIds = new Set(activeRoute?.stations.map((s) => s.id));
		return stationList.filter((s) => !activeStationIds.has(s.id));
	}, [activeRoute, stationList]);

	// all the event handler, pen and zoom
	type MouseDivEvent = React.MouseEvent<HTMLDivElement>;

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

		// Store the initial state in the ref
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

		// Get data from ref
		const { startX, startY, viewportX, viewportY } = panStartRef.current;
		const newPoint = getSvgPoint(e.clientX, e.clientY);

		// Calculate the delta in SVG space
		const deltaX = newPoint.x - startX;
		const deltaY = newPoint.y - startY;

		// Apply the delta to the *original* viewport position
		setViewport((v) => ({
			...v, // Keep the zoom
			x: viewportX + deltaX,
			y: viewportY + deltaY,
		}));
	};
	const onMouseUp = () => {
		setIsPanning(false);
	};

	// -- zooming --

	const zoom = (factor: number) => {
		setViewport((v) => {
			if (!svgRef.current) return v;
			const newZoom = Math.min(Math.max(v.zoom * factor, 0.2), 3);

			// Get center of the visible SVG area
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

	const handleShowAddModal = (insertAfterIndex: number) => {
		setShowAddModal({ isOpen: true, insertAfterIndex });
	};

	const handleAddStation = (station, insertAfterIndex: number) => {
		addStationToActiveRoute(station, insertAfterIndex);
		setShowAddModal({ isOpen: false, insertAfterIndex: -1 });
	};

	const handleRemoveStation = (stationId: string) => {
		removeStationFromActiveRoute(stationId);
	};


	// --- Constants for drawing ---
	const stationWidth = 160;
	const stationHeight = 60;
	const horizontalSpacing = 120; // Space between stations
	const stationNodeY = 200; // Y position for all stations
	const trackHeight = 20; // Visual height of the track

	return (
		<div
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onMouseLeave={onMouseUp}
			className="w-full h-[50vh] md:h-[600px] relative bg-gray-100 border border-gray-300 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
		>
			<svg ref={svgRef} className="w-full h-full select-none">
				{/* Define the train track pattern (like your image) */}
				<defs>
					<pattern
						id="train-track"
						width={20}
						height={trackHeight}
						patternUnits="userSpaceOnUse"
					>
						{/* Rail ties */}
						<rect x="0" y="0" width="8" height={trackHeight} fill="#8d6e63" />
					</pattern>
				</defs>

				{/* This group holds all stations/tracks and is panned/zoomed */}
				<g
					transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
				>
					{/* --- "Add Entry Point" Button --- */}
					{activeRoute?.stations.length === 0 && (
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

					{/* --- Render Stations and Tracks --- */}
					{activeRoute?.stations.map((station, index) => {
						const stationX = index * (stationWidth + horizontalSpacing);
						// --- 1. Render Track from previous station ---
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
									{/* Track ties (using pattern) */}
									<rect
										x={startX}
										y={startY - trackHeight / 2}
										width={endX - startX}
										height={trackHeight}
										fill="url(#train-track)"
									/>
									{/* Rails */}
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

						// --- 2. Render "Add" button *after* this station ---
						const btnX = stationX + stationWidth + horizontalSpacing / 2;
						const btnY = stationNodeY + stationHeight / 2;
						const addBetweenButton = (
							<g
								className="cursor-pointer group"
								onClick={(e) => {
									e.stopPropagation(); // Don't trigger pan
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
								<title>Add station after {station.name}</title>
							</g>
						);

						// --- 3. Render Station Node ---
						return (
							<g key={station.id}>
								{trackPath}
								{addBetweenButton}
								<g transform={`translate(${stationX}, ${stationNodeY})`}>
									<rect
										width={stationWidth}
										height={stationHeight}
										rx="10" // rounded corners
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
										{station.name.split(" ")[0]}
									</text>
									{/* Delete button for station */}
									<g
										className="cursor-pointer group"
										transform={`translate(${stationWidth}, 0)`}
										onClick={(e) => {
											e.stopPropagation(); // Don't trigger pan
											handleRemoveStation(station.id);
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
										<title>Remove {station.name}</title>
									</g>
								</g>
							</g>
						);
					})}
				</g>
			</svg>

			{/* --- UI Controls --- */}
			<div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
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
					onClick={clearStationsFromActiveRoute}
					className="p-2 bg-white rounded-md shadow border hover:bg-gray-100 transition-colors"
				>
					<RotateCw size={20} />
				</button>
			</div>
			<div className="absolute bottom-2 right-2 z-10">
				<button
					onClick={() => {
						if (activeRouteId) {
							deleteRoute(activeRouteId);
						}
					}}
					className="p-2 px-3 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition-colors flex items-center gap-1"
				>
					<Trash2 size={16} /> Delete Route
				</button>
			</div>

			{/* --- Add Station Modal --- */}
			{showAddModal.isOpen && (
				<AdminDataAddDropdown
					onClose={() =>
						setShowAddModal({ isOpen: false, insertAfterIndex: -1 })
					}
					onSelect={handleAddStation}
					availableData={availableStations}
					insertedAfterIndex={showAddModal.insertAfterIndex}
				/>
			)}
		</div>
	);
}
