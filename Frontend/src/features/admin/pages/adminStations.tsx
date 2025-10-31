import AdminStationModal from "@/features/admin/components/addStationModal";
import { ButtonPrimary } from "@/components/button";
import StationCart from "@/features/admin/components/adminStationCart";
import useAdminSearch from "@/hooks/useAdminSearch";
import NotFoundPage from "@/components/notFoundPage";
import Footer from "@/components/footer";
import {
	useAdminStationModalToogle,
	useAdminStationData,
	useAdminStationModalOperation,
} from "@/store/adminStationStore";
import { useState } from "react";

export default function AdminStations() {
	const { isModalOpen, openModal } = useAdminStationModalToogle();
	const { stationList, deleteStationData } = useAdminStationData();
	const { operation, setOperationAdd, setOperationUpdate } =
		useAdminStationModalOperation();

	const { query, setQuery, filtered, isEmpty } = useAdminSearch(stationList, [
		"stationLocation",
		"stationName",
	]);

	const [stationCartIndex, setStationCartIndex] = useState<number | null>(null);

	const stationEditModalOpen = function (index: number) {
		openModal();
		setOperationUpdate();
		setStationCartIndex(index);
	};

	const stationAddModalOpener = function () {
		openModal();
		setOperationAdd();
	};

	return (
		<div className="w-full flex-1 min-h-full bg-primary-100 flex flex-col">
			{/* Header add station and search section */}
			<div className="flex gap-4 ml-auto mt-5 mx-6 mb-6">
				<ButtonPrimary onClick={stationAddModalOpener}>
					Add new station
				</ButtonPrimary>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search stations..."
					className="w-60 max-w-sm px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition placeholder:text-gray-400 text-sm bg-white"
				/>
			</div>
			{isModalOpen && (
				<AdminStationModal operation={operation} editIndex={stationCartIndex} />
			)}
			<div className="train-list-container flex flex-col flex-1 mb-6">
				{isEmpty ? (
					<NotFoundPage />
				) : (
					filtered.map((station, index) => (
						<StationCart
							key={index}
							index={index}
							stationName={station.stationName}
							stationLocation={station.stationLocation}
							stationLocationURL={station.stationLocationURL}
							onEdit={() => stationEditModalOpen(index)}
							onDelete={() => deleteStationData(index)}
						/>
					))
				)}
			</div>
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
