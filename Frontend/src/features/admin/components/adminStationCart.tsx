import { useMenuToogle } from "@/store/adminStationStore";
import { MoreVertical, Building2 } from "lucide-react";

type StationCartProp = {
  index: number;
	stationName: string;
	stationLocation: string;
	stationLocationURL: string;
	onEdit?: () => void;
	onDelete?: () => void;
};

export default function StationCart({
  index,
	stationName,
	stationLocation,
	stationLocationURL,
	onEdit,
	onDelete,
}: StationCartProp) {

  const openMenuIndex = useMenuToogle((s) => s.openMenuIndex);
	const toggleMenuIndex = useMenuToogle((s) => s.toggleMenuIndex);
	const isOpen = openMenuIndex === index;

	return (
		<div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 mb-2 hover:shadow-md transition">
			<div className="flex items-center gap-4">
				{/* Left: Logo */}
				<div className="w-12 h-12 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
					<Building2 size={25} />
				</div>

				<div className="flex-1">
					<div className="grid grid-cols-3 min-w-0 px-2">
						<div className="truncate">
							<span className="font-semibold text-base text-primary-950">
								{stationName}
							</span>
						</div>

						{/* Column 2: Location */}
						<div className="text-gray-600 justify-self-center truncate">
							<span className="text-base">{stationLocation}</span>
						</div>

						{/* Column 3: URL (right aligned inside its column) */}
						<div className="text-right">
							<a
								href={stationLocationURL}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-500 text-base hover:underline truncate inline-block max-w-full"
							>
								Open in map
							</a>
						</div>
					</div>
				</div>

				{/* Right: Menu (fixed) */}
				<div className="relative flex-shrink-0">
					<button
						onClick={(e) => {
							e.stopPropagation(); // prevent root click
							toggleMenuIndex(index); // open/close via store
						}}
						className="p-2 rounded-full hover:bg-gray-100"
						aria-expanded={isOpen}
					>
						<MoreVertical size={18} className="text-gray-600" />
					</button>

					{isOpen && (
						<div
							className="absolute right-0 mt-2 w-36 bg-white border rounded-md shadow-lg z-10"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={onEdit}
								className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							>
								Edit
							</button>
							<button
								onClick={onDelete}
								className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
							>
								Delete
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
