import AddStationModal from "@/components/addStationModal";
import { ButtonPrimary } from "@/components/button";
import Footer from "@/components/footer";
import { useAdminStationModalToogle } from "@/store/adminStation";



export default function AdminStations() {
  const {isModalOpen, openModal} = useAdminStationModalToogle();
  

	return (
		<div className="w-full flex-1 min-h-full bg-primary-100 flex flex-col">
			{/* Header add station and search section */}
			<div className="flex gap-4 ml-auto mt-5 px-6">
				<ButtonPrimary onClick={openModal}>Add new station</ButtonPrimary>
				<input type="text" />
			</div>
      <div className="px-6">
        {isModalOpen && <AddStationModal/>}
      </div>
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
