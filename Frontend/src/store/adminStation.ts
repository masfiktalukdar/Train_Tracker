import { create } from "zustand";
import {persist} from "zustand/middleware"

// Admin Station Modal Handle
type ModalStore = {
  isModalOpen: boolean,
  openModal: () => void,
  closeModal: ()=> void
}

export const useAdminStationModalToogle = create<ModalStore>((set)=> ({
  isModalOpen: false,
  openModal: () => set(()=> ({isModalOpen: true})),
  closeModal: () => set(()=> ({isModalOpen: false}))
}))

// Admin Station Data List Handle

type Station = {
	stationName: string;
	stationLocation: string;
	stationLocationURL: string;
};

type ModalDataStore = {
  stationList : Station[],
  setStationData: (station: Station) => void,
  updateStationData: (index: number, updated: Station) => void,
  deleteStationData: (index: number) => void
}

export const useAdminStationData = create<ModalDataStore>()(
	persist(
		(set) => ({
			stationList: [],
			setStationData: (station) =>
				set((state) => ({
					stationList: [...state.stationList, station],
				})),
			updateStationData: (index, updated) =>
				set((state) => {
					const newList = [...state.stationList];
					newList[index] = updated;
					return { stationList: newList };
				}),
			deleteStationData: (index) =>
				set((state) => ({
					stationList: state.stationList.filter((_, i) => i !== index),
				})),
		}),
		{ name: "admin-station-state-storage" }
	)
);