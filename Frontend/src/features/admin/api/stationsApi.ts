import apiClient from "@/lib/apiClient";
import type { Station } from "@app-types/dataModels";

// Type from Supabase (it adds 'id' and 'created_at')
export type ApiStation = Station & {
  id: number;
  created_at: string;
};

// Define the type for a new station (without ID)
export type NewStationData = Omit<Station, "stationId">;

export type UpdateStationData = Partial<NewStationData>;

// --- ADDED ---
// This is the raw type returned from the Supabase GET /public/stations
type DbStation = {
  id: number;
  created_at: string;
  station_id: string;
  station_name: string;
  station_location: string | null;
  station_location_url: string | null;
};

export const getStations = async (): Promise<ApiStation[]> => {
  // 1. FIX: Hit the /public/stations route
  const { data } = await apiClient.get<DbStation[]>("/public/stations");

  // 2. FIX: Map snake_case response to camelCase ApiStation type
  return data.map((dbStation) => ({
    id: dbStation.id,
    created_at: dbStation.created_at,
    stationId: dbStation.station_id,
    stationName: dbStation.station_name,
    stationLocation: dbStation.station_location || "", // Handle null values
    stationLocationURL: dbStation.station_location_url || "", // Handle null values
  }));
};

export const createStation = async (
  station: NewStationData
): Promise<ApiStation> => {
  const payload = {
    stationId: crypto.randomUUID(),
    stationName: station.stationName,
    stationLocation: station.stationLocation,
    stationLocationURL: station.stationLocationURL,
  };
  // This call is correct, as the /admin/stations POST route
  // expects camelCase and maps it on the backend.
  // We just need to map the snake_case response.
  const { data } = await apiClient.post<DbStation>("/admin/stations", payload);

  // FIX: Map the snake_case response to camelCase
  return {
    id: data.id,
    created_at: data.created_at,
    stationId: data.station_id,
    stationName: data.station_name,
    stationLocation: data.station_location || "",
    stationLocationURL: data.station_location_url || "",
  };
};

export const updateStation = async ({
  id,
  updates,
}: {
  id: number;
  updates: UpdateStationData;
}): Promise<ApiStation> => {
  // This payload is correct, as the /admin/stations PUT route
  // expects snake_case keys for updates.
  const payload: Record<string, string | undefined> = {
    station_name: updates.stationName,
    station_location: updates.stationLocation,
    station_location_url: updates.stationLocationURL,
  };

  Object.keys(payload).forEach(
    (key) => payload[key] === undefined && delete payload[key]
  );

  const { data } = await apiClient.put<DbStation>(
    `/admin/stations/${id}`,
    payload
  );

  // FIX: Map the snake_case response to camelCase
  return {
    id: data.id,
    created_at: data.created_at,
    stationId: data.station_id,
    stationName: data.station_name,
    stationLocation: data.station_location || "",
    stationLocationURL: data.station_location_url || "",
  };
};

export const deleteStation = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/stations/${id}`);
};