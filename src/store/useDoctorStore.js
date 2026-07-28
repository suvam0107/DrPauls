import { create } from 'zustand';
import { doctors as seed, therapists as therapistSeed } from '../data/mockData';

const useDoctorStore = create((set, get) => ({
  doctors: seed,
  therapists: therapistSeed,

  // --- Selectors ---
  byId: (id) => get().doctors.find((d) => d.id === id),

  /** Therapists filtered by service type */
  therapistsByService: (serviceType) =>
    get().therapists.filter(
      (t) => !serviceType || t.specialization === serviceType
    ),

  availableDoctors: () => get().doctors.filter((d) => d.available),
}));

export default useDoctorStore;
