import { useAdminStationRoutesData } from "@store/adminRoutesStore";
import { act, useMemo, useRef, useState } from "react";

export default function AdminWhiteBoardBuilder() {
	const {
		activeRouteId,
		routes,
		stationList,
		addStationToActiveRoute,
		removeStationFromActiveRoute,
		clearStationsFromActiveRoute,
	} = useAdminStationRoutesData();
	const activeRoute = activeRouteId ? routes[activeRouteId] : null;

	const [viewport, setViewport] = useState({ x: 50, y: 100, zoom: 1 });
	const [isPanning, setIsPanning] = useState(false);
	const [startPanning, setStartPanning] = useState({ x: 0, y: 0 });
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
	type Element = React.MouseEvent<SVGSVGElement, MouseEvent>;

	const getSvgPoint = (clientX, clientY) => {
		if (!svgRef.current) return { x: 0, y: 0 };

		const pt = svgRef.current.createSVGPoint();
		pt.x = clientX;
		pt.y = clientY;
		const screenCTM = svgRef.current.getScreenCTM();
		if (screenCTM) return pt.matrixTransform(screenCTM.inverse());
		return pt;
	};

	const onMouseDown = (e: Element) => {
		e.preventDefault();
		setIsPanning(true);
		const startPoint = getSvgPoint(e.clientX, e.clientY);
		setStartPanning({
			x: viewport.x - startPoint.x,
			y: viewport.y - startPoint.y,
		});
	};
	const onMouseMove = (e: Element) => {
		if (!isPanning) return;
		e.preventDefault();
		const startPoint = getSvgPoint(e.clientX, e.clientY);
		setStartPanning((v) => ({
			...v,
			x: viewport.x - startPoint.x,
			y: viewport.y - startPoint.y,
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

	const handleResetRoute = () => {
		clearStationsFromActiveRoute();
	};

	// --- Constants for drawing ---
	const stationWidth = 160;
	const stationHeight = 60;
	const horizontalSpacing = 120; // Space between stations
	const stationNodeY = 200; // Y position for all stations
	const trackHeight = 20; // Visual height of the track

  
}
