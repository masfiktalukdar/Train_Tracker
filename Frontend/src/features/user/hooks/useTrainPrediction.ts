import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiTrain } from "@/features/admin/api/trainsApi";
import type { ApiRoute } from "@/features/admin/api/routesApi";
import type { DailyTrainStatus } from "@/features/admin/api/statusApi";
import { getTrainHistory } from "@features/user/api/historyApi";
import {
  getAverageTravelTime,
  getDefaultTravelTime,
  getFullJourney,
  parseTimeToToday,
} from "@features/user/utils/predictionLogic";
import type { Station } from "@/types/dataModels";

export type Prediction = {
  stationId: string;
  stationName: string;
  predictedTime: Date | null;
  type: "default" | "average" | "arrived";
};

export type AtStationInfo = {
  stationName: string;
  departureTime: number; // The *predicted* departure time
  arrivedAt: number; // The *actual* arrival time
  isTurnaround: boolean; // NEW: Flag for turnaround
};

const FIVE_MINUTES_MS = 1000 * 60 * 5;
const DEFAULT_FALLBACK_MS = 1000 * 60 * 30; // 30 minutes

export function useTrainPrediction(
  train?: ApiTrain | null,
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
  const [atStationInfo, setAtStationInfo] = useState<AtStationInfo | null>(
    null
  );
  // atTurnaroundInfo is removed
  const [isJourneyComplete, setIsJourneyComplete] = useState(false);
  const [isAtFinalStation, setIsAtFinalStation] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["trainHistory", train?.id],
    queryFn: () => getTrainHistory(train!.id),
    enabled: !!train,
  });

  // This timer updates 'now' every 10 seconds to refresh calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000); // 10 seconds
    return () => clearInterval(timer);
  }, []);

  const {
    journey,
    firstLegLength,
    finalStation,
    turnaroundStation,
    turnaroundDefaultDepartureTime,
  } = useMemo(() => {
    if (!train || !route) {
      return {
        journey: [],
        firstLegLength: 0,
        finalStation: undefined,
        turnaroundStation: undefined,
        turnaroundDefaultDepartureTime: undefined,
      };
    }
    const fullJourney: Station[] = getFullJourney(
      route.stations,
      train.stoppages,
      train.direction
    );
    const firstLegStations = route.stations.filter((station) =>
      train.stoppages.some((ts) => ts.stationId === station.stationId)
    );
    const legLength = firstLegStations.length;
    const fStation = fullJourney[fullJourney.length - 1];
    const turnStation = legLength > 0 ? fullJourney[legLength - 1] : undefined;

    // Find the default turnaround time
    let turnDefaultTime: string | undefined;
    if (turnStation) {
      const turnStoppage = train.stoppages.find(
        (s) => s.stationId === turnStation.stationId
      );
      if (turnStoppage) {
        // The turnaround departure time is the *opposite* of the train's primary direction
        turnDefaultTime =
          train.direction === "up"
            ? turnStoppage.downArrivalTime
            : turnStoppage.upArrivalTime;
      }
    }

    return {
      journey: fullJourney,
      firstLegLength: legLength,
      finalStation: fStation,
      turnaroundStation: turnStation,
      turnaroundDefaultDepartureTime: turnDefaultTime,
    };
  }, [train, route]);

  useEffect(() => {
    if (
      !train ||
      !route ||
      !history ||
      status === undefined ||
      journey.length === 0
    ) {
      // Clear all state if essential data is missing
      setPredictions([]);
      setCurrentTravelInfo(null);
      setAtStationInfo(null);
      setIsJourneyComplete(false);
      setIsAtFinalStation(false);
      setWarning(null);
      return;
    }

    // --- 1. Check for Journey Completion ---
    if (status?.lap_completed) {
      if (!isJourneyComplete) {
        setIsJourneyComplete(true);
        setPredictions([]);
        setCurrentTravelInfo(null);
        setAtStationInfo(null);
        setWarning(null);
      }
      return;
    } else if (isJourneyComplete) {
      setIsJourneyComplete(false);
    }

    // --- 2. Define State Variables ---
    const lastArrival =
      status?.arrivals && status.arrivals.length > 0
        ? status.arrivals[status.arrivals.length - 1]
        : null;
    const lastDeparture =
      status?.departures && status.departures.length > 0
        ? status.departures[status.departures.length - 1]
        : null;

    const arrivalsCount = status?.arrivals.length || 0;
    const departuresCount = status?.departures.length || 0;

    let predictionStartTime: number;
    let predictionStartIndex: number;
    let newWarning: string | null = null;
    let newAtStationInfo: AtStationInfo | null = null;
    let newCurrentTravelInfo: typeof currentTravelInfo = null;

    // --- 3. Check for Final Station Arrival ---
    if (
      lastArrival &&
      finalStation &&
      lastArrival.stationId === finalStation.stationId
    ) {
      if (!isAtFinalStation) setIsAtFinalStation(true);
      // Don't return, we might still be "At Station"
    } else if (isAtFinalStation) {
      setIsAtFinalStation(false);
    }

    // --- 4. Determine Current State (Pending, At Station, or En Route) ---

    if (arrivalsCount === 0) {
      // --- STATE: PENDING DEPARTURE ---
      // Train hasn't started yet.
      predictionStartIndex = 0;
      const firstStoppage = journey[0]
        ? train.stoppages.find((s) => s.stationId === journey[0].stationId)
        : null;
      const scheduledStartTimeStr =
        train.direction === "up"
          ? firstStoppage?.upArrivalTime
          : firstStoppage?.downArrivalTime;

      predictionStartTime = parseTimeToToday(scheduledStartTimeStr || "");
      if (predictionStartTime === 0) {
        // Fallback if schedule is missing
        predictionStartTime = now;
      } else if (predictionStartTime < now) {
        // Train is late to start
        newWarning = "Train is late to begin its journey.";
        // Predict from *now*
        predictionStartTime = now;
      }
    } else if (arrivalsCount > departuresCount) {
      // --- STATE: AT STATION ---
      // Train has arrived but not departed.
      const lastArrivalTime = new Date(lastArrival!.arrivedAt).getTime();
      const currentStationName = lastArrival!.stationName;

      // NEW: Check if this is the turnaround stop
      const isTurnaround =
        lastArrival!.stationId === turnaroundStation?.stationId &&
        arrivalsCount - 1 === firstLegLength - 1;

      let scheduledDepartureTime;

      if (isTurnaround && turnaroundDefaultDepartureTime) {
        // Use default schedule for turnaround departure
        scheduledDepartureTime =
          parseTimeToToday(turnaroundDefaultDepartureTime) + FIVE_MINUTES_MS;
      } else {
        // Use 5 mins from arrival for normal stops
        scheduledDepartureTime = lastArrivalTime + FIVE_MINUTES_MS;
      }

      newAtStationInfo = {
        stationName: currentStationName,
        departureTime: scheduledDepartureTime,
        arrivedAt: lastArrivalTime,
        isTurnaround: isTurnaround, // Pass flag
      };

      predictionStartIndex = arrivalsCount; // Next station to predict is after this one
      predictionStartTime = scheduledDepartureTime; // Predictions start from departure

      // Check for "Late at Station"
      const lateTime = now - scheduledDepartureTime - FIVE_MINUTES_MS; // 5 min grace period
      if (lateTime > 0) {
        const minutesLate = Math.round(lateTime / 60000);
        newWarning = `The train is getting late in ${currentStationName} for ${minutesLate} minutes`;
        // Predict from *now* since it's late
        predictionStartTime = now;
      }
    } else {
      // --- STATE: EN ROUTE ---
      // arrivalsCount === departuresCount, and > 0
      // Train has departed and is moving.
      const lastDepartureTime = new Date(lastDeparture!.departedAt).getTime();
      // const fromStationName = lastDeparture!.stationName;
      const nextStation = journey[departuresCount]; // Next station is at index `departuresCount`

      if (nextStation) {
        predictionStartIndex = departuresCount; // Start prediction from this station
        predictionStartTime = lastDepartureTime; // Predictions start from actual departure time

        // We will set newCurrentTravelInfo *after* calculating predictions
        // to get the first prediction's endTime.
      } else {
        // This shouldn't happen if lap_completed is false, but as a fallback:
        predictionStartIndex = -1; // No more stations
        predictionStartTime = now;
      }
    }

    // --- 5. Calculate Predictions ---
    let lastEventTime = predictionStartTime;
    const newPredictions: Prediction[] = [];

    if (predictionStartIndex !== -1) {
      for (let i = predictionStartIndex; i < journey.length; i++) {
        const currentStation = journey[i];
        let travelTime: number | null = 0;
        let type: Prediction["type"] = "default";
        let lastStationId: string | undefined; // Can be undefined for first station

        // --- Determine travelTime and lastStationId ---
        if (i === 0 && predictionStartIndex === 0) {
          // --- Case: PENDING ---
          // This is the first station (journey[0]).
          // The "travel time" is 0, the arrival is the scheduled start.
          travelTime = 0;
          type = "default";
          lastStationId = undefined; // No last station, so travelTime is 0.
        } else {
          // --- Case: AT_STATION, EN_ROUTE, or SUBSEQUENT ---

          // Determine the ID of the station we are predicting *from*
          if (i === predictionStartIndex) {
            // This is the *first* prediction in this run
            if (arrivalsCount > departuresCount) {
              // We are AT a station. Predict from here.
              lastStationId = journey[arrivalsCount - 1].stationId;
            } else {
              // We are EN ROUTE. Predict from the station we departed.
              // This block is safe because (arrivalsCount > 0)
              lastStationId = journey[departuresCount - 1].stationId;
            }
          } else {
            // This is a subsequent prediction (i > predictionStartIndex).
            // Predict from the previous station in the list.
            lastStationId = journey[i - 1].stationId;
          }

          // Handle if lastStationId is still undefined (shouldn't happen, but good safety)
          if (!lastStationId) {
            travelTime = DEFAULT_FALLBACK_MS;
            type = "default";
          } else {
            // We have a valid lastStationId, get travel time
            const currentStationId = currentStation.stationId;
            const isFirstStationOfLeg = i === 0 || i === firstLegLength;

            travelTime = getAverageTravelTime(
              history,
              lastStationId,
              currentStationId
            );
            type = "average";

            if (!travelTime) {
              const legDir =
                i < firstLegLength
                  ? train.direction
                  : train.direction === "up"
                    ? "down"
                    : "up";
              travelTime = getDefaultTravelTime(
                train.stoppages,
                lastStationId,
                currentStationId,
                legDir,
                isFirstStationOfLeg
              );
              type = "default";
            }

            if (!travelTime) {
              travelTime = DEFAULT_FALLBACK_MS;
              type = "default";
            }
          }
        }

        const predictedArrival = new Date(lastEventTime + (travelTime || 0));

        newPredictions.push({
          stationId: currentStation.stationId,
          stationName:
            route.stations.find((s) => s.stationId === currentStation.stationId)
              ?.stationName || "Unknown",
          predictedTime: predictedArrival,
          type: type,
        });

        // Next event time includes the stoppage
        lastEventTime = predictedArrival.getTime() + FIVE_MINUTES_MS;
      }
    }

    // --- 6. Set En Route Info & "Late En Route" Warning ---
    if (arrivalsCount === departuresCount && arrivalsCount > 0 && !newAtStationInfo) {
      const firstPrediction = newPredictions[0];
      if (firstPrediction && lastDeparture) {
        const lastDepartureTime = new Date(lastDeparture.departedAt).getTime();
        const predictedArrivalTime = firstPrediction.predictedTime
          ? firstPrediction.predictedTime.getTime()
          : 0;

        newCurrentTravelInfo = {
          from: lastDeparture.stationName,
          to: firstPrediction.stationName,
          startTime: lastDepartureTime,
          endTime: predictedArrivalTime,
        };

        // Check for "Late En Route"
        const lateTime = now - predictedArrivalTime - FIVE_MINUTES_MS; // 5 min grace
        if (lateTime > 0) {
          newWarning = `The ${train.name} is getting late. Inconvenience can happen.`;
        }
      }
    }

    // --- 7. Final State Updates (only if changed) ---
    if (JSON.stringify(newPredictions) !== JSON.stringify(predictions)) {
      setPredictions(newPredictions);
    }
    if (newWarning !== warning) {
      setWarning(newWarning);
    }
    if (JSON.stringify(newAtStationInfo) !== JSON.stringify(atStationInfo)) {
      setAtStationInfo(newAtStationInfo);
    }
    if (
      JSON.stringify(newCurrentTravelInfo) !== JSON.stringify(currentTravelInfo)
    ) {
      setCurrentTravelInfo(newCurrentTravelInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    train,
    route,
    status,
    history,
    now,
    journey,
    firstLegLength,
    finalStation,
    isJourneyComplete, // Added to ensure re-run when status becomes complete
    isAtFinalStation, // Added for same reason
    turnaroundStation,
    turnaroundDefaultDepartureTime,
  ]);

  return {
    predictions,
    currentTravelInfo,
    atStationInfo,
    atTurnaroundInfo: null, // This is now deprecated
    isJourneyComplete,
    isAtFinalStation,
    warning,
    isLoading: isLoadingHistory,
  };
}