import { create } from "zustand";

// This store is perfect. It controls the UI state of the modal.
type ModalStore = {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

export const useAdminStationModalToogle = create<ModalStore>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));

// This store is perfect. It controls which cart's menu is open.
type MenuStore = {
  openMenuIndex: number | null;
  setOpenMenuIndex: (idx: number | null) => void;
  toggleMenuIndex: (idx: number) => void;
};

export const useMenuToogle = create<MenuStore>((set) => ({
  openMenuIndex: null,
  setOpenMenuIndex: (index) => set({ openMenuIndex: index }),
  toggleMenuIndex: (index) =>
    set((state) => ({
      openMenuIndex: state.openMenuIndex === index ? null : index,
    })),
}));

type operationType = {
  operation: "add" | "update";
  setOperationAdd: () => void;
  setOperationUpdate: () => void;
};

export const useAdminStationModalOperation = create<operationType>((set) => ({
  operation: "add",
  setOperationAdd: () => set({ operation: "add" }),
  setOperationUpdate: () => set({ operation: "update" }),
}));
