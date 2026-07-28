import { create } from 'zustand';
import { patients as seed } from '../data/mockData';
import { searchPatients, nextPatientId } from '../utils/searchUtils';

const usePatientStore = create((set, get) => ({
  patients: seed,

  /** Add new patient, returns the new patient object */
  addPatient: (data) => {
    const newPatient = {
      ...data,
      id: nextPatientId(get().patients),
      parentDetails: data.parentDetails || [],
      therapistDetails: data.therapistDetails || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ patients: [newPatient, ...s.patients] }));
    return newPatient;
  },

  /** Update patient fields */
  updatePatient: (id, updates) => {
    set((s) => ({
      patients: s.patients.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  // --- Selectors ---
  byId: (id) => get().patients.find((p) => p.id === id),

  /** Regex search by name / id / mobile (debounce in UI) */
  search: (query) => searchPatients(get().patients, query),

  count: () => get().patients.length,
}));

export default usePatientStore;
