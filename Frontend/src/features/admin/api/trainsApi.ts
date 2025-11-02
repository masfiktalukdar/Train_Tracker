import apiClient from '@/lib/apiClient';
import type { Train, TrainStoppage } from '@/types/dataModels';

// Supabase returns 'id' as a number and 'created_at'
export type ApiTrain = Omit<Train, 'id' | 'routeId'> & {
  id: number;
  route_id: number; // Backend uses snake_case for the foreign key
  created_at: string;
};

// For creating a new train
export type NewTrainData = {
  name: string;
  code: string;
  direction: 'up' | 'down';
  route_id: number; // Use the numeric ID
  stoppages: TrainStoppage[];
};

// For updating a train (frontend type, camelCase)
export type UpdateTrainData = Partial<NewTrainData>;

// --- NEW: Type-safe payload for the backend API (snake_case, all optional) ---
type TrainUpdatePayload = {
  name?: string;
  code?: string;
  direction?: 'up' | 'down';
  route_id?: number;
  stoppages?: TrainStoppage[];
};

/**
 * Fetches all trains.
 */
export const getTrains = async (): Promise<ApiTrain[]> => {
  const { data } = await apiClient.get('/admin/trains');
  return data;
};

/**
 * Creates a new train.
 */
export const createTrain = async (
  trainData: NewTrainData
): Promise<ApiTrain> => {
  // Backend expects snake_case for route_id, which matches our payload
  const payload = {
    ...trainData,
    route_id: trainData.route_id,
  };
  const { data } = await apiClient.post('/admin/trains', payload);
  return data;
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
  // --- CORRECTED: Manually map from camelCase (frontend) to snake_case (backend) ---
  const payload: TrainUpdatePayload = {};

  // Check for each property explicitly
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.code !== undefined) payload.code = updates.code;
  if (updates.direction !== undefined) payload.direction = updates.direction;
  if (updates.stoppages !== undefined) payload.stoppages = updates.stoppages;

  // This is the key mapping
  if (updates.route_id !== undefined) payload.route_id = updates.route_id;

  const { data } = await apiClient.put(`/admin/trains/${id}`, payload);
  return data;
};

/**
 * Deletes a train by its ID.
 */
export const deleteTrain = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/trains/${id}`);
};

