import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type InterfaceState = {
  hasOnboarded: boolean;
  setHasOnboarded: (status: boolean) => void;
};

export const useInterfaceStore = create<InterfaceState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      setHasOnboarded: (status) => set({ hasOnboarded: status }),
    }),
    {
      name: 'user-interface-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
