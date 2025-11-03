import { Link } from "react-router-dom";
import { Train, ChevronRight, CheckCircle, Clock } from "lucide-react";
import type { ApiTrain } from "@/features/admin/api/trainsApi";
import type { ApiRoute } from "@/features/admin/api/routesApi";
import type { DailyTrainStatus } from "@/features/admin/api/statusApi";

type TrainCardProps = {
	train: ApiTrain;
	route?: ApiRoute;
	status?: DailyTrainStatus | null;
};

export default function TrainCard({ train, route, status }: TrainCardProps) {
	// Find the last station name from the status
	const lastStationName = status?.last_completed_station_id
		? route?.stations.find(
				(s) => s.stationId === status.last_completed_station_id
			)?.stationName
		: "Not Started";

	// Find the next station
	const lastArrivalIndex = status?.arrivals.length
		? status.arrivals.length - 1
		: -1;
	const nextStoppageIndex = lastArrivalIndex + 1;

	// We need to figure out the full journey path to find the *next* station
	// This is simplified logic; the prediction hook will have the full version
	const stoppageMap = new Map(train.stoppages.map((s) => [s.stationId, s]));
	const actualStoppagesOnRoute =
		route?.stations.filter((station) => stoppageMap.has(station.stationId)) ||
		[];

	const firstLegStations =
		train.direction === "up"
			? [...actualStoppagesOnRoute]
			: [...actualStoppagesOnRoute].reverse();

	const journey = [...firstLegStations, ...firstLegStations.reverse().slice(1)];
	const nextStation = journey[nextStoppageIndex];

	let statusText = "Pending";
	let StatusIcon = Clock;
	let iconColor = "text-yellow-600";
	let bgColor = "bg-yellow-100";

	if (status?.lap_completed) {
		statusText = "Lap Completed";
		StatusIcon = CheckCircle;
		iconColor = "text-green-600";
		bgColor = "bg-green-100";
	} else if (nextStation) {
		statusText = `En route to ${nextStation.stationName.split(" ")[0]}`;
		StatusIcon = Train;
		iconColor = "text-blue-600";
		bgColor = "bg-blue-100";
	} else if (lastStationName !== "Not Started") {
		statusText = `At ${lastStationName && lastStationName.split(" ")[0]}`;
		StatusIcon = Train;
		iconColor = "text-blue-600";
		bgColor = "bg-blue-100";
	}

	return (
		<Link
			to={`/trains/${train.id}`}
			className="block bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all"
		>
			<div className="flex items-center justify-between p-5">
				<div className="flex items-center gap-4">
					<div className={`flex-shrink-0 p-3 rounded-full ${bgColor}`}>
						<StatusIcon className={`h-6 w-6 ${iconColor}`} />
					</div>
					<div>
						<h3 className="text-xl font-bold text-gray-900">{train.name}</h3>
						<p className="text-sm text-gray-600 font-medium">{statusText}</p>
					</div>
				</div>
				<ChevronRight className="h-6 w-6 text-gray-400" />
			</div>
		</Link>
	);
}
