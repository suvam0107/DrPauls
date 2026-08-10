import { useQuery } from '@tanstack/react-query';
import { doctorService } from '../../api/services/doctorService';
import { therapistService } from '../../api/services/therapistService';
import { queryKeys } from '../../api/queryKeys';
import { dataStore } from '../../api/dataStore';
import { Doctor, Therapist } from '../../types';

export function useDoctorsQuery() {
  return useQuery<Doctor[]>({
    queryKey: queryKeys.doctors.all(),
    queryFn: () => doctorService.getAll(),
    initialData: () => dataStore.getData().doctors,
  });
}

export function useTherapistsQuery(serviceType?: string) {
  return useQuery<Therapist[]>({
    queryKey: queryKeys.therapists.byService(serviceType),
    queryFn: () => therapistService.getByService(serviceType),
    initialData: () => {
      const therapists = dataStore.getData().therapists;
      if (!serviceType) return therapists;
      return therapists.filter((t) => t.specialization === serviceType);
    },
  });
}

export function useDoctorSearchQuery(query: string) {
  return useQuery<Doctor[]>({
    queryKey: queryKeys.doctors.search(query),
    queryFn: () => doctorService.search(query),
    enabled: query.trim().length >= 1,
    staleTime: 30_000,
  });
}

