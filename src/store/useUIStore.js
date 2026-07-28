import { create } from 'zustand';
import { useColorScheme } from 'react-native';

const useUIStore = create((set, get) => ({
  // --- Theme ---
  themeMode: 'system', // 'light' | 'dark' | 'system'
  setThemeMode: (mode) => set({ themeMode: mode }),

  // --- Modals ---
  activeModal: null,       // null | 'createAppointment' | 'appointmentDetail' | 'addPatient'
  modalData: null,         // payload for the active modal
  openModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // --- Sidebar ---
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // --- Loading ---
  loading: false,
  setLoading: (v) => set({ loading: v }),

  // --- Calendar UI state ---
  calendarView: 'day',      // 'day' | 'week' | 'month'
  setCalendarView: (v) => set({ calendarView: v }),

  activeStatusFilters: [],  // [] = show all
  toggleStatusFilter: (status) =>
    set((s) => {
      const f = s.activeStatusFilters;
      return {
        activeStatusFilters: f.includes(status)
          ? f.filter((x) => x !== status)
          : [...f, status],
      };
    }),
  clearStatusFilters: () => set({ activeStatusFilters: [] }),

  activeDoctorFilter: null, // doctorId or null
  setDoctorFilter: (id) => set({ activeDoctorFilter: id }),
}));

export default useUIStore;
