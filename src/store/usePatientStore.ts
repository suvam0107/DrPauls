import { create } from 'zustand';
import { patientService } from '../api/services/patientService';
import { dataStore } from '../api/dataStore';
import { searchPatients, nextPatientId } from '../utils/searchUtils';
import { Patient } from '../types';

export interface ExtendedPatientState {
  patients: Patient[];
  addPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  incrementRescheduleCount: (id: string) => void;
  byId: (id: string) => Patient | undefined;
  search: (query: string) => Patient[];
  count: () => number;
}

export function calculatePatientPriority(rescheduleCount: number = 0): 'High' | 'Medium' | 'Low' {
  if (rescheduleCount === 0) return 'High';
  if (rescheduleCount <= 2) return 'Medium';
  return 'Low';
}

const initialSeed = dataStore.getData().patients.map((p: Patient) => {
  const count = p.rescheduleCount || 0;
  return {
    ...p,
    rescheduleCount: count,
    priority: calculatePatientPriority(count),
  };
});

const usePatientStore = create<ExtendedPatientState>((set, get) => ({
  patients: initialSeed,

  /** Add new patient, returns the new patient object */
  addPatient: (data) => {
    const newPatient: Patient = {
      ...data,
      id: nextPatientId(get().patients),
      parentDetails: data.parentDetails || [],
      therapistDetails: data.therapistDetails || [],
      rescheduleCount: 0,
      priority: 'High',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    patientService.add(data);
    set((s) => ({ patients: [newPatient, ...s.patients] }));
    return newPatient;
  },

  /** Update patient fields */
  updatePatient: (id, updates) => {
    patientService.update(id, updates);
    set((s) => ({
      patients: s.patients.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
          const count = updated.rescheduleCount || 0;
          return {
            ...updated,
            rescheduleCount: count,
            priority: calculatePatientPriority(count),
          };
        }
        return p;
      }),
    }));
  },

  incrementRescheduleCount: (id) => {
    set((s) => ({
      patients: s.patients.map((p) => {
        if (p.id === id) {
          const newCount = (p.rescheduleCount || 0) + 1;
          const newPriority = calculatePatientPriority(newCount);
          const updated = {
            ...p,
            rescheduleCount: newCount,
            priority: newPriority,
            updatedAt: new Date().toISOString(),
          };
          patientService.update(id, { rescheduleCount: newCount });
          return updated;
        }
        return p;
      }),
    }));
  },

  // --- Selectors ---
  byId: (id) => get().patients.find((p) => p.id === id),

  /** Regex search by name / id / mobile (debounce in UI) */
  search: (query) => searchPatients(get().patients, query),

  count: () => get().patients.length,
}));

export default usePatientStore;
