import apiClient from "@/lib/apiClient";

// Helper to get today's date as YYYY-MM-DD string
export const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};

export type StationArrivalRecord = {
  id: string; // uuid for this specific arrival
  stationId: string;
  stationName: string;
  arrivedAt: string; // ISO timestamp
};

// This matches your 'daily_status' table and your old Zustand store
export type DailyTrainStatus = {
  train_id: number;
  date: string; // "YYYY-MM-DD"
  lap_completed: boolean;
  arrivals: StationArrivalRecord[];
  last_completed_station_id: string | null;
};

// This is the payload for the 'upsert' operation
export type UpdateStatusPayload = Omit<DailyTrainStatus, "train_id"> & {
  train_id: number;
};

/**
 * Fetches the daily status for a specific train and date.
 * Returns null if no record exists for today.
 */
export const getDailyStatus = async (
  trainId: number,
  date: string
): Promise<DailyTrainStatus | null> => {
  try {
    // FIX: Hit the /public/status route instead of /admin/status
    const { data } = await apiClient.get(
      `/public/status/${trainId}?date=${date}`
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch status", error);
    return null;
  }
};

/**
 * Updates (or creates) the daily status for a train.
 * This corresponds to your backend's 'upsert' endpoint.
 */
export const updateDailyStatus = async (
  payload: UpdateStatusPayload
): Promise<DailyTrainStatus> => {
  const { data } = await apiClient.post("/admin/status/update", payload);
  return data;
};