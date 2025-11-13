import apiClient from "@/lib/apiClient";

export const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};

export type StationArrivalRecord = {
  id: string; 
  stationId: string;
  stationName: string;
  arrivedAt: string; 
};

export type StationDepartureRecord = {
  id: string; 
  stationId: string;
  stationName: string;
  departedAt: string; 
};

export type DailyTrainStatus = {
  train_id: number;
  date: string; 
  lap_completed: boolean;
  arrivals: StationArrivalRecord[];
  departures: StationDepartureRecord[];
  last_completed_station_id: string | null;
};

export type UpdateStatusPayload = Omit<DailyTrainStatus, "train_id"> & {
  train_id: number;
};


export const getDailyStatus = async (
  trainId: number,
  date: string
): Promise<DailyTrainStatus | null> => {
  try {
    const { data } = await apiClient.get(
      `/public/status/${trainId}?date=${date}`
    );
    if (data) {
      data.departures = data.departures || [];
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch status", error);
    return null;
  }
};

export const updateDailyStatus = async (
  payload: UpdateStatusPayload
): Promise<DailyTrainStatus> => {
  const { data } = await apiClient.post("/admin/status/update", payload);
  if (data) {
    data.departures = data.departures || [];
  }
  return data;
};