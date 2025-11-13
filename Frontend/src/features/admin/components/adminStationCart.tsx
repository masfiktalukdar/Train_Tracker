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
			<div className="flex items-center gap-3 sm:gap-4">
				{/* Left: Logo - Smaller on mobile */}
				<div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
					<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
				</div>

				<div className="flex-1 min-w-0">
					{/* Mobile Layout: Stacked */}
					<div className="flex flex-col sm:hidden gap-1">
						<div className="flex justify-between items-start">
							<span className="font-semibold text-sm text-primary-950 truncate pr-2">
								{stationName}
							</span>
							{/* Menu button is kept outside this flex container for consistent positioning, but we need space */}
						</div>
						<span className="text-xs text-gray-600 truncate">
							{stationLocation}
						</span>
						<a
							href={stationLocationURL}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-500 text-xs hover:underline truncate inline-block max-w-full"
						>
							Open in map
						</a>
					</div>

					{/* Desktop/Tablet Layout: Grid - Hidden on small screens */}
					<div className="hidden sm:grid sm:grid-cols-3 min-w-0 px-2 gap-4 items-center">
						<div className="truncate">
							<span className="font-semibold text-base text-primary-950">
								{stationName}
							</span>
						</div>

						{/* Column 2: Location */}
						<div className="text-gray-600 justify-self-start md:justify-self-center truncate w-full text-left md:text-center">
							<span className="text-sm md:text-base truncate block">
								{stationLocation}
							</span>
						</div>

						{/* Column 3: URL (right aligned inside its column) */}
						<div className="text-right truncate">
							<a
								href={stationLocationURL}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-500 text-sm md:text-base hover:underline truncate inline-block max-w-full"
							>
								Open in map
							</a>
						</div>
					</div>
				</div>

				{/* Right: Menu (fixed) */}
				<div className="relative flex-shrink-0 self-start sm:self-center mt-1 sm:mt-0">
					<button
						onClick={(e) => {
							e.stopPropagation(); 
							toggleMenuIndex(index); 
						}}
						className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
						aria-expanded={isOpen}
						aria-label="More options"
					>
						<MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
					</button>

					{isOpen && (
						<div
							className="absolute right-0 mt-2 w-32 sm:w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => {
									if (onEdit) onEdit();
									toggleMenuIndex(index); 
								}}
								className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
							>
								Edit
							</button>
							<button
								onClick={() => {
									if (onDelete) onDelete();
									toggleMenuIndex(index); 
								}}
								className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
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
