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
	setActiveRoute: (routeId: string) => void;
	createNewRoute: (name: string) => void;
	renameRoute: (routeId: string, newName: string) => void;
	deleteRoute: (routeId: string) => void;

	addStationToActiveRoute: (station: Station, insertAfterIndex: number) => void;
	removeStationFromActiveRoute: (stationId: string) => void;
	clearStationsFromActiveRoute: () => void;

	addTrainToRoute: (routeId: string, trainName: string) => void;
	removeTrain: (trainId: string) => void;
	updateTrain: (trainId: string, newName: string) => void;
};

// Gettting Station Data
const stationList = useAdminStationData
	.getState()
	.stationList.map((station, index) => {
		return {
			id: `st-${index + 1}`,
			name: station.stationName.split(" ")[0],
		};
	});

// Defining store behaviour
export const useAdminStationRoutesData = create<AdminRouteStore>((set) => ({
	// Routes Initialization
	stationList,
	routes: {},
	trains: {},
	activeRouteId: null,

	// Routes Operations
	setActiveRoute: (routeID: string) => set({ activeRouteId: routeID }),

	createNewRoute: (name: string) =>
		set((state) => {
			const newId = uuid();
			const newRoute = {
				id: newId,
				name: name,
				stations: [],
			};
			return {
				routes: {
					...state.routes,
					[newId]: newRoute,
				},
				activeRouteId: newId,
			};
		}),

	renameRoute: (routeID, newName) =>
		set((state) => {
			if (!state.routes[routeID]) return state;
			const renamedRoute = { ...state.routes[routeID], name: newName };

			return {
				routes: {
					...state.routes,
					[routeID]: renamedRoute,
				},
			};
		}),

	deleteRoute: (routeId: string) =>
		set((state) => {
			const newRoute = { ...state.routes };
			delete newRoute[routeId];

			const newTrains = { ...state.trains };
			Object.values(state.trains).map((train) => {
				if (train.routeId === routeId) {
					delete newTrains[routeId];
				}
			});

			return {
				routes: newRoute,
				trains: newTrains,
				activeRouteId:
					state.activeRouteId === routeId ? null : state.activeRouteId,
			};
		}),

	addStationToActiveRoute: (station, insertAfterIndex) => 
    set(state => {
      const {activeRouteId, routes} = state;
      if(!activeRouteId || !routes[activeRouteId]) return state;

      const activeRoute = routes[activeRouteId];
      const newStations = [...activeRoute.stations];
      newStations.splice(insertAfterIndex + 1, 0, station);

      const updatedRoute = {...activeRoute, stations: newStations}

      return{
        routes: {
          ...state.routes,
          [activeRouteId]: updatedRoute
        }
      }
  }),

	removeStationFromActiveRoute: (stationId) => 
    set(state => {
      const {activeRouteId, routes} = state;
      if(!activeRouteId || !routes[activeRouteId]) return state;

      const activeRoute = routes[activeRouteId];
      const newStations = activeRoute.stations.filter(s => s.id !== stationId);
      
      const updatedRoute = {...activeRoute, stations: newStations};

      return{
        routes:{
          ...state.routes,
          [activeRouteId]: updatedRoute
        }
      }
  }),

	clearStationsFromActiveRoute: () => 
    set(state => {
      const {activeRouteId, routes} = state;
      if(!activeRouteId || !routes[activeRouteId]) return state;

      const updatedRoute = {...routes[activeRouteId], stations: []};

      return{
        routes: {
          ...state.routes,
          [activeRouteId]: updatedRoute
        }
      }
  }),

	addTrainToRoute: () => {},
	removeTrain: () => {},
	updateTrain: () => {},
}));
