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
	const [panning, isPanning] = useState(false);
	const [startPanning, setStartPanning] = useState({ x: 0, y: 0 });
	const [showAddModal, setShowAddModal] = useState({
		isOpen: false,
		insertAfterIndex: -1,
	});

  const svgRef = useRef(null);

  // returning all the available stations after using
  const availableStations = useMemo(()=>{
    const activeStationIds = new Set(activeRoute?.stations.map(s => s.id));
    return stationList.filter(s => !activeStationIds.has(s.id))
  },[activeRoute, stationList]);

  
}
