import { TrainFront, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ApiTrain } from "@/features/admin/api/trainsApi";
import type { ApiRoute } from "@/features/admin/api/routesApi";

type TrainCardProps = {
	train: ApiTrain;
	route: ApiRoute | undefined;
	onEdit: (train: ApiTrain) => void;
	onDelete: (trainId: number) => void;
	onViewJourney: (train: ApiTrain) => void;
};

export default function TrainCard({
	train,
	route,
	onEdit,
	onDelete,
	onViewJourney,
}: TrainCardProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const routeName = route?.name || "Unknown Route";

	return (
		<div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 ease-in-out">
			<div className="p-3 sm:p-4 flex items-center justify-between gap-3">
				{/* Left Side: Icon & Info */}
				<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
					{/* Icon */}
					<div
						className={`flex-shrink-0 p-2 sm:p-3 rounded-full ${
							train.direction === "up" ? "bg-green-100" : "bg-red-100"
						}`}
					>
						<TrainFront
							className={`w-5 h-5 sm:w-6 sm:h-6 ${
								train.direction === "up" ? "text-green-600" : "text-red-600"
							}`}
						/>
					</div>

					{/* Text Info */}
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
								{train.name}
							</h3>
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
									train.direction === "up"
										? "bg-green-100 text-green-800"
										: "bg-red-100 text-red-800"
								}`}
							>
								{train.direction.toUpperCase()}
							</span>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 mt-0.5">
							<span className="text-xs sm:text-sm text-gray-500 font-mono truncate">
								Code: {train.code}
							</span>
							{/* Separator hidden on mobile */}
							<span className="hidden sm:inline text-gray-300">•</span>
							<span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
								{routeName}
							</span>
						</div>
					</div>
				</div>

				{/* Right Side: Actions */}
				<div className="flex items-center gap-2 flex-shrink-0">
					<p className="hidden sm:block text-xs text-gray-500 text-right mr-2">
						{train.stoppages.length} stops
					</p>

					<button
						className="hidden md:inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							onViewJourney(train);
						}}
					>
						View Journey
					</button>

					{/* Mobile View Journey Icon Button */}
					<button
						className="md:hidden p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							onViewJourney(train);
						}}
						aria-label="View Journey"
					>
						<TrainFront className="w-4 h-4" />
					</button>

					<div className="relative">
						<button
							className={`p-2 rounded-full transition-colors ${
								menuOpen
									? "bg-gray-100 text-gray-900"
									: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							}`}
							onClick={(e) => {
								e.stopPropagation();
								setMenuOpen(!menuOpen);
							}}
							aria-label="More options"
							aria-expanded={menuOpen}
						>
							<MoreVertical className="w-5 h-5" />
						</button>

						{menuOpen && (
							<>
								<div
									className="fixed inset-0 z-10 cursor-default"
									onClick={() => setMenuOpen(false)}
								/>
								<div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
									{/* View Journey in menu for small screens too as a backup */}
									<button
										className="md:hidden w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
										onClick={(e) => {
											e.stopPropagation();
											onViewJourney(train);
											setMenuOpen(false);
										}}
									>
										<TrainFront className="w-4 h-4" /> View Journey
									</button>
									<button
										className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
										onClick={(e) => {
											e.stopPropagation();
											onEdit(train);
											setMenuOpen(false);
										}}
									>
										<Edit className="w-4 h-4" /> Edit Train
									</button>
									<button
										className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
										onClick={(e) => {
											e.stopPropagation();
											onDelete(train.id);
											setMenuOpen(false);
										}}
									>
										<Trash2 className="w-4 h-4" /> Delete Train
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
