import type { TrainHistoryRecord } from "@features/user/api/historyApi";
import type { Station, TrainStoppage } from "@/types/dataModels";

const AVG_TRAVEL_TIME = "AVG_TRAVEL_TIME";
const CACHE_TTL = 1000 * 60 * 60; 
const FIVE_MINUTES_MS = 1000 * 60 * 5;

type TravelTimeCache = {
  [key: string]: {
    average: number;
    timestamp: number;
  };
};

/**
 * Calculates the average travel time in milliseconds between two stations from 7-day history.
 * UPDATED: Calculates from stationA's DEPARTURE to stationB's ARRIVAL.
 */
export function getAverageTravelTime(
  history: TrainHistoryRecord[],
  stationA_id: string,
  stationB_id: string
): number | null {
  const cacheKey = `${AVG_TRAVEL_TIME}_${stationA_id}_${stationB_id}_V2`; // V2 for new logic

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
    const departures = record.departures || []; 
    let timeA: number | null = null; 
    let timeB: number | null = null; 

    // Find the departure time for A
    for (const departure of departures) {
      if (departure.stationId === stationA_id) {
        timeA = new Date(departure.departedAt).getTime();
        break; 
      }
    }

    // Find the arrival time for B
    for (const arrival of arrivals) {
      if (arrival.stationId === stationB_id) {
        timeB = new Date(arrival.arrivedAt).getTime();
        break; 
      }
    }

    // If we found both and B is after A, record the duration
    if (timeA && timeB && timeB > timeA) {
      const duration = timeB - timeA;
      if (duration < 1000 * 60 * 60 * 12) {
        travelTimes.push(duration);
      }
    }
  }

  if (travelTimes.length === 0) {
    return null; 
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
 * UPDATED: Calculates from stationA's DEPARTURE to stationB's ARRIVAL.
 */
export function getDefaultTravelTime(
  stoppages: TrainStoppage[],
  stationA_id: string,
  stationB_id: string,
  legDirection: "up" | "down",
  isFirstStation: boolean 
): number | null {
  const stoppageA = stoppages.find((s) => s.stationId === stationA_id);
  const stoppageB = stoppages.find((s) => s.stationId === stationB_id);

  if (!stoppageA || !stoppageB) return null;

  const timeStrA =
    legDirection === "up"
      ? stoppageA.upArrivalTime
      : stoppageA.downArrivalTime;
  const timeStrB =
    legDirection === "up"
      ? stoppageB.upArrivalTime
      : stoppageB.downArrivalTime;

  const arrivalTimeA = parseTimeToToday(timeStrA);
  const arrivalTimeB = parseTimeToToday(timeStrB);

  if (arrivalTimeA === 0 || arrivalTimeB === 0) return null;

  // Departure from A is arrival + 5 mins, UNLESS it's the first station
  const departureTimeA = arrivalTimeA + (isFirstStation ? 0 : FIVE_MINUTES_MS);

  // Handle midnight wrap-around for B
  let duration = arrivalTimeB - departureTimeA;
  if (duration < 0) {
    // B is on the next day
    const arrivalTimeBNextDay = parseTimeToToday(timeStrB, true);
    duration = arrivalTimeBNextDay - departureTimeA;
  }

  // Sanity check
  if (duration < 0 || duration > 1000 * 60 * 60 * 12) {
    return null;
  }

  return duration;
}

/**
 * Helper to parse "HH:mm" string to a Date object for today.
 */
export function parseTimeToToday(time: string, addDay = false): number {
  if (!time || !time.includes(":")) {
    return 0; 
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

  // --- ADDED: Handle times like "01:00" when it's "23:00" now ---
  // If the time is more than 6 hours in the *past*, assume it's for *tomorrow*.
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  if (!addDay && new Date().getTime() - date.getTime() > SIX_HOURS_MS) {
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