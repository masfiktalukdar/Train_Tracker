import { useTrainStatusStore } from "@/store/adminLiveTrainStatusStore";
import { useAdminStationRoutesData, type Route, type Train } from "@/store/adminRoutesStore";
import type { Station } from "@/store/adminStationStore";
import { ArrowRight, CheckCircle, CornerDownRight, Flag, TrainFront, X } from "lucide-react";
import React, { useMemo } from "react";

type TrainJourneyModalProps = {
	train: Train;
	onClose: () => void;
};


// *** FIXED *** (Issue 1: Only show train's actual stoppages)
// REVISED Helper: Gets the FULL ROUND-TRIP journey *for the train's stoppages only*
function getFullRoundTripJourney(route: Route, train: Train) {
  const routeStations = route.stations;
  if (!routeStations || routeStations.length === 0) return [];

  // Create a map of the train's *actual* stoppages
  const stoppageMap = new Map(train.stoppages.map(s => [s.stationId, s]));

  // 1. Filter route stations to ONLY include actual stoppages for this train
  const actualStoppagesOnRoute = routeStations.filter(station =>
    stoppageMap.has(station.stationId)
  );

  if (actualStoppagesOnRoute.length === 0) return [];

  // 2. Create Leg 1 (A -> D) based on direction
  const firstLegStations = train.direction === 'up'
    ? [...actualStoppagesOnRoute]
    : [...actualStoppagesOnRoute].reverse();

  // 3. Create Leg 2 (D -> A, skipping the first D)
  const secondLegStations = [...firstLegStations].reverse().slice(1);

  // 4. Full path: (A -> D) + (C -> A)
  const fullJourneyPath = [...firstLegStations, ...secondLegStations];

  // *** CHANGED *** (Issue: Add return lap time)
  // 5. Map to final format
  return fullJourneyPath.map((station, index) => {
    const stoppageData = stoppageMap.get(station.stationId)!; // We know it exists

    const isFirstLeg = index < firstLegStations.length;
    const trainsPrimaryDirection = train.direction; // 'up' or 'down'

    let defaultTime;
    if (isFirstLeg) {
      // This is the primary leg
      defaultTime = (trainsPrimaryDirection === 'up')
        ? stoppageData.upArrivalTime
        : stoppageData.downArrivalTime;
    } else {
      // This is the return leg
      defaultTime = (trainsPrimaryDirection === 'up')
        ? stoppageData.downArrivalTime // Primary was 'up', so return is 'down'
        : stoppageData.upArrivalTime; // Primary was 'down', so return is 'up'
    }

    return {
      ...station, // stationId, stationName, etc.
      journeyIndex: index, // Index within this *stoppage* journey
      isStoppage: true, // It's always a stoppage now
      defaultTime: defaultTime, // Get the *correct* time
    };
  });
}


export default function TrainJourneyModal({ train, onClose }:TrainJourneyModalProps) {
  const { routes } = useAdminStationRoutesData();
  const { getTodaysStatus, markStationAsArrived, undoArrival, completeLap } = useTrainStatusStore();

  const route = routes[train.routeId];

  // *** FIXED *** (Issue 2: Calculate turnaround point correctly)
  // We need to know the length of the *first leg* of stoppages
  const firstLegLength = useMemo(() => {
    const stoppageMap = new Map(train.stoppages.map(s => [s.stationId, s]));
    const actualStoppagesOnRoute = route.stations.filter(station =>
      stoppageMap.has(station.stationId)
    );
    return actualStoppagesOnRoute.length;
  }, [route, train]);

  // Get the journey (now only stoppages)
  const fullJourney = useMemo(() => getFullRoundTripJourney(route, train), [route, train]);

  // Get the status for *today*
  const todaysStatus = getTodaysStatus(train.id);
  const { lapCompleted } = todaysStatus;

  // *** FIXED *** (Issue 3: Can't complete lap)
  // The last completed index is simply the number of arrivals minus 1.
  // This is robust for round trips.
  const lastCompletedIndex = todaysStatus.arrivals.length - 1;


  const handleStationClick = (station: Station & { journeyIndex: number, defaultTime: string }) => {
    if (lapCompleted) return; // Don't allow clicks if lap is done

    const clickedIndex = station.journeyIndex;

    if (clickedIndex <= lastCompletedIndex) {
      // This is an "undo" click
      // We roll back to the station *before* the one clicked.
      // Clicking the first station (index 0) rolls back to the start (null).
      const newLastStation = clickedIndex > 0 ? fullJourney[clickedIndex - 1] : null;
      const newLastStationId = newLastStation ? newLastStation.stationId : null;

      // Call the (now fixed) undoArrival function
      undoArrival(train.id, newLastStationId);

    } else if (clickedIndex === lastCompletedIndex + 1) {
      // This is the next station, mark it as arrived
      markStationAsArrived(train.id, station);
    }
    // Clicks on stations further ahead are ignored
  };

  const handleCompleteLap = () => {
    // This logic is now correct because lastCompletedIndex is reliable
    if (lastCompletedIndex === fullJourney.length - 1) {
      completeLap(train.id);
    } else {
      console.warn("Please mark all stations as arrived before completing the lap.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* --- Header --- */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{train.name} ({train.code}) - Daily Journey</h2>
            <p className="text-sm text-gray-600">
              {lapCompleted
                ? "This train's lap for today is complete."
                : "Click the *next* stoppage to mark arrival, or a *completed* one to undo."
              }
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* --- Journey Body --- */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* *** FIXED *** (Issue 2: Overlapping layout) */}
          <div className="flex flex-wrap items-center gap-2">
            {fullJourney.map((station, index) => {
              const isCompleted = index <= lastCompletedIndex;
              // The next station to arrive at
              const isCurrent = index === lastCompletedIndex + 1;

              // *** FIXED *** (Issue 2: Correct turnaround index)
              const isTurnaround = index === firstLegLength - 1;

              // Determine if clickable
              // Clickable if it's the next station OR a completed one
              const isClickable = !lapCompleted && (isCompleted || isCurrent);

              const title = isClickable
                ? (isCompleted ? `Click to undo (go back to ${fullJourney[index-1]?.stationName || 'start'})` : "Click to mark as arrived")
                : (lapCompleted ? "Lap complete" : "Cannot arrive here yet");

              return (
                <React.Fragment key={`${station.stationId}-${index}`}>
                  {/* Station Block */}
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${
                      isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-white'
                    } ${
                      isCurrent && !lapCompleted ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => isClickable && handleStationClick(station)}
                    title={title}
                  >
                    {/* Icon */}
                    <div>
                      {isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                       isCurrent && !lapCompleted ? <TrainFront className="w-5 h-5 text-blue-500" /> :
                       // Simple dot for pending stations
                       <div className="w-5 h-5 flex items-center justify-center">
                         <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                       </div>
                      }
                    </div>
                    {/* Station Info */}
                    <div className="flex-shrink min-w-0"> {/* Allow shrinking, prevent overlap */}
                      <span className="block font-bold truncate"> {/* Truncate long names */}
                        {station.stationName}
                      </span>
                      {/* *** CHANGED *** (Issue: Add return lap time) */}
                      <span className="text-xs text-blue-600 font-mono">
                        ({station.defaultTime})
                      </span>
                    </div>
                  </div>

                  {/* Arrow or Turnaround Block */}
                  {isTurnaround ? (
                    <div className="flex items-center p-3 text-red-600 font-semibold">
                      <CornerDownRight className="w-5 h-5 mr-2" />
                      TURNAROUND
                    </div>
                  ) : index < fullJourney.length - 1 ? (
                    <div className="flex items-center justify-center p-2 text-gray-300">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  ) : null}

                </React.Fragment>
              );
            })}
          </div>

          {/* --- Lap Completion Button --- */}
          {/* This logic is now correct */}
          {lastCompletedIndex === fullJourney.length - 1 && !lapCompleted && (
             <div className="pt-4 text-center">
                <button
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                  onClick={handleCompleteLap}
                >
                  <Flag className="w-5 h-5" />
                  Mark Daily Lap as Complete
                </button>
             </div>
          )}
          {lapCompleted && (
             <div className="pt-4 text-center">
                <p className="px-6 py-3 bg-green-100 text-green-800 font-semibold rounded-lg flex items-center gap-2 justify-center">
                  <CheckCircle className="w-5 h-5" />
                  Daily Lap Completed
                </p>
             </div>
          )}

          {/* --- Arrival Log --- */}
          {todaysStatus.arrivals.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Today's Arrival Log</h4>
              <div className="max-h-32 overflow-y-auto bg-gray-50 border rounded-md p-2 space-y-1">
                {todaysStatus.arrivals.map(arrival => (
                  <p key={arrival.id} className="text-xs text-gray-600 font-mono">
                    <span className="font-bold text-black">{arrival.stationName}</span>
                    {": "}
                    {new Date(arrival.arrivedAt).toLocaleTimeString()}
                  </p>
                )).reverse()}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
