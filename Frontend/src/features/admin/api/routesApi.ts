import apiClient from "@/lib/apiClient";
import type { Route, Station } from "@/types/dataModels";

type DbRoute = {
  id: number;
  created_at: string;
  name: string;
  stations: string | Station[];
};

export type ApiRoute = Omit<Route, "id"> & {
  id: number;
  created_at: string;
};

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
    stations: stations,
  };
};


export const getRoutes = async (): Promise<ApiRoute[]> => {
  const { data } = await apiClient.get<DbRoute[]>("/public/routes");
  return data.map(parseDbRoute);
};


export const createRoute = async (routeName: string): Promise<ApiRoute> => {
  const { data } = await apiClient.post<DbRoute>("/admin/routes", {
    name: routeName,
    stations: [],
  });
  return parseDbRoute(data);
};


export const updateRoute = async (
  route: Pick<ApiRoute, "id" | "name" | "stations">
): Promise<ApiRoute> => {
  const { data } = await apiClient.put<DbRoute>(`/admin/routes/${route.id}`, {
    name: route.name,
    stations: route.stations,
  });
  return parseDbRoute(data);
};


export const deleteRoute = async (routeId: number): Promise<void> => {
  await apiClient.delete(`/admin/routes/${routeId}`);
};