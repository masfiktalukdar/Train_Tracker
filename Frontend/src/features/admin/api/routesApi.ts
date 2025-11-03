import apiClient from "@/lib/apiClient";
// Import the base Station type from your dataModels
import type { Route, Station } from "@/types/dataModels";

// --- ADDED ---
// This is the raw type from the Supabase DB
// Note: 'stations' can be a string or an array
type DbRoute = {
  id: number;
  created_at: string;
  name: string;
  stations: string | Station[];
};

// --- This is your existing type ---
export type ApiRoute = Omit<Route, "id"> & {
  id: number;
  created_at: string;
};

// --- ADDED ---
// Helper function to parse the DB response consistently
const parseDbRoute = (dbRoute: DbRoute): ApiRoute => {
  let stations: Station[] = [];
  if (dbRoute.stations && typeof dbRoute.stations === 'string') {
    try {
      stations = JSON.parse(dbRoute.stations);
    } catch (e) {
      console.error(`Failed to parse stations for route ${dbRoute.id}:`, e);
    }
  } else if (Array.isArray(dbRoute.stations)) {
    stations = dbRoute.stations;
  }

  return {
    id: dbRoute.id,
    created_at: dbRoute.created_at,
    name: dbRoute.name,
    stations: stations, // Use the correctly parsed array
  };
};

// --- API Functions ---

/**
 * Fetches all routes from the database.
 */
export const getRoutes = async (): Promise<ApiRoute[]> => {
  // Hit the /public/routes route
  const { data } = await apiClient.get<DbRoute[]>("/public/routes");
  // FIX: Map and parse every route to ensure data is clean
  return data.map(parseDbRoute);
};

/**
 * Creates a new, empty route.
 */
export const createRoute = async (routeName: string): Promise<ApiRoute> => {
  const { data } = await apiClient.post<DbRoute>("/admin/routes", {
    name: routeName,
    stations: [], // New routes start empty
  });
  // FIX: Parse the response before returning
  return parseDbRoute(data);
};

/**
 * Updates an existing route (e.g., changing its name or station list).
 */
export const updateRoute = async (
  route: Pick<ApiRoute, "id" | "name" | "stations">
): Promise<ApiRoute> => {
  const { data } = await apiClient.put<DbRoute>(`/admin/routes/${route.id}`, {
    name: route.name,
    stations: route.stations,
  });
  // FIX: Parse the response before returning
  return parseDbRoute(data);
};

/**
 * Deletes a route by its ID.
 */
export const deleteRoute = async (routeId: number): Promise<void> => {
  await apiClient.delete(`/admin/routes/${routeId}`);
};