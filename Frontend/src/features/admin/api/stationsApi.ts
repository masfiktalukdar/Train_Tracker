import apiClient from '@/lib/apiClient';
import type { Station } from '@app-types/dataModels'; // <-- 1. CORRECTED IMPORT PATH

// Type from Supabase (it adds 'id' and 'created_at')
export type ApiStation = Station & {
  id: number;
  created_at: string;
};

// Define the type for a new station (without ID)
export type NewStationData = Omit<Station, 'stationId'>;

// 2. ADD THIS EXPORTED TYPE
export type UpdateStationData = Partial<NewStationData>;

export const getStations = async (): Promise<ApiStation[]> => {
  const { data } = await apiClient.get('/admin/stations');
  return data;
};

export const createStation = async (
  station: NewStationData
): Promise<ApiStation> => {
  const payload = {
    stationId: crypto.randomUUID(), // Your modal used uuid()
    stationName: station.stationName,
    stationLocation: station.stationLocation,
    stationLocationURL: station.stationLocationURL,
  };
  const { data } = await apiClient.post('/admin/stations', payload);
  return data;
};

// 3. FIX THE FUNCTION SIGNATURE
// It now accepts a single object, which matches what the modal is passing.
export const updateStation = async ({
  id,
  updates,
}: {
  id: number;
  updates: UpdateStationData;
}): Promise<ApiStation> => {
  // Map to snake_case for the backend
  const payload: Record<string, string | undefined> = {
    station_name: updates.stationName,
    station_location: updates.stationLocation,
    station_location_url: updates.stationLocationURL,
  };

  // Filter out any undefined keys
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  const { data } = await apiClient.put(`/admin/stations/${id}`, payload);
  return data;
};

export const deleteStation = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/stations/${id}`);
};

