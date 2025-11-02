import apiClient from '@/lib/apiClient';
import type { Route } from '@/store/adminRoutesStore'; // Reuse types

// Supabase returns 'id' as a number and 'created_at'
export type ApiRoute = Omit<Route, 'id'> & {
  id: number;
  created_at: string;
};

// --- API Functions ---

/**
 * Fetches all routes from the database.
 */
export const getRoutes = async (): Promise<ApiRoute[]> => {
  const { data } = await apiClient.get('/admin/routes');
  return data;
};

/**
 * Creates a new, empty route.
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
 */
export const deleteRoute = async (routeId: number): Promise<void> => {
  await apiClient.delete(`/admin/routes/${routeId}`);
};
