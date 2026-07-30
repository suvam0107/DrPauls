import { create } from 'zustand';
import { doctorService } from '../api/services/doctorService';
import { therapistService } from '../api/services/therapistService';
import { dataStore } from '../api/dataStore';
import { Doctor, Therapist } from '../types';

export interface ExtendedDoctorState {
  doctors: Doctor[];
  therapists: Therapist[];
  fetchDoctorsAndTherapists: () => Promise<void>;
  byId: (id: string) => Doctor | undefined;
  therapistsByService: (serviceType?: string) => Therapist[];
  availableDoctors: () => Doctor[];
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

  // --- Selectors ---
  byId: (id) => get().doctors.find((d) => d.id === id),

  /** Therapists filtered by service type */
  therapistsByService: (serviceType?: string) =>
    get().therapists.filter(
      (t) => !serviceType || t.specialization === serviceType
    ),

  availableDoctors: () => get().doctors.filter((d) => d.available),
}));

export default useDoctorStore;
