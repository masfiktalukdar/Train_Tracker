import apiClient from "@/lib/apiClient";
import type { TrainStoppage } from "@/types/dataModels";


type DbTrain = {
  id: number;
  created_at: string;
  name: string;
  code: string;
  direction: "up" | "down";
  route_id: number;
  stoppages: string | TrainStoppage[]; 
};

export type ApiTrain = {
  id: number;
  created_at: string;
  name: string;
  code: string;
  direction: "up" | "down";
  routeId: number;
  stoppages: TrainStoppage[];
};

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
    stoppages: stoppages, 
  };
};

export type NewTrainData = {
  name: string;
  code: string;
  direction: "up" | "down";
  route_id: number;
  stoppages: TrainStoppage[];
};

export type UpdateTrainData = Partial<NewTrainData>;

type TrainUpdatePayload = {
  name?: string;
  code?: string;
  direction?: "up" | "down";
  route_id?: number;
  stoppages?: TrainStoppage[];
};


export const getTrains = async (): Promise<ApiTrain[]> => {
  const { data } = await apiClient.get<DbTrain[]>("/public/trains");
  return data.map(mapDbTrainToApiTrain);
};


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


export const updateTrain = async ({
  id,
  updates,
}: {
  id: number;
  updates: UpdateTrainData;
}): Promise<ApiTrain> => {
  const payload: TrainUpdatePayload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.code !== undefined) payload.code = updates.code;
  if (updates.direction !== undefined) payload.direction = updates.direction;
  if (updates.stoppages !== undefined) payload.stoppages = updates.stoppages;
  if (updates.route_id !== undefined) payload.route_id = updates.route_id;

  const { data } = await apiClient.put<DbTrain>(`/admin/trains/${id}`, payload);
  return mapDbTrainToApiTrain(data);
};


export const deleteTrain = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/trains/${id}`);
};