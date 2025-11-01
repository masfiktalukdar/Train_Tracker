import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { Station } from "./adminStationStore";

// Helper to get today's date as YYYY-MM-DD string
const getTodayDateString = function() {
  return new Date().toISOString().split('T')[0];
};

type StationArrivalRecord = {
  id: string; // uuid for this specific arrival
  stationId: string;
  stationName: string;
  arrivedAt: string; // ISO timestamp
};

// Represents the train's status for a single day
type DailyTrainStatus = {
  date: string; // "YYYY-MM-DD"
  lastCompletedStationId: string | null; // The ID of the last station clicked
  arrivals: StationArrivalRecord[]; // A log of arrivals for this day
  lapCompleted: boolean; // Has the single lap for the day been done?
};

type TrainStatusStore = {
  // statuses: Record<trainId, DailyTrainStatus>
  // This stores the status for the *current day* only
  statuses: Record<string, DailyTrainStatus>;

  // Gets or creates the status for a train for the *current day*
  getTodaysStatus: (trainId: string) => DailyTrainStatus;

  // Admin marks a station as arrived
  markStationAsArrived: (trainId: string, station: Station) => void;

  // Admin "undoes" an arrival (goes back)
  undoArrival: (trainId: string, newLastStationId: string | null) => void;

  // Marks the full lap as complete for the day
  completeLap: (trainId: string) => void;
};

export const useTrainStatusStore = create<TrainStatusStore>((set, get) => ({
  statuses: {},

  getTodaysStatus: (trainId) => {
    const today = getTodayDateString();
    const currentStatus = get().statuses[trainId];

    // If status exists and is for today, return it
    if (currentStatus && currentStatus.date === today) {
      return currentStatus;
    }

    // Otherwise, create a new one for today
    const newDailyStatus: DailyTrainStatus = {
      date: today,
      lastCompletedStationId: null,
      arrivals: [],
      lapCompleted: false,
    };

    // We don't set state here, this is just a getter/initializer
    // The main actions will set state
    return newDailyStatus;
  },

  markStationAsArrived: (trainId, station) =>
    set((state) => {
      const today = getTodayDateString();
      const currentStatus = state.getTodaysStatus(trainId);

      // If date is not today, start fresh
      const statusForToday = currentStatus.date === today
        ? currentStatus
        : { date: today, lastCompletedStationId: null, arrivals: [], lapCompleted: false };

      // Prevent adding more if lap is complete
      if (statusForToday.lapCompleted) return state;

      const newArrival: StationArrivalRecord = {
        id: uuid(),
        stationId: station.stationId,
        stationName: station.stationName,
        arrivedAt: new Date().toISOString(),
      };

      const updatedStatus: DailyTrainStatus = {
        ...statusForToday,
        lastCompletedStationId: station.stationId,
        arrivals: [...statusForToday.arrivals, newArrival],
      };

      return {
        statuses: { ...state.statuses, [trainId]: updatedStatus },
      };
    }),

  // *** FIXED *** (Issue 3: Can't complete lap due to round trip)
  undoArrival: (trainId, newLastStationId) =>
    set((state) => {
      const today = getTodayDateString();
      const currentStatus = state.getTodaysStatus(trainId);

      // Can't undo if not for today
      if (currentStatus.date !== today) return state;

      let newArrivals = currentStatus.arrivals;

      if (newLastStationId === null) {
        // Rolling back to the beginning
        newArrivals = [];
      } else {
        // Find the LAST index of the station we are rolling back to
        // This fixes the bug where findIndex would only find the *first* 'A' on a round trip
        const rollbackIndex = newArrivals.reduce((lastIndex, item, currentIndex) =>
          item.stationId === newLastStationId ? currentIndex : lastIndex,
          -1);

        if (rollbackIndex > -1) {
          // Roll back *to* this station (keep it, remove ones after it)
          newArrivals = newArrivals.slice(0, rollbackIndex + 1);
        } else {
          // This station wasn't found (shouldn't happen if called correctly)
          return state;
        }
      }

      const updatedStatus: DailyTrainStatus = {
        ...currentStatus,
        lastCompletedStationId: newLastStationId,
        arrivals: newArrivals,
        lapCompleted: false, // Can't be completed if we just undid
      };

      return {
        statuses: { ...state.statuses, [trainId]: updatedStatus },
      };
    }),

  completeLap: (trainId: string) =>
    set((state) => {
      const today = getTodayDateString();
      const currentStatus = state.getTodaysStatus(trainId);

      // Can only complete today's lap
      if (currentStatus.date !== today) return state;

      const updatedStatus: DailyTrainStatus = {
        ...currentStatus,
        lapCompleted: true,
      };

      return {
        statuses: { ...state.statuses, [trainId]: updatedStatus },
      };
    }),
}));