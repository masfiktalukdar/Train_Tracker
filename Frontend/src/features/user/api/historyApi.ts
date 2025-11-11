import apiClient from "@/lib/apiClient";
// Import the new departure type
import type {
  StationArrivalRecord,
  StationDepartureRecord,
} from "@/features/admin/api/statusApi";

export type TrainHistoryRecord = {
  date: string;
  arrivals: StationArrivalRecord[];
  departures: StationDepartureRecord[]; // NEW
};

/**
 * Fetches the last 7 days of arrival history for a specific train.
 */
export const getTrainHistory = async (
  trainId: number
): Promise<TrainHistoryRecord[]> => {
  try {
    const { data } = await apiClient.get<TrainHistoryRecord[]>(
      `/public/history/${trainId}`
    );
    // Ensure departures is an array for each record
    return (
      data?.map((record) => ({
        ...record,
        arrivals: record.arrivals || [],
        departures: record.departures || [],
      })) || []
    );
  } catch (error) {
    console.error("Failed to fetch train history:", error);
    return []; // Return empty array on error
  }
};