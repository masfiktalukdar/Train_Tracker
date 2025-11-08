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
  departureTime: number;
};

export type AtTurnaroundInfo = {
  stationName: string;
  defaultDepartureTime: number;
};

const FIVE_MINUTES_MS = 1000 * 60 * 5;
const DEFAULT_FALLBACK_MS = 1000 * 60 * 30;

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
  const [atStationInfo, setAtStationInfo] = useState<AtStationInfo | null>(null);
  const [atTurnaroundInfo, setAtTurnaroundInfo] =
    useState<AtTurnaroundInfo | null>(null);
  const [isJourneyComplete, setIsJourneyComplete] = useState(false);
  const [isAtFinalStation, setIsAtFinalStation] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["trainHistory", train?.id],
    // @ts-expect-error - ignoring potential ID type mismatch for history API
    queryFn: () => getTrainHistory(train!.id),
    enabled: !!train,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const {
    journey,
    firstLegLength,
    turnaroundStation,
    turnaroundDefaultDepartureTime,
    finalStation,
  } = useMemo(() => {
    if (!train || !route) {
      return {
        journey: [],
        firstLegLength: 0,
        turnaroundStation: undefined,
        turnaroundDefaultDepartureTime: undefined,
        finalStation: undefined,
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
    const turnStation = fullJourney[legLength - 1];
    const fStation = fullJourney[fullJourney.length - 1];

    const turnaroundStoppage = turnStation
      ? train.stoppages.find((s) => s.stationId === turnStation.stationId)
      : undefined;

    const defaultTime =
      train.direction === "up"
        ? turnaroundStoppage?.downArrivalTime
        : turnaroundStoppage?.upArrivalTime;

    return {
      journey: fullJourney,
      firstLegLength: legLength,
      turnaroundStation: turnStation,
      turnaroundDefaultDepartureTime: defaultTime,
      finalStation: fStation,
    };
  }, [train, route]);

  useEffect(() => {
    if (
      !train ||
      !route ||
      !history ||
      status === undefined ||
      !turnaroundStation
    ) {
      setPredictions([]);
      setCurrentTravelInfo(null);
      setAtStationInfo(null);
      setAtTurnaroundInfo(null);
      setIsJourneyComplete(false);
      setIsAtFinalStation(false);
      return;
    }

    if (journey.length === 0) return;

    // Don't clear predictions here, we'll overwrite them.
    // Clearing can cause flickering and extra renders.
    // setPredictions([]);
    // setWarning(null);
    // setCurrentTravelInfo(null);
    // setAtStationInfo(null);
    // setAtTurnaroundInfo(null);
    // setIsJourneyComplete(false);
    // setIsAtFinalStation(false);

    if (status?.lap_completed) {
      if (!isJourneyComplete) setIsJourneyComplete(true);
      return;
    }

    const lastArrivalIndex = (status?.arrivals.length || 0) - 1;
    const lastArrival = status?.arrivals[lastArrivalIndex];

    if (
      lastArrival &&
      finalStation &&
      lastArrival.stationId === finalStation.stationId
    ) {
      if (!isAtFinalStation) setIsAtFinalStation(true);
    } else if (isAtFinalStation) {
      setIsAtFinalStation(false);
    }

    let predictionStartTime: number;
    let predictionStartIndex: number;
    let currentStationName: string;

    // Temporary variables to hold new state values before setting them
    let newAtTurnaroundInfo: AtTurnaroundInfo | null = null;
    let newAtStationInfo: AtStationInfo | null = null;

    if (lastArrival) {
      const lastArrivalTime = new Date(lastArrival.arrivedAt).getTime();
      currentStationName = lastArrival.stationName;

      const isAtTurnaround =
        lastArrival.stationId === turnaroundStation.stationId;

      if (
        isAtTurnaround &&
        lastArrivalIndex === firstLegLength - 1 &&
        turnaroundDefaultDepartureTime
      ) {
        const defaultArrivalTimestamp = parseTimeToToday(
          turnaroundDefaultDepartureTime
        );
        const defaultDepartureTimestamp =
          defaultArrivalTimestamp + FIVE_MINUTES_MS; // departure is 5 mins after scheduled arrival for next leg

        if (now < defaultDepartureTimestamp) {
          newAtTurnaroundInfo = {
            stationName: currentStationName,
            defaultDepartureTime: defaultDepartureTimestamp,
          };
          predictionStartTime = defaultDepartureTimestamp;
        } else {
          predictionStartTime = defaultDepartureTimestamp;
        }
        predictionStartIndex = lastArrivalIndex + 1;
      } else if (now - lastArrivalTime < FIVE_MINUTES_MS) {
        newAtStationInfo = {
          stationName: currentStationName,
          departureTime: lastArrivalTime + FIVE_MINUTES_MS,
        };
        predictionStartTime = lastArrivalTime + FIVE_MINUTES_MS;
        predictionStartIndex = lastArrivalIndex + 1;
      } else {
        predictionStartTime = lastArrivalTime;
        predictionStartIndex = lastArrivalIndex + 1;
      }
    } else {
      currentStationName = "Start";
      predictionStartIndex = 0;
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
        predictionStartTime = Date.now();
      }
      if (predictionStartTime < now) {
        predictionStartTime = now;
      }
    }

    // --- STATE UPDATES WITH CHECKS ---

    // Turnaround Info
    if (
      newAtTurnaroundInfo?.stationName !== atTurnaroundInfo?.stationName ||
      newAtTurnaroundInfo?.defaultDepartureTime !==
      atTurnaroundInfo?.defaultDepartureTime
    ) {
      setAtTurnaroundInfo(newAtTurnaroundInfo);
    }

    // Station Info
    if (
      newAtStationInfo?.stationName !== atStationInfo?.stationName ||
      newAtStationInfo?.departureTime !== atStationInfo?.departureTime
    ) {
      setAtStationInfo(newAtStationInfo);
    }

    if (isAtFinalStation) return;

    let lastArrivalTimeForLoop = predictionStartTime;
    const newPredictions: Prediction[] = [];
    let nextStationForProgress: string | null = null;
    let predictedEndTimeForProgress: number | null = null;

    for (let i = predictionStartIndex; i < journey.length; i++) {
      const lastStation = journey[i - 1];
      const currentStation = journey[i];
      const lastStationId = lastStation?.stationId || journey[0]?.stationId;

      if (!lastStationId) continue;

      const currentStationId = currentStation.stationId;
      let travelTime = getAverageTravelTime(
        history,
        lastStationId,
        currentStationId
      );
      let type: Prediction["type"] = "average";

      if (!travelTime) {
        travelTime = getDefaultTravelTime(
          train.stoppages,
          lastStationId,
          currentStationId,
          i < firstLegLength
            ? train.direction
            : train.direction === "up"
              ? "down"
              : "up"
        );
        type = "default";
      }

      if (!travelTime) {
        travelTime = DEFAULT_FALLBACK_MS;
        type = "default";
      }

      const isTurnaroundStop = i - 1 === firstLegLength - 1;
      const stoppageTime =
        i > predictionStartIndex && !isTurnaroundStop ? FIVE_MINUTES_MS : 0;

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

      lastArrivalTimeForLoop = predictedTime.getTime();

      if (
        i === predictionStartIndex &&
        !newAtStationInfo &&
        !newAtTurnaroundInfo &&
        lastArrival
      ) {
        nextStationForProgress =
          route.stations.find((s) => s.stationId === currentStation.stationId)
            ?.stationName || "Unknown";
        predictedEndTimeForProgress = predictedTime.getTime();
      }
    }

    // Only update predictions if they have changed length or content (simplified check)
    if (JSON.stringify(newPredictions) !== JSON.stringify(predictions)) {
      setPredictions(newPredictions);
    }

    if (
      nextStationForProgress &&
      predictedEndTimeForProgress &&
      !status?.lap_completed &&
      !newAtStationInfo &&
      !newAtTurnaroundInfo &&
      lastArrival
    ) {
      const isTurnaround =
        lastArrival.stationId === turnaroundStation.stationId &&
        lastArrivalIndex === firstLegLength - 1;

      let startTimeForProgress;
      if (isTurnaround && turnaroundDefaultDepartureTime) {
        startTimeForProgress =
          parseTimeToToday(turnaroundDefaultDepartureTime) + FIVE_MINUTES_MS;
      } else {
        startTimeForProgress =
          new Date(lastArrival.arrivedAt).getTime() + FIVE_MINUTES_MS;
      }

      const newTravelInfo = {
        from: currentStationName,
        to: nextStationForProgress,
        startTime: startTimeForProgress,
        endTime: predictedEndTimeForProgress,
      };

      if (
        JSON.stringify(newTravelInfo) !== JSON.stringify(currentTravelInfo)
      ) {
        setCurrentTravelInfo(newTravelInfo);
      }

      const newWarning =
        now > predictedEndTimeForProgress + FIVE_MINUTES_MS
          ? "Train is running late. Predictions may be inaccurate."
          : null;

      if (newWarning !== warning) {
        setWarning(newWarning);
      }
    } else {
      if (currentTravelInfo !== null) setCurrentTravelInfo(null);
      if (warning !== null) setWarning(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    train,
    route,
    status,
    history,
    now,
    journey,
    turnaroundStation,
    firstLegLength,
    turnaroundDefaultDepartureTime,
    finalStation,
    // removed state variables from dependencies to avoid loops
  ]);

  return {
    predictions,
    currentTravelInfo,
    atStationInfo,
    atTurnaroundInfo,
    isJourneyComplete,
    isAtFinalStation,
    warning,
    isLoading: isLoadingHistory,
  };
}