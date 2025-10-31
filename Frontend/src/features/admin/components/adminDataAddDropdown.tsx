import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Station } from "@/store/adminStationStore";

type AvailableData = Station;

type AdminDropdown = {
	onSelect: (
		station: AvailableData,
		insertedAfterIndex: number
	) => void;
	onClose: () => void;
	availableData: AvailableData[];
	insertedAfterIndex: number;
};

export default function AdminDataAddDropdown({
	onSelect,
	onClose,
	availableData,
	insertedAfterIndex,
}: AdminDropdown) {
	const [filter, setFilter] = useState("");

	const filteredData = useMemo(() => {
		return availableData.filter((s) => {
			const stationFirstName = s.stationName.split(" ")[0].toLocaleLowerCase();
			return stationFirstName.includes(filter.toLocaleLowerCase());
		});
	}, [availableData, filter]);

	const handleSelect = (data: AvailableData) => {
		onSelect(data, insertedAfterIndex);
	};

	return (
		<div
			className="absolute z-50 p-4 bg-white rounded-lg shadow-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border w-80"
			onMouseDown={(e) => e.stopPropagation()}
			onClick={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<div className="flex justify-between items-center mb-2">
				<h3 className="text-lg font-semibold text-gray-800">Add Station</h3>
				<button
					onClick={onClose}
					className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
				>
					<X size={20} />
				</button>
			</div>
			<input
				type="text"
				placeholder="Search station..."
				className="w-full p-2 border rounded-md mb-2 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
			/>
			<div className="max-h-60 overflow-y-auto">
				{filteredData.length > 0 ? (
					filteredData.map((station) => (
						<div
							key={station.stationId}
							className="p-2 hover:bg-blue-100 rounded-md cursor-pointer text-gray-700"
							onClick={() => handleSelect(station)}
						>
							{station.stationName}
						</div>
					))
				) : (
					<p className="text-gray-500 p-2">No available stations found.</p>
				)}
			</div>
		</div>
	);
}
