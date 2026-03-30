import { create } from "zustand";

interface AppState {
  isNewBookingModalOpen: boolean;
  isDarkMode: boolean;
  openNewBookingModal: () => void;
  closeNewBookingModal: () => void;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  isNewBookingModalOpen: false,
  isDarkMode: false,
  openNewBookingModal: () => set({ isNewBookingModalOpen: true }),
  closeNewBookingModal: () => set({ isNewBookingModalOpen: false }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
