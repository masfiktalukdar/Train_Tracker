import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { useAdminStationData } from "./adminStationStore";

// ==== Types ====
type Station = {
  id: string;
  name: string;
};

type Route = {
  id: string;
  name: string;
  stations: Station[];
  isAutoNamed?: boolean; // NEW: Track if name is auto-generated
};

type Train = {
  id: string;
  name: string;
  routeId: string;
};

type AdminRouteStore = {
  // --- STATE ---
  stationList: Station[];
  routes: Record<string, Route>;
  trains: Record<string, Train>;
  activeRouteId: string | null;

  // --- ACTIONS ---
  createNewRoute: () => void;
  setActiveRoute: (routeId: string) => void;
  deleteRoute: (routeId: string) => void;

  addStationToActiveRoute: (station: Station, insertAfterIndex: number) => void;
  removeStationFromActiveRoute: (stationId: string) => void;
  clearStationsFromActiveRoute: () => void;

  addTrainToRoute: (routeId: string, trainName: string) => void;
  removeTrain: (trainId: string) => void;
  updateTrain: (trainId: string, newName: string) => void;
};

// Getting Station Data
const stationList = useAdminStationData
  .getState()
  .stationList.map((station, index) => {
    return {
      id: `st-${index + 1}`,
      name: station.stationName.split(" ")[0],
    };
  });

// Helper functions
function formatArray(arr: { id: string; name: string }[]) {
  const stationsArry = arr.map((s) => s.name);

  if (stationsArry.length === 0) return "Untitled Route";
  if (stationsArry.length === 1) return stationsArry[0];
  return `${stationsArry[0]} - ${stationsArry[stationsArry.length - 1]}`;
}

// Defining store behaviour
export const useAdminStationRoutesData = create<AdminRouteStore>((set) => ({
  // Routes Initialization
  stationList,
  routes: {},
  trains: {},
  activeRouteId: null,

  // Routes Operations
  setActiveRoute: (routeID: string) => set({ activeRouteId: routeID }),

  createNewRoute: () =>
    set((state) => {
      const newId = uuid();
      const newRoute: Route = {
        id: newId,
        name: "Untitled Route",
        stations: [],
        isAutoNamed: true, // Mark as auto-named
      };
      return {
        routes: {
          ...state.routes,
          [newId]: newRoute,
        },
        activeRouteId: newId,
      };
    }),

  deleteRoute: (routeId: string) =>
    set((state) => {
      const newRoutes = { ...state.routes };
      delete newRoutes[routeId];

      const newTrains = { ...state.trains };
      Object.values(state.trains).forEach((train) => {
        if (train.routeId === routeId) {
          delete newTrains[train.id]; // FIX: Delete by train.id, not routeId
        }
      });

      let newActiveRouteId = state.activeRouteId;
      if (state.activeRouteId === routeId) {
        const remainingIds = Object.keys(newRoutes);
        newActiveRouteId = remainingIds.length > 0 ? remainingIds[0] : null;
      }


      return {
        routes: newRoutes,
        trains: newTrains,
        activeRouteId:newActiveRouteId
      };
    }),

  addStationToActiveRoute: (station, insertAfterIndex) =>
    set((state) => {
      const { activeRouteId, routes } = state;
      if (!activeRouteId || !routes[activeRouteId]) return state;

      const activeRoute = routes[activeRouteId];
      const newStations = [...activeRoute.stations];
      newStations.splice(insertAfterIndex + 1, 0, station);

      const updatedRoute: Route = {
        ...activeRoute,
        stations: newStations,
        // Only auto-generate name if it's still auto-named
        name: activeRoute.isAutoNamed
          ? formatArray(newStations)
          : activeRoute.name,
      };

      return {
        routes: {
          ...state.routes,
          [activeRouteId]: updatedRoute,
        },
      };
    }),

  removeStationFromActiveRoute: (stationId) =>
    set((state) => {
      const { activeRouteId, routes } = state;
      if (!activeRouteId || !routes[activeRouteId]) return state;

      const activeRoute = routes[activeRouteId];
      const newStations = activeRoute.stations.filter(
        (s) => s.id !== stationId
      );

      const updatedRoute: Route = {
        ...activeRoute,
        stations: newStations,
        // Only auto-generate name if it's still auto-named
        name: activeRoute.isAutoNamed
          ? formatArray(newStations)
          : activeRoute.name,
      };

      return {
        routes: {
          ...state.routes,
          [activeRouteId]: updatedRoute,
        },
      };
    }),

  clearStationsFromActiveRoute: () =>
    set((state) => {
      const { activeRouteId, routes } = state;
      if (!activeRouteId || !routes[activeRouteId]) return state;

      const updatedRoute: Route = {
        ...routes[activeRouteId],
        stations: [],
        name: "Untitled Route",
        isAutoNamed: true, // Reset to auto-naming
      };

      return {
        routes: {
          ...state.routes,
          [activeRouteId]: updatedRoute,
        },
      };
    }),

  addTrainToRoute: () => { },
  removeTrain: () => { },
  updateTrain: () => { },
}));