import apiClient from "@/lib/apiClient";
import type { TrainStoppage } from "@/types/dataModels";

// --- ADDED ---
// This is the type returned by the backend (snake_case)
type DbTrain = {
  id: number;
  created_at: string;
  name: string;
  code: string;
  direction: "up" | "down";
  route_id: number;
  stoppages: TrainStoppage[]; // This JSONB column is already camelCase
};

// --- RE-DEFINED ---
// This is the type the frontend will use (all camelCase)
export type ApiTrain = {
  id: number;
  created_at: string;
  name: string;
  code: string;
  direction: "up" | "down";
  routeId: number; // <-- camelCase
  stoppages: TrainStoppage[];
};

// --- ADDED ---
// Helper function to map DB response to frontend type
const mapDbTrainToApiTrain = (dbTrain: DbTrain): ApiTrain => ({
  id: dbTrain.id,
  created_at: dbTrain.created_at,
  name: dbTrain.name,
  code: dbTrain.code,
  direction: dbTrain.direction,
  routeId: dbTrain.route_id,
  stoppages: dbTrain.stoppages,
});

// For creating a new train (this type is correct, backend expects route_id)
export type NewTrainData = {
  name: string;
  code: string;
  direction: "up" | "down";
  route_id: number;
  stoppages: TrainStoppage[];
};

// For updating a train (this type is correct)
export type UpdateTrainData = Partial<NewTrainData>;

// Type-safe payload for the backend API (snake_case, all optional)
type TrainUpdatePayload = {
  name?: string;
  code?: string;
  direction?: "up" | "down";
  route_id?: number;
  stoppages?: TrainStoppage[];
};

/**
 * Fetches all trains.
 */
export const getTrains = async (): Promise<ApiTrain[]> => {
  // 1. FIX: Hit the /public/trains route
  const { data } = await apiClient.get<DbTrain[]>("/public/trains");
  // 2. FIX: Map snake_case response to camelCase
  return data.map(mapDbTrainToApiTrain);
};

/**
 * Creates a new train.
 */
export const createTrain = async (
  trainData: NewTrainData
): Promise<ApiTrain> => {
  const payload = {
    ...trainData,
    route_id: trainData.route_id,
  };
  const { data } = await apiClient.post<DbTrain>("/admin/trains", payload);
  // 3. FIX: Map snake_case response to camelCase
  return mapDbTrainToApiTrain(data);
};

/**
 * Updates an existing train.
 */
export const updateTrain = async ({
  id,
  updates,
}: {
  id: number;
  updates: UpdateTrainData;
}): Promise<ApiTrain> => {
  // This mapping logic is correct
  const payload: TrainUpdatePayload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.code !== undefined) payload.code = updates.code;
  if (updates.direction !== undefined) payload.direction = updates.direction;
  if (updates.stoppages !== undefined) payload.stoppages = updates.stoppages;
  if (updates.route_id !== undefined) payload.route_id = updates.route_id;

  const { data } = await apiClient.put<DbTrain>(`/admin/trains/${id}`, payload);
  // 4. FIX: Map snake_case response to camelCase
  return mapDbTrainToApiTrain(data);
};

/**
 * Deletes a train by its ID.
 */
export const deleteTrain = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/trains/${id}`);
};