import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../api/queryClient';
import { queryKeys } from '../../api/queryKeys';
import usePatientStore from '../../store/usePatientStore';
import { Patient } from '../../types';

export function useAddPatientMutation() {
  return useMutation({
    mutationFn: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) =>
      Promise.resolve(usePatientStore.getState().addPatient(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
    },
  });
}

export function useUpdatePatientMutation() {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Patient> }) =>
      Promise.resolve(usePatientStore.getState().updatePatient(id, updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
    },
  });
}
