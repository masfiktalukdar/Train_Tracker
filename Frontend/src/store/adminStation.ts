import { create } from "zustand";

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