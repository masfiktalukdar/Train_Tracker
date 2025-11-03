import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiTrain } from '@/features/admin/api/trainsApi';
import type { ApiRoute } from '@/features/admin/api/routesApi';
import type { DailyTrainStatus } from '@/features/admin/api/statusApi';
import { getTrainHistory } from '@features/user/api/historyApi';
import { getAverageTravelTime, getDefaultTravelTime, getFullJourney } from '@features/user/utils/predictionLogic';

export type Prediction = {
  stationId: string;
  stationName: string;
  predictedTime: Date | null;
  type: 'default' | 'average' | 'arrived';
};

const FIVE_MINUTES = 1000 * 60 * 5;
const DEFAULT_FALLBACK_MS = 1000 * 60 * 30; // 30 min fallback if no data

/**
 * The core hook for calculating a train's predicted arrival times.
 */
export function useTrainPrediction(train?: ApiTrain, route?: ApiRoute, status?: DailyTrainStatus | null) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentTravelInfo, setCurrentTravelInfo] = useState<{
    from: string;
    to: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // 1. Fetch 7-day history for this train
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['trainHistory', train?.id],
    queryFn: () => getTrainHistory(train!.id),
    enabled: !!train,
  });

  useEffect(() => {
    if (!train || !route || !status || !history) {
      setPredictions([]);
      return;
    }

    const journey = getFullJourney(route.stations, train.stoppages, train.direction);
    if (journey.length === 0) return;

    const newPredictions: Prediction[] = [];
    setWarning(null);

    const lastArrivalIndex = status.arrivals.length - 1;
    let lastArrivalTime = status.arrivals.length > 0
      ? new Date(status.arrivals[lastArrivalIndex].arrivedAt).getTime()
      : new Date().getTime(); // Default to now if not started

    let nextStationForProgress: string | null = null;
    let predictedEndTimeForProgress: number | null = null;
    let currentStationName = "Start";

    if (lastArrivalIndex >= 0) {
      currentStationName = status.arrivals[lastArrivalIndex].stationName;
    }

    // Loop through all stations *after* the last one the train arrived at
    for (let i = lastArrivalIndex + 1; i < journey.length; i++) {
      const lastStation = journey[i - 1];
      const currentStation = journey[i];

      const lastStationId = lastStation?.stationId || journey[0].stationId;
      const currentStationId = currentStation.stationId;

      // 1. Try to get 7-day average
      let travelTime = getAverageTravelTime(history, lastStationId, currentStationId);
      let type: Prediction['type'] = 'average';

      // 2. If no average, use default schedule time
      if (!travelTime) {
        travelTime = getDefaultTravelTime(train.stoppages, lastStationId, currentStationId);
        type = 'default';
      }

      // 3. If still no time, use a hardcoded fallback
      if (!travelTime) {
        travelTime = DEFAULT_FALLBACK_MS;
        type = 'default';
      }

      // If this is a turnaround station, add the admin's default stoppage time
      // (This is a simplified assumption, a more complex app might store this in the DB)
      // For now, we just add 5 minutes for any stop.
      const stoppageTime = (i > lastArrivalIndex + 1) ? FIVE_MINUTES : 0;

      const predictedTime = new Date(lastArrivalTime + travelTime + stoppageTime);

      newPredictions.push({
        stationId: currentStation.stationId,
        stationName: route.stations.find(s => s.stationId === currentStation.stationId)?.stationName || 'Unknown',
        predictedTime: predictedTime,
        type: type,
      });

      // Update for next loop
      lastArrivalTime = predictedTime.getTime();

      // Set progress bar info
      if (i === lastArrivalIndex + 1) {
        nextStationForProgress = route.stations.find(s => s.stationId === currentStation.stationId)?.stationName || 'Unknown';
        predictedEndTimeForProgress = predictedTime.getTime();
      }
    }

    setPredictions(newPredictions);

    // Set info for the progress bar
    if (nextStationForProgress && predictedEndTimeForProgress && !status.lap_completed) {
      setCurrentTravelInfo({
        from: currentStationName,
        to: nextStationForProgress,
        startTime: status.arrivals.length > 0 ? new Date(status.arrivals[lastArrivalIndex].arrivedAt).getTime() : Date.now(),
        endTime: predictedEndTimeForProgress,
      });

      // Check for lateness
      const lateTime = predictedEndTimeForProgress + FIVE_MINUTES;
      if (Date.now() > lateTime) {
        setWarning("This train appears to be running late. Predictions may be inaccurate.");
      }

    } else {
      setCurrentTravelInfo(null);
    }

  }, [train, route, status, history]);

  return { predictions, currentTravelInfo, warning, isLoading: isLoadingHistory };
}
