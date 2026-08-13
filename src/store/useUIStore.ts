import { create } from 'zustand';
import { UIState, ThemeMode, CalendarView, ModalType } from '../types';

const useUIStore = create<UIState>((set) => ({
  // --- Theme ---
  themeMode: 'system',
  setThemeMode: (mode: ThemeMode) => set({ themeMode: mode }),

  // --- Modals ---
  activeModal: null,
  modalData: null,
  openModal: (modal: ModalType, data: any = null) =>
    set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // --- Sidebar ---
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // --- Loading ---
  loading: false,
  setLoading: (v: boolean) => set({ loading: v }),

  // --- Calendar UI state ---
  calendarView: 'day',
  setCalendarView: (v: CalendarView) => set({ calendarView: v }),

  activeStatusFilters: [],
  toggleStatusFilter: (status: string) =>
    set((s) => {
      const f = s.activeStatusFilters;
      return {
        activeStatusFilters: f.includes(status)
          ? f.filter((x) => x !== status)
          : [...f, status],
      };
    }),
  clearStatusFilters: () => set({ activeStatusFilters: [] }),

  activeDoctorFilter: null,
  setDoctorFilter: (id: string | null) => set({ activeDoctorFilter: id }),

  // --- Center state ---
  activeCenterId: 'CC-001',
  setActiveCenterId: (id: string) => set({ activeCenterId: id }),

  // --- BottomNav Scroll Translate Visibility ---
  navVisible: true,
  setNavVisible: (v: boolean) => set((s) => (s.navVisible === v ? s : { navVisible: v })),
}));

export default useUIStore;
