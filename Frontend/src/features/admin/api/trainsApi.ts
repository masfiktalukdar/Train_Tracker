import apiClient from "@/lib/apiClient";
import type { TrainStoppage } from "@/types/dataModels";

// --- MODIFIED ---
// This is the type returned by the backend (snake_case)
// Note: stoppages can be a string
type DbTrain = {
  id: number;
  created_at: string;
  name: string;
  code: string;
  direction: "up" | "down";
  route_id: number;
  stoppages: string | TrainStoppage[]; // <-- MODIFIED
};

// This is the type the frontend will use (all camelCase)
export type ApiTrain = {
  id: number;
  created_at: string;
  name: string;
  code: string;
  direction: "up" | "down";
  routeId: number;
  stoppages: TrainStoppage[];
};

// --- MODIFIED ---
// Helper function to map DB response to frontend type AND parse stoppages
const mapDbTrainToApiTrain = (dbTrain: DbTrain): ApiTrain => {
  let stoppages: TrainStoppage[] = [];
  if (dbTrain.stoppages && typeof dbTrain.stoppages === 'string') {
    try {
      stoppages = JSON.parse(dbTrain.stoppages);
    } catch (e) {
      console.error(`Failed to parse stoppages for train ${dbTrain.id}:`, e);
    }
  } else if (Array.isArray(dbTrain.stoppages)) {
    stoppages = dbTrain.stoppages;
  }

  return {
    id: dbTrain.id,
    created_at: dbTrain.created_at,
    name: dbTrain.name,
    code: dbTrain.code,
    direction: dbTrain.direction,
    routeId: dbTrain.route_id,
    stoppages: stoppages, // <-- Use the parsed array
  };
};

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
  const { data } = await apiClient.get<DbTrain[]>("/public/trains");
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
  return mapDbTrainToApiTrain(data);
};

/**
 * Deletes a train by its ID.
 */
export const deleteTrain = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/trains/${id}`);
};