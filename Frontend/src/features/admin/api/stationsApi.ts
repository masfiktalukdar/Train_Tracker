import apiClient from "@/lib/apiClient";
import type { Station } from "@app-types/dataModels";

export type ApiStation = Station & {
  id: number;
  created_at: string;
};

export type NewStationData = Omit<Station, "stationId">;

export type UpdateStationData = Partial<NewStationData>;

type DbStation = {
  id: number;
  created_at: string;
  station_id: string;
  station_name: string;
  station_location: string | null;
  station_location_url: string | null;
};

export const getStations = async (): Promise<ApiStation[]> => {
  const { data } = await apiClient.get<DbStation[]>("/public/stations");

  return data.map((dbStation) => ({
    id: dbStation.id,
    created_at: dbStation.created_at,
    stationId: dbStation.station_id,
    stationName: dbStation.station_name,
    stationLocation: dbStation.station_location || "", 
    stationLocationURL: dbStation.station_location_url || "", 
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
  const { data } = await apiClient.post<DbStation>("/admin/stations", payload);

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