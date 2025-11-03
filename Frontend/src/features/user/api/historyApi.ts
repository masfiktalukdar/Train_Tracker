import apiClient from "@/lib/apiClient";
import type { StationArrivalRecord } from "@/features/admin/api/statusApi";

export type TrainHistoryRecord = {
  date: string;
  arrivals: StationArrivalRecord[];
};

/**
 * Fetches the last 7 days of arrival history for a specific train.
 */
export const getTrainHistory = async (trainId: number): Promise<TrainHistoryRecord[]> => {
  try {
    const { data } = await apiClient.get<TrainHistoryRecord[]>(`/public/history/${trainId}`);
    return data || [];
  } catch (error) {
    console.error("Failed to fetch train history:", error);
    return []; // Return empty array on error
  }
};
