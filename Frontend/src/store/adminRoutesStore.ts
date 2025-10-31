import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { useAdminStationData } from "./adminStationStore";

// ==== Types ====
type Station = {
  stationId: string;
  stationName: string;
  stationLocation: string;
  stationLocationURL: string;
};

type Route = {
  id: string;
  name: string;
  stations: Station[];
  isAutoNamed?: boolean; // NEW: Track if name is auto-generated
};

export type TrainStoppage = {
  stationId: string;
  stationName: string;
  // Store time as a string (e.g., "HH:mm")
  arrivalTime: string;
};

export type Train = {
  id: string;
  name: string;
  code: string;
  routeId: string;
  direction: 'up' | 'down';
  stoppages: TrainStoppage[];
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

  addTrain: (newTrainData: Omit<Train, 'id'>) => void;
  removeTrain: (trainId: string) => void;
  updateTrain: (trainId: string, updatedData: Partial<Train>) => void;
};

// Getting Station Data
function readInitialStationList() {
  return useAdminStationData
    .getState()
    .stationList.map((station) => ({
      stationId: station.stationId,
      stationName: station.stationName,
      stationLocation: station.stationLocation,
      stationLocationURL: station.stationLocationURL,
    }));
}

// Helper functions
function formatArray(stations: Station[]) {
  if (!stations || stations.length === 0) return "Untitled Route";
  const names = stations.map((s) => s.stationName.split(" ")[0].toUpperCase());
  if (names.length === 1) return names[0];
  return `${names[0]} - ${names[names.length - 1]}`;
}

// Defining store behaviour
export const useAdminStationRoutesData = create<AdminRouteStore>((set) => ({
  // Routes Initialization
  stationList: readInitialStationList(),
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
        activeRouteId: newActiveRouteId
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
        (s) => s.stationId !== stationId
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

  addTrain: (newTrainData) =>
    set((state) => {
      const newId = uuid();
      const newTrain: Train = {
        id: newId,
        ...newTrainData,
      };
      return {
        trains: { ...state.trains, [newId]: newTrain },
      };
    }),

  removeTrain: (trainId) =>
    set((state) => {
      const newTrains = { ...state.trains };
      delete newTrains[trainId];
      return { trains: newTrains };
    }),

  updateTrain: (trainId, updatedData) =>
    set((state) => {
      if (!state.trains[trainId]) return state;
      const updatedTrain = { ...state.trains[trainId], ...updatedData };
      return {
        trains: { ...state.trains, [trainId]: updatedTrain },
      };
    }),
}));