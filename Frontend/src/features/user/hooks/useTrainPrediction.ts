import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiTrain } from "@/features/admin/api/trainsApi";
import type { ApiRoute } from "@/features/admin/api/routesApi";
import type { DailyTrainStatus } from "@/features/admin/api/statusApi";
import { getTrainHistory } from "@features/user/api/historyApi";
import {
  getAverageTravelTime,
  getDefaultTravelTime,
  getFullJourney,
  parseTimeToToday, // Import the helper
} from "@features/user/utils/predictionLogic";

export type Prediction = {
  stationId: string;
  stationName: string;
  predictedTime: Date | null;
  type: "default" | "average" | "arrived";
};

// New type for "At Station" info
export type AtStationInfo = {
  stationName: string;
  departureTime: number; // Timestamp
};

const FIVE_MINUTES_MS = 1000 * 60 * 5;
const DEFAULT_FALLBACK_MS = 1000 * 60 * 30; // 30 min fallback if no data

/**
 * The core hook for calculating a train's predicted arrival times.
 */
export function useTrainPrediction(
  train?: ApiTrain,
  route?: ApiRoute,
  status?: DailyTrainStatus | null
) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentTravelInfo, setCurrentTravelInfo] = useState<{
    from: string;
    to: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const [atStationInfo, setAtStationInfo] = useState<AtStationInfo | null>(null); // NEW
  const [warning, setWarning] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now()); // NEW: Current time state

  // 1. Fetch 7-day history for this train
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["trainHistory", train?.id],
    queryFn: () => getTrainHistory(train!.id),
    enabled: !!train,
  });

  // NEW: Effect to update 'now' every 10 seconds to refresh UI
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000); // Update every 10 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Wait for all data to be loaded
    if (!train || !route || !history || status === undefined) {
      setPredictions([]);
      setCurrentTravelInfo(null);
      setAtStationInfo(null);
      return;
    }

    const journey = getFullJourney(
      route.stations,
      train.stoppages,
      train.direction
    );
    if (journey.length === 0) return;

    // --- LOGIC REWRITE ---

    const newPredictions: Prediction[] = [];
    setWarning(null);
    setCurrentTravelInfo(null);
    setAtStationInfo(null);

    const lastArrivalIndex = (status?.arrivals.length || 0) - 1;
    const lastArrival = status?.arrivals[lastArrivalIndex];

    let predictionStartTime: number;
    let predictionStartIndex: number;
    let currentStationName: string;

    if (lastArrival) {
      // Train is AT a station or EN ROUTE from it
      const lastArrivalTime = new Date(lastArrival.arrivedAt).getTime();
      currentStationName = lastArrival.stationName;

      if (now - lastArrivalTime < FIVE_MINUTES_MS) {
        // --- State: AT STATION ---
        // (Less than 5 mins have passed since arrival)
        const departureTime = lastArrivalTime + FIVE_MINUTES_MS;
        setAtStationInfo({
          stationName: currentStationName,
          departureTime: departureTime,
        });
        predictionStartTime = departureTime; // Predictions start from departure time
        predictionStartIndex = lastArrivalIndex + 1; // Predict from the *next* station
      } else {
        // --- State: EN ROUTE ---
        // (More than 5 mins have passed)
        predictionStartTime = lastArrivalTime; // Predictions start from last arrival time
        predictionStartIndex = lastArrivalIndex + 1; // Predict from the *next* station
      }
    } else {
      // --- State: PENDING DEPARTURE ---
      // (No arrivals yet)
      currentStationName = "Start";
      predictionStartIndex = 0; // Predict from the very first station

      // Get scheduled start time
      const firstStoppage =
        journey.length > 0
          ? train.stoppages.find((s) => s.stationId === journey[0].stationId)
          : null;
      const scheduledStartTimeStr =
        train.direction === "up"
          ? firstStoppage?.upArrivalTime
          : firstStoppage?.downArrivalTime;

      if (scheduledStartTimeStr) {
        predictionStartTime = parseTimeToToday(scheduledStartTimeStr);
      } else {
        predictionStartTime = Date.now(); // Fallback
      }

      // If scheduled time is in the past, default to now
      if (predictionStartTime < now) {
        predictionStartTime = now;
      }
    }

    // --- Prediction Loop ---
    let lastArrivalTimeForLoop = predictionStartTime;
    let nextStationForProgress: string | null = null;
    let predictedEndTimeForProgress: number | null = null;
    for (let i = predictionStartIndex; i < journey.length; i++) {
      const lastStation = journey[i - 1];
      const currentStation = journey[i];

      // Use first station as 'lastStation' for the first prediction
      const lastStationId =
        lastStation?.stationId || journey[0]?.stationId;
      if (!lastStationId) continue; // Safety check

      const currentStationId = currentStation.stationId;

      // 1. Try to get 7-day average
      let travelTime = getAverageTravelTime(
        history,
        lastStationId,
        currentStationId
      );
      let type: Prediction["type"] = "average";

      // 2. If no average, use default schedule time
      if (!travelTime) {
        travelTime = getDefaultTravelTime(
          train.stoppages,
          lastStationId,
          currentStationId
        );
        type = "default";
      }

      // 3. If still no time, use a hardcoded fallback
      if (!travelTime) {
        travelTime = DEFAULT_FALLBACK_MS;
        type = "default";
      }

      // Add stoppage time (5 mins) for all stations *except* the first one we are predicting
      const stoppageTime = i > predictionStartIndex ? FIVE_MINUTES_MS : 0;

      const predictedTime = new Date(
        lastArrivalTimeForLoop + (travelTime || 0) + stoppageTime
      );

      newPredictions.push({
        stationId: currentStation.stationId,
        stationName:
          route.stations.find((s) => s.stationId === currentStation.stationId)
            ?.stationName || "Unknown",
        predictedTime: predictedTime,
        type: type,
      });

      // Update for next loop
      lastArrivalTimeForLoop = predictedTime.getTime();

      // Set progress bar info (only if we are "en route")
      if (i === predictionStartIndex && !atStationInfo && lastArrival) {
        nextStationForProgress =
          route.stations.find((s) => s.stationId === currentStation.stationId)
            ?.stationName || "Unknown";
        predictedEndTimeForProgress = predictedTime.getTime();
      }
    }

    setPredictions(newPredictions);

    // Set info for the progress bar (only if EN ROUTE)
    if (
      nextStationForProgress &&
      predictedEndTimeForProgress &&
      !status?.lap_completed &&
      !atStationInfo &&
      lastArrival
    ) {
      const departureTime = new Date(lastArrival.arrivedAt).getTime() + FIVE_MINUTES_MS;

      setCurrentTravelInfo({
        from: currentStationName,
        to: nextStationForProgress,
        startTime: departureTime, // Start time is *after* the 5-min stop
        endTime: predictedEndTimeForProgress,
      });

      // Check for lateness (user's request)
      if (now > predictedEndTimeForProgress + FIVE_MINUTES_MS) {
        // 5 min buffer
        setWarning("Train is running late. Predictions may be inaccurate.");
      }
    }
  }, [train, route, status, history, now, atStationInfo]); // Re-run when 'now' changes

  return {
    predictions,
    currentTravelInfo,
    atStationInfo, // NEW
    warning,
    isLoading: isLoadingHistory,
  };
}