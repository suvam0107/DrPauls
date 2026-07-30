import { create } from 'zustand';
import { doctorService } from '../api/services/doctorService';
import { therapistService } from '../api/services/therapistService';
import { dataStore } from '../api/dataStore';
import { Doctor, Therapist } from '../types';
import { nextDoctorId } from '../utils/searchUtils';

export interface ExtendedDoctorState {
  doctors: Doctor[];
  therapists: Therapist[];
  fetchDoctorsAndTherapists: () => Promise<void>;
  addDoctor: (data: Omit<Doctor, 'id'>) => Doctor;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  byId: (id: string) => Doctor | undefined;
  therapistsByService: (serviceType?: string) => Therapist[];
  availableDoctors: () => Doctor[];
  count: () => number;
}

const initialDoctors = dataStore.getData().doctors;
const initialTherapists = dataStore.getData().therapists;

const useDoctorStore = create<ExtendedDoctorState>((set, get) => ({
  doctors: initialDoctors,
  therapists: initialTherapists,

  fetchDoctorsAndTherapists: async () => {
    const doctors = await doctorService.getAll();
    const therapists = await therapistService.getAll();
    set({ doctors, therapists });
  },

  /** Add new doctor, returns new doctor object */
  addDoctor: (data) => {
    const newDoc: Doctor = {
      ...data,
      id: nextDoctorId(get().doctors),
      centerSchedule: data.centerSchedule || [
        {
          centerId: 'CC-001',
          workingDays: data.workingDays || ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
          workingHours: data.workingHours || { start: '10:00', end: '19:00' },
        },
      ],
    };
    doctorService.add(data);
    set((s) => ({ doctors: [newDoc, ...s.doctors] }));
    return newDoc;
  },

  /** Update doctor details */
  updateDoctor: (id, updates) => {
    doctorService.update(id, updates);
    set((s) => ({
      doctors: s.doctors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  // --- Selectors ---
  byId: (id) => get().doctors.find((d) => d.id === id),

  /** Therapists filtered by service type */
  therapistsByService: (serviceType?: string) =>
    get().therapists.filter(
      (t) => !serviceType || t.specialization === serviceType
    ),

  availableDoctors: () => get().doctors.filter((d) => d.available),

  count: () => get().doctors.length,
}));

export default useDoctorStore;

