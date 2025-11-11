import { Link } from "react-router-dom";
import { Train, ChevronRight, CheckCircle, Clock, MapPin } from "lucide-react";
import type { ApiTrain } from "@/features/admin/api/trainsApi";
import type { ApiRoute } from "@/features/admin/api/routesApi";
import type { DailyTrainStatus } from "@/features/admin/api/statusApi";
import { getFullJourney } from "../utils/predictionLogic";
import { format24HourTime } from "../utils/formatTime";
import type { Station } from "@/types/dataModels";

type TrainCardProps = {
	train: ApiTrain;
	route?: ApiRoute;
	status?: DailyTrainStatus | null;
};

// Helper to get the scheduled time for a station from stoppages
function getScheduledTime(
	train: ApiTrain,
	stationId: string | undefined,
	leg: "first" | "second"
) {
	if (!stationId) return null;
	const stoppage = train.stoppages.find((s) => s.stationId === stationId);
	if (!stoppage) return null;

	// Determine leg based on train's primary direction
	if (train.direction === "up") {
		return leg === "first" ? stoppage.upArrivalTime : stoppage.downArrivalTime;
	} else {
		// Train's primary direction is 'down'
		return leg === "first" ? stoppage.downArrivalTime : stoppage.upArrivalTime;
	}
}

export default function TrainCard({ train, route, status }: TrainCardProps) {
	const journey: Station[] = route
		? getFullJourney(route.stations, train.stoppages, train.direction)
		: [];

	// --- NEW LOGIC based on arrivals vs departures ---
	const arrivalsCount = status?.arrivals?.length ?? 0;
	const departuresCount = status?.departures?.length ?? 0; // Use departures
	const lastArrival =
		arrivalsCount > 0 ? status?.arrivals?.[arrivalsCount - 1] : undefined;
	const nextStation = journey[arrivalsCount]; // Next to arrive

	// Calculate first leg length
	const firstLegLength = route
		? route.stations.filter((s) =>
				train.stoppages.some((ts) => ts.stationId === s.stationId)
			).length
		: 0;

	let statusText = "Pending Departure";
	let statusDetail = "Awaiting first departure";
	let StatusIcon = Clock;
	let iconColor = "text-gray-500";
	let bgColor = "bg-gray-100";
	let barColor = "bg-gray-400";

	const firstStation = journey[0];
	const firstStationTime = firstStation
		? getScheduledTime(train, firstStation.stationId, "first")
		: null;
	const formattedFirstTime = format24HourTime(firstStationTime);

	if (!status || arrivalsCount === 0) {
		// PENDING (Not started)
		statusText = "Pending Departure";
		statusDetail = `Will start at ~ ${formattedFirstTime}`;
	} else if (status.lap_completed) {
		// COMPLETED
		statusText = "Journey Completed";
		statusDetail = "This train has finished its route for today.";
		StatusIcon = CheckCircle;
		iconColor = "text-green-600";
		bgColor = "bg-green-100";
		barColor = "bg-green-500";
	} else if (arrivalsCount > departuresCount && lastArrival) {
		// AT STATION (Arrived, not departed)
		const isAtTurnaround =
			lastArrival && firstLegLength > 0 && arrivalsCount === firstLegLength;

		if (isAtTurnaround) {
			statusText = `At ${lastArrival.stationName.split(" ")[0]} (Turnaround)`;
			statusDetail = "Waiting for turnaround...";
			StatusIcon = MapPin;
			iconColor = "text-red-600"; // Use red for turnaround
			bgColor = "bg-red-100";
			barColor = "bg-red-500";
		} else {
			statusText = `At ${lastArrival.stationName.split(" ")[0]}`;
			statusDetail = "Waiting for departure...";
			StatusIcon = MapPin;
			iconColor = "text-yellow-600"; // Use yellow for regular stops
			bgColor = "bg-yellow-100";
			barColor = "bg-yellow-500";
		}
	} else if (arrivalsCount === departuresCount && nextStation && lastArrival) {
		// EN ROUTE (Departed, not yet arrived at next)
		statusText = `En Route to ${nextStation.stationName.split(" ")[0]}`;
		statusDetail = `Departed from ${lastArrival.stationName.split(" ")[0]}`;
		StatusIcon = Train;
		iconColor = "text-blue-600";
		bgColor = "bg-blue-100";
		barColor = "bg-blue-500";
	} else if (arrivalsCount > 0 && !nextStation && lastArrival) {
		// AT FINAL STATION (Arrived at last stop, not yet marked complete)
		statusText = `At ${lastArrival.stationName.split(" ")[0]}`;
		statusDetail = "Final destination reached.";
		StatusIcon = MapPin;
		iconColor = "text-green-600";
		bgColor = "bg-green-100";
		barColor = "bg-green-500";
	}

	return (
		<Link
			to={`/trains/${train.id}`}
			className="flex bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all overflow-hidden"
		>
			<div className={`w-2 ${barColor}`}></div>
			<div className="flex-1 p-4 flex items-center justify-between">
				<div className="flex items-center gap-4 min-w-0">
					<div
						className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${bgColor}`}
					>
						<StatusIcon className={`h-6 w-6 ${iconColor}`} />
					</div>
					<div className="min-w-0">
						<h3 className="text-lg font-bold text-gray-900 truncate">
							{train.name}
						</h3>
						<p className="text-sm text-gray-700 font-medium truncate">
							{statusText}
						</p>
						<p className="text-xs text-gray-500 font-mono truncate">
							{statusDetail}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 text-right flex-shrink-0 ml-2">
					<div className="hidden sm:block">
						<p className="text-xs text-gray-500">Next</p>
						<p className="text-sm font-semibold text-primary-800">
							{nextStation ? nextStation.stationName.split(" ")[0] : "End"}
						</p>
					</div>
					<ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
				</div>
			</div>
		</Link>
	);
}
