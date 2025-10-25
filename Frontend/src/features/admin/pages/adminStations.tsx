import AdminStationModal from "@/components/addStationModal";
import { ButtonPrimary } from "@/components/button";
import StationCart from "@/components/adminStationCart";
// import NotFoundPage from "@components/notFoundPage"
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
				<input type="text" />
			</div>
			{isModalOpen && (
				<AdminStationModal operation={operation} editIndex={stationCartIndex} />
			)}
			<div className="train-list-container flex flex-col">
				{stationList.map((station, index) => (
					<StationCart
						key={index}
            index={index}
						stationName={station.stationName}
						stationLocation={station.stationLocation}
						stationLocationURL={station.stationLocationURL}
						onEdit={() => stationEditModalOpen(index)}
						onDelete={() => deleteStationData(index)}
					/>
				))}
			</div>
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
