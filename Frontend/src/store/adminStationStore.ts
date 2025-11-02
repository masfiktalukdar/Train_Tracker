import { create } from "zustand";

// --- KEEP THIS ---
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

// --- KEEP THIS ---
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

// --- REMOVE THIS ---
// The 'stationList' is server state. It comes from your database.
// TanStack Query will manage this data.
// We will DELETE the `useAdminStationData` store.
/*
export const useAdminStationData = create<ModalDataStore>()(
  persist(
    (set) => ({
      stationList: [],
      setStationData: ...
      updateStationData: ...
      deleteStationData: ...
    }),
    { name: "admin-station-state-storage" }
  )
);
*/

// --- KEEP THIS ---
// This is a great piece of UI state. It tells the modal
// what "mode" it should be in (add or update).
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
