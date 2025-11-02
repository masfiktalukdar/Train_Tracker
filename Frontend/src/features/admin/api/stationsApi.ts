import apiClient from '@/lib/apiClient';
// Import the types from our new central location
import {
  ApiStation,
  NewStationData,
  UpdateStationData,
} from '@/types/dataModels';

//
// This is the function that needs to be fixed
//
export const getStations = async (): Promise<ApiStation[]> => {
  // IT MUST fetch from the '/public/stations' route, NOT '/admin/stations'
  const { data } = await apiClient.get('/public/stations');
  return data;
};

//
// All the mutations below are CORRECT. They correctly
// point to the '/admin/...' routes which are protected.
//
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

// This function now correctly accepts a single object
export const updateStation = async ({
  id,
  updates,
}: {
  id: number;
  updates: UpdateStationData;
}): Promise<ApiStation> => {
  // Map to snake_case for the backend
  const payload = {
    station_name: updates.stationName,
    station_location: updates.stationLocation,
    station_location_url: updates.stationLocationURL,
  };
  const { data } = await apiClient.put(`/admin/stations/${id}`, payload);
  return data;
};

export const deleteStation = async (stationId: number): Promise<void> => {
  await apiClient.delete(`/admin/stations/${stationId}`);
};

