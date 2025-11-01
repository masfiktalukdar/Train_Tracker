import { useAdminStationRoutesData, type Train } from "@/store/adminRoutesStore";
import { Edit, MoreVertical, TrainFront, Trash2 } from "lucide-react";
import { useState } from "react";

type TrainCardProps = {
	train: Train;
	onEdit: (train: Train) => void;
	onDelete: (trainId: string) => void;
	onViewJourney: (train: Train) => void;
};


export default function TrainCard({ train, onEdit, onDelete, onViewJourney }:TrainCardProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const { routes } = useAdminStationRoutesData();
	const routeName = routes[train.routeId]?.name || "Unknown Route";

	return (
		<div className="bg-white rounded-lg shadow-md border">
			<div className="p-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div
						className={`p-3 rounded-full ${train.direction === "up" ? "bg-green-100" : "bg-red-100"}`}
					>
						<TrainFront
							className={`w-6 h-6 ${train.direction === "up" ? "text-green-600" : "text-red-600"}`}
						/>
					</div>
					<div>
						<h3 className="text-xl font-bold text-gray-900">{train.name}</h3>
						<span className="text-sm text-gray-500 font-mono">
							Code: {train.code}
						</span>
					</div>
					<span
						className={`px-3 py-1 rounded-full text-xs font-semibold ${train.direction === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
					>
						{train.direction.toUpperCase()}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<div className="text-right hidden md:block">
						<span className="text-sm font-medium text-gray-800">
							{routeName}
						</span>
						<p className="text-xs text-gray-500">
							{train.stoppages.length} stoppages
						</p>
					</div>
					<button
						className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
						onClick={() => onViewJourney(train)}
					>
						View Journey
					</button>
					<div className="relative">
						<button
							className="p-2 text-gray-500 hover:text-gray-800"
							onClick={() => setMenuOpen(!menuOpen)}
						>
							<MoreVertical className="w-5 h-5" />
						</button>
						{menuOpen && (
							<div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
								<button
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
									onClick={() => {
										onEdit(train);
										setMenuOpen(false);
									}}
								>
									<Edit className="w-4 h-4 mr-2" /> Edit
								</button>
								<button
									className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
									onClick={() => {
										onDelete(train.id);
										setMenuOpen(false);
									}}
								>
									<Trash2 className="w-4 h-4 mr-2" /> Delete
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}