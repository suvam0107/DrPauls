import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../api/queryClient';
import { queryKeys } from '../../api/queryKeys';
import useDoctorStore from '../../store/useDoctorStore';
import { Doctor } from '../../types';

export function useAddDoctorMutation() {
  return useMutation({
    mutationFn: (data: Omit<Doctor, 'id'>) =>
      Promise.resolve(useDoctorStore.getState().addDoctor(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all() });
    },
  });
}

export function useUpdateDoctorMutation() {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Doctor> }) =>
      Promise.resolve(useDoctorStore.getState().updateDoctor(id, updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all() });
    },
  });
}
