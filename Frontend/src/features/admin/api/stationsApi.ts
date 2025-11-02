import apiClient from '@/lib/apiClient';
import type { Station } from '@/store/adminStationStore'; // Reuse your type

// Define the type for a new station (without ID)
export type NewStationData = Omit<Station, 'stationId'>;

// Type from Supabase (it adds 'id' and 'created_at')
export type ApiStation = Station & { id: number; created_at: string };

export const getStations = async (): Promise<ApiStation[]> => {
  const { data } = await apiClient.get('/admin/stations');
  return data;
};

export const createStation = async (station: NewStationData): Promise<ApiStation> => {
  // The backend uses snake_case, but your frontend type uses camelCase
  // We must map the keys to match the backend API
  const payload = {
    stationId: crypto.randomUUID(), // Your modal used uuid(), let's stick with that
    stationName: station.stationName,
    stationLocation: station.stationLocation,
    stationLocationURL: station.stationLocationURL,
  };
  const { data } = await apiClient.post('/admin/stations', payload);
  return data;
};

export const deleteStation = async (stationId: number): Promise<void> => {
  await apiClient.delete(`/admin/stations/${stationId}`);
};

// Add updateStation...