// This file holds the data models for our application,
// matching the data we use and store.

// =================================================================
// BASE MODELS (Your original types)
// =================================================================

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

// =================================================================
// API-SPECIFIC MODELS (The missing types)
// =================================================================

// --- Station Types ---

/**
 * The full Station object as it comes from the Supabase API.
 * Includes database-generated 'id' and 'created_at'.
 */
export type ApiStation = Station & {
  id: number;
  created_at: string;
};

/**
 * The data needed to CREATE a new station.
 * 'stationId' is omitted because the backend creates it.
 */
export type NewStationData = Omit<Station, 'stationId'>;

/**
 * The data needed to UPDATE a station.
 * All fields are optional.
 */
export type UpdateStationData = Partial<NewStationData>;


// --- Route Types ---

/**
 * The full Route object as it comes from the Supabase API.
 * 'id' is a number from the DB.
 */
export type ApiRoute = Omit<Route, 'id'> & {
  id: number;
  created_at: string;
};

// --- Train Types ---

/**
 * The full Train object as it comes from the Supabase API.
 * 'id' is a number and 'route_id' is a number.
 */
export type ApiTrain = Omit<Train, 'id' | 'routeId'> & {
  id: number;
  route_id: number; // The backend uses snake_case for foreign keys
  created_at: string;
};

/**
 * The data needed to CREATE a new train.
 */
export type NewTrainData = Omit<Train, 'id' | 'routeId'> & {
  route_id: number; // Must provide the numerical route_id
};

/**
 * The data needed to UPDATE a train.
 * All fields are optional.
 */
export type UpdateTrainData = Partial<NewTrainData>;

// --- Status Types ---

/**
 * A single arrival record inside the 'arrivals' JSONB array.
 */
export type StationArrivalRecord = {
  id: string; // uuid
  stationId: string;
  stationName: string;
  arrivedAt: string; // ISO timestamp
};

/**
 * The full Daily Status object as it comes from the Supabase API.
 */
export type ApiDailyStatus = {
  id: number;
  train_id: number;
  date: string; // "YYYY-MM-DD"
  lap_completed: boolean;
  arrivals: StationArrivalRecord[];
  last_completed_station_id: string | null;
  created_at: string;
};

