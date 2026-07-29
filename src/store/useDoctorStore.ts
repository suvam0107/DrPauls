import { create } from 'zustand';
import { doctors as seed, therapists as therapistSeed } from '../data/mockData';
import { Doctor, Therapist } from '../types';

export interface ExtendedDoctorState {
  doctors: Doctor[];
  therapists: Therapist[];
  byId: (id: string) => Doctor | undefined;
  therapistsByService: (serviceType?: string) => Therapist[];
  availableDoctors: () => Doctor[];
}

const useDoctorStore = create<ExtendedDoctorState>((set, get) => ({
  doctors: seed,
  therapists: therapistSeed,

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
