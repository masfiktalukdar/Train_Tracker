import { create } from "zustand";
// We no longer need uuid or useAdminStationData here

type Station = {
  stationId: string;
  stationName: string;
  stationLocation: string;
  stationLocationURL: string;
};

export type Route = {
  id: string; 
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
  id: string; 
  name: string;
  code: string;
  routeId: string; 
  direction: 'up' | 'down';
  stoppages: TrainStoppage[];
};

// --- THIS IS THE REFACTORED STORE ---
// It only holds the 'activeRouteId', which is pure UI state.
type AdminRouteUIStore = {
  activeRouteId: string | null;

  // --- ACTIONS ---
  setActiveRoute: (routeId: string) => void;
};

export const useAdminStationRoutesData = create<AdminRouteUIStore>((set) => ({
  activeRouteId: null,
  setActiveRoute: (routeID: string) => set({ activeRouteId: routeID })
}));
