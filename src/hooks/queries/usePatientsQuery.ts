import { useQuery } from '@tanstack/react-query';
import { patientService } from '../../api/services/patientService';
import { queryKeys } from '../../api/queryKeys';
import { dataStore } from '../../api/dataStore';
import { Patient } from '../../types';
import { calculatePatientPriority } from '../../store/usePatientStore';

export function usePatientsQuery() {
  return useQuery<Patient[]>({
    queryKey: queryKeys.patients.all(),
    queryFn: async () => {
      const fetched = await patientService.getAll();
      return fetched.map((p) => {
        const count = p.rescheduleCount || 0;
        return {
          ...p,
          rescheduleCount: count,
          priority: calculatePatientPriority(count),
        };
      });
    },
    initialData: () => {
      return dataStore.getData().patients.map((p) => {
        const count = p.rescheduleCount || 0;
        return {
          ...p,
          rescheduleCount: count,
          priority: calculatePatientPriority(count),
        };
      });
    },
  });
}

export function usePatientByIdQuery(id?: string) {
  return useQuery<Patient | undefined>({
    queryKey: queryKeys.patients.byId(id || ''),
    queryFn: () => (id ? patientService.getById(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

export function usePatientSearchQuery(query: string) {
  return useQuery<Patient[]>({
    queryKey: queryKeys.patients.search(query),
    queryFn: () => patientService.search(query),
    enabled: query.trim().length > 0,
  });
}
