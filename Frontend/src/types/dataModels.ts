// This file holds the data models for our application,
// matching the data we use and store.

/**
 * Represents a single station.
 * This type was originally in adminStationStore.ts
 */
export type Station = {
  stationId: string; // This is the user-generated UUID
  stationName: string;
  stationLocation: string;
  stationLocationURL: string;
};

/**
 * Represents a route, which is an ordered list of stations.
 * This type was originally in adminRoutesStore.ts
 */
export type Route = {
  id: string; // This will be the database ID
  name: string;
  stations: Station[];
  isAutoNamed?: boolean;
};

/**
 * Represents a specific stoppage for a train, including arrival times.
 * This type was originally in adminRoutesStore.ts
 */
export type TrainStoppage = {
  stationId: string;
  stationName: string;
  upArrivalTime: string;
  downArrivalTime: string;
};

/**
 * Represents a train, linked to a route, with its specific stoppages.
 * This type was originally in adminRoutesStore.ts
 */
export type Train = {
  id: string;
  name: string;
  code: string;
  routeId: string;
  direction: 'up' | 'down';
  stoppages: TrainStoppage[];
};

