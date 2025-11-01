import { useTrainStatusStore } from "@/store/adminLiveTrainStatusStore";
import { useAdminStationRoutesData, type Route, type Train } from "@/store/adminRoutesStore";
import { ArrowRight, CheckCircle, ChevronRight, CornerDownRight, TrainFront, X } from "lucide-react";
import React, { useMemo } from "react";

function getFullJourney(route: Route, train: Train) {
	const routeStations = route.stations;
	if (routeStations.length === 0) return [];

	const stoppageMap = new Map(
		train.stoppages.map((s) => [s.stationId, s.arrivalTime])
	);

	// Leg 1
	const firstLegStations =
		train.direction === "up"
			? [...routeStations]
			: [...routeStations].reverse();

	// Leg 2 (reverse of leg 1, skipping the first station which is the last of leg 1)
	const secondLegStations = [...firstLegStations].reverse().slice(1);

	const fullJourneyPath = [...firstLegStations, ...secondLegStations];

	return fullJourneyPath.map((station, index) => ({
		...station,
		journeyIndex: index,
		isStoppage: stoppageMap.has(station.stationId),
		defaultTime: stoppageMap.get(station.stationId) || null,
	}));
}


export default function TrainJourneyModal({ train, onClose }) {
	const { routes } = useAdminStationRoutesData();
	const { statuses, markStationAsCurrent, startOrResetJourney } =
		useTrainStatusStore();

	const route = routes[train.routeId];
	const trainStatus = statuses[train.id];

	// Generate the full journey path
	const fullJourney = useMemo(
		() => getFullJourney(route, train),
		[route, train]
	);

	// Ensure the train has a status when modal opens
	React.useEffect(() => {
		if (!trainStatus) {
			startOrResetJourney(train.id);
		}
	}, [train.id, trainStatus, startOrResetJourney]);

	const currentJourneyIndex = trainStatus?.currentJourneyIndex || 0;

	return (
		<div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
				{/* --- Header --- */}
				<div className="p-4 border-b flex justify-between items-center">
					<div>
						<h2 className="text-xl font-bold">
							{train.name} ({train.code}) - Journey
						</h2>
						<p className="text-sm text-gray-600">
							Click a station to mark it as the train's current location.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-200"
					>
						<X className="w-6 h-6 text-gray-600" />
					</button>
				</div>

				{/* --- Journey Body --- */}
				<div className="p-6 space-y-4 overflow-y-auto">
					<div className="flex flex-wrap gap-2">
						{fullJourney.map((station, index) => {
							const isCompleted = index < currentJourneyIndex;
							const isCurrent = index === currentJourneyIndex;

							let icon = <ChevronRight className="w-4 h-4 text-gray-400" />;
							if (isCompleted)
								icon = <CheckCircle className="w-4 h-4 text-green-500" />;
							if (isCurrent)
								icon = <TrainFront className="w-4 h-4 text-blue-500" />;

							// Add a "turn around" indicator
							const isTurnaround = index === route.stations.length - 1;

							return (
								<React.Fragment key={index}>
									<div
										className={`p-3 rounded-lg border cursor-pointer ${
											isCompleted ? "bg-gray-100 text-gray-500" : "bg-white"
										} ${
											isCurrent
												? "border-blue-500 ring-2 ring-blue-500"
												: "border-gray-300"
										} ${
											station.isStoppage
												? "font-bold"
												: "font-normal text-gray-600"
										}`}
										onClick={() => markStationAsCurrent(train.id, index)}
									>
										<div className="flex items-center gap-2">
											{icon}
											<span>{station.stationName}</span>
											{station.isStoppage && (
												<span className="text-xs text-blue-600 font-mono">
													({station.defaultTime})
												</span>
											)}
										</div>
									</div>
									{isTurnaround && (
										<div className="flex items-center p-3 text-red-600 font-semibold">
											<CornerDownRight className="w-5 h-5 mr-2" />
											TURNAROUND
										</div>
									)}
									{index < fullJourney.length - 1 && !isTurnaround && (
										<div className="flex items-center justify-center p-3">
											<ArrowRight className="w-5 h-5 text-gray-300" />
										</div>
									)}
								</React.Fragment>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
