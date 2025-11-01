import { create } from "zustand";

type TrainStatus = {
  trainId: string;
  // This index points to the full journey array (including round trip)
  currentJourneyIndex: number;
  lastUpdated: string; // ISO string
};

type TrainStatusStore = {
  statuses: Record<string, TrainStatus>;
  // Sets or resets a train's journey
  startOrResetJourney: (trainId: string) => void;
  // Admin clicks a station in the UI to mark it as the current one
  markStationAsCurrent: (trainId: string, journeyIndex: number) => void;
};

export const useTrainStatusStore = create<TrainStatusStore>((set) => ({
  statuses: {},

  startOrResetJourney: (trainId) =>
    set((state) => ({
      statuses: {
        ...state.statuses,
        [trainId]: {
          trainId: trainId,
          currentJourneyIndex: 0, // Start from the beginning
          lastUpdated: new Date().toISOString(),
        },
      },
    })),

  markStationAsCurrent: (trainId, journeyIndex) =>
    set((state) => {
      // If the train doesn't have a status, create one
      const currentStatus = state.statuses[trainId] || {
        trainId,
        currentJourneyIndex: 0
      };

      return {
        statuses: {
          ...state.statuses,
          [trainId]: {
            ...currentStatus,
            currentJourneyIndex: journeyIndex,
            lastUpdated: new Date().toISOString(),
          },
        },
      };
    }),
}));