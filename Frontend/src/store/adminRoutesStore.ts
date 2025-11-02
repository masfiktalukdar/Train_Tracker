import { create } from "zustand";
// We no longer need uuid or useAdminStationData here

// ==== Types ====
// These types can be moved to a central `types` folder or kept here,
// but they will also be used by TanStack Query.
type Station = {
  stationId: string;
  stationName: string;
  stationLocation: string;
  stationLocationURL: string;
};

export type Route = {
  id: string; // This will be the database ID
  name: string;
  stations: Station[];
};

export type TrainStoppage = {
  stationId: string;
  stationName: string;
  upArrivalTime: string;
  downArrivalTime: string;
};

export type Train = {
  id: string; // This will be the database ID
  name: string;
  code: string;
  routeId: string; // This will be the database route ID
  direction: 'up' | 'down';
  stoppages: TrainStoppage[];
};

// --- THIS IS THE REFACTORED STORE ---
// It only holds the 'activeRouteId', which is pure UI state.
type AdminRouteUIStore = {
  // --- STATE ---
  activeRouteId: string | null;

  // --- ACTIONS ---
  setActiveRoute: (routeId: string) => void;
};

export const useAdminStationRoutesData = create<AdminRouteUIStore>((set) => ({
  activeRouteId: null,
  setActiveRoute: (routeID: string) => set({ activeRouteId: routeID }),

  // --- ALL OTHER STATE AND ACTIONS ARE REMOVED ---
  // stationList: [],           -> REMOVED (Server State)
  // routes: {},                -> REMOVED (Server State)
  // trains: {},                -> REMOVED (Server State)
  // createNewRoute: () => {},  -> REMOVED (Handled by useMutation)
  // deleteRoute: () => {},     -> REMOVED (Handled by useMutation)
  // addStation...: () => {},   -> REMOVED (Handled by useMutation)
  // removeStation...: () => {},-> REMOVED (Handled by useMutation)
  // ...and so on for all train and route data actions.
}));
