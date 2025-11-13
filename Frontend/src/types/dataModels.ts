export type Station = {
  stationId: string; 
  stationName: string;
  stationLocation: string;
  stationLocationURL: string;
};

export type Route = {
  id: string; 
  name: string;
  stations: Station[];
  isAutoNamed?: boolean;
};

export type TrainStoppage = {
  stationId: string;
  stationName: string;
  upArrivalTime: string;
  downArrivalTime: string;
};

export type Train = {
  id: string; // --- FIX: Was number
  name: string;
  code: string;
  routeId: string; 
  direction: "up" | "down";
  stoppages: TrainStoppage[];
};

export type ApiStation = Station & {
  id: number; // This is the numeric primary key
  created_at: string;
};

export type NewStationData = Omit<Station, "stationId">;

export type UpdateStationData = Partial<NewStationData>;

// --- Route Types ---

export type ApiRoute = Omit<Route, "id"> & {
  id: string; // --- FIX: Was number
  created_at: string;
};

// --- Train Types ---

export type ApiTrain = Omit<Train, "id" | "routeId"> & {
  id: string; 
  route_id: string; 
  created_at: string;
  routeId: string;
};


export type NewTrainData = Omit<Train, "id" | "routeId"> & {
  route_id: string; 
};

export type UpdateTrainData = Partial<NewTrainData>;

export type StationArrivalRecord = {
  id: string; 
  stationId: string;
  stationName: string;
  arrivedAt: string; 
};

export type StationDepartureRecord = {
  id: string; 
  stationId: string; 
  stationName: string;
  departedAt: string; 
};

export type DailyTrainStatus = {
  train_id: string; 
  date: string; 
  lap_completed: boolean;
  arrivals: StationArrivalRecord[];
  departures: StationDepartureRecord[]; 
  last_completed_station_id: string | null;
};