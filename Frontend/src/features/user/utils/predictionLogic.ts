import type { TrainHistoryRecord } from "@features/user/api/historyApi";
import type { Station, TrainStoppage } from "@/types/dataModels";

const AVG_TRAVEL_TIME = "AVG_TRAVEL_TIME";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

type TravelTimeCache = {
  [key: string]: {
    average: number;
    timestamp: number;
  };
};

/**
 * Calculates the average travel time in milliseconds between two stations from 7-day history.
 * Implements caching in localStorage to avoid re-calculating on every load.
 */
export function getAverageTravelTime(
  history: TrainHistoryRecord[],
  stationA_id: string,
  stationB_id: string
): number | null {
  const cacheKey = `${AVG_TRAVEL_TIME}_${stationA_id}_${stationB_id}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data: TravelTimeCache[string] = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_TTL) {
        return data.average;
      }
    }
  } catch (e) {
    console.warn("Failed to read from cache", e);
  }

  const travelTimes: number[] = [];

  for (const record of history) {
    const arrivals = record.arrivals || [];
    let timeA: number | null = null;
    let timeB: number | null = null;

    // Find the arrival times for A and B in this day's record
    for (const arrival of arrivals) {
      if (arrival.stationId === stationA_id) {
        timeA = new Date(arrival.arrivedAt).getTime();
      }
      if (arrival.stationId === stationB_id) {
        timeB = new Date(arrival.arrivedAt).getTime();
      }
      if (timeA && timeB) break;
    }

    // If we found both arrivals and B is after A, record the duration
    if (timeA && timeB && timeB > timeA) {
      const duration = timeB - timeA;
      // Sanity check: ignore travel times over 12 hours
      if (duration < 1000 * 60 * 60 * 12) {
        travelTimes.push(duration);
      }
    }
  }

  if (travelTimes.length === 0) {
    return null; // Not enough data
  }

  const average = travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length;

  // Save to cache
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ average, timestamp: Date.now() })
    );
  } catch (e) {
    console.warn("Failed to write to cache", e);
  }

  return average;
}

/**
 * Gets the admin-defined default travel time between two stations as a fallback.
 * This is based on the default schedule.
 */
export function getDefaultTravelTime(
  stoppages: TrainStoppage[],
  stationA_id: string,
  stationB_id: string
): number | null {
  const stoppageA = stoppages.find((s) => s.stationId === stationA_id);
  const stoppageB = stoppages.find((s) => s.stationId === stationB_id);

  if (!stoppageA || !stoppageB) return null;

  // This logic assumes we are checking *both* directions and finding a valid time
  // A more robust solution would know the leg of the journey

  let timeA = parseTimeToToday(stoppageA.upArrivalTime);
  let timeB = parseTimeToToday(stoppageB.upArrivalTime);
  if (timeA > 0 && timeB > 0 && timeB > timeA) return timeB - timeA;

  timeA = parseTimeToToday(stoppageA.downArrivalTime);
  timeB = parseTimeToToday(stoppageB.downArrivalTime);
  if (timeA > 0 && timeB > 0 && timeB > timeA) return timeB - timeA;

  // Handle midnight wrap-around (simplified)
  timeA = parseTimeToToday(stoppageA.upArrivalTime);
  timeB = parseTimeToToday(stoppageB.upArrivalTime, true); // Add a day
  if (timeA > 0 && timeB > 0 && timeB > timeA) return timeB - timeA;

  timeA = parseTimeToToday(stoppageA.downArrivalTime);
  timeB = parseTimeToToday(stoppageB.downArrivalTime, true); // Add a day
  if (timeA > 0 && timeB > 0 && timeB > timeA) return timeB - timeA;

  return null;
}

/**
 * Helper to parse "HH:mm" string to a Date object for today.
 */
export function parseTimeToToday(time: string, addDay = false): number {
  if (!time || !time.includes(":")) {
    return 0; // Return 0 or handle as an error
  }
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return 0;
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  if (addDay) {
    date.setDate(date.getDate() + 1);
  }
  return date.getTime();
}

/**
 * Helper to get the full round-trip journey path.
 */
export function getFullJourney(
  routeStations: Station[],
  trainStoppages: TrainStoppage[],
  direction: "up" | "down"
): Station[] {
  const stoppageMap = new Map(trainStoppages.map((s) => [s.stationId, s]));
  const actualStoppagesOnRoute = routeStations.filter((station) =>
    stoppageMap.has(station.stationId)
  );

  if (actualStoppagesOnRoute.length === 0) return [];

  const firstLegStations =
    direction === "up"
      ? [...actualStoppagesOnRoute]
      : [...actualStoppagesOnRoute].reverse();

  // The second leg is the reverse, *excluding* the start (which is the end of the first leg)
  const secondLegStations = [...firstLegStations].reverse().slice(1);

  return [...firstLegStations, ...secondLegStations];
}