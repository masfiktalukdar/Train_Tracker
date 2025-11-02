import apiClient from '@/lib/apiClient';
import { ApiRoute } from '@/types/dataModels'; // Updated to correct import

// --- API Functions ---

/**
 * Fetches all routes from the database.
 */
export const getRoutes = async (): Promise<ApiRoute[]> => {
  // THE FIX IS HERE:
  // We fetch from the PUBLIC route, not the ADMIN route.
  const { data } = await apiClient.get('/public/routes');
  return data;
};

/**
 * Creates a new, empty route.
 * (This is a mutation, so it correctly uses the ADMIN route)
 */
export const createRoute = async (routeName: string): Promise<ApiRoute> => {
  const { data } = await apiClient.post('/admin/routes', {
    name: routeName,
    stations: [], // New routes start empty
  });
  return data;
};

/**
 * Updates an existing route (e.g., changing its name or station list).
 * (This is a mutation, so it correctly uses the ADMIN route)
 */
export const updateRoute = async (
  route: Pick<ApiRoute, 'id' | 'name' | 'stations'>
): Promise<ApiRoute> => {
  const { data } = await apiClient.put(`/admin/routes/${route.id}`, {
    name: route.name,
    stations: route.stations,
  });
  return data;
};

/**
 * Deletes a route by its ID.
 * (This is a mutation, so it correctly uses the ADMIN route)
 */
export const deleteRoute = async (routeId: number): Promise<void> => {
  await apiClient.delete(`/admin/routes/${routeId}`);
};

