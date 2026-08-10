import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../api/queryClient';
import { queryKeys } from '../../api/queryKeys';
import useAppointmentStore from '../../store/useAppointmentStore';
import { Appointment } from '../../types';

export function useAddAppointmentMutation() {
  return useMutation({
    mutationFn: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) =>
      Promise.resolve(useAppointmentStore.getState().addAppointment(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useUpdateAppointmentMutation() {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Appointment> }) =>
      Promise.resolve(useAppointmentStore.getState().updateAppointment(id, updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useMoveAppointmentMutation() {
  return useMutation({
    mutationFn: ({
      id,
      newDate,
      newStartTime,
      newEndTime,
      newDoctorId,
    }: {
      id: string;
      newDate: string;
      newStartTime: string;
      newEndTime: string;
      newDoctorId?: string;
    }) =>
      Promise.resolve(
        useAppointmentStore.getState().moveAppointment(id, newDate, newStartTime, newEndTime, newDoctorId)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
    },
  });
}

export function useCancelAppointmentMutation() {
  return useMutation({
    mutationFn: (id: string) =>
      Promise.resolve(useAppointmentStore.getState().cancelAppointment(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useUpdateStatusMutation() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      Promise.resolve(useAppointmentStore.getState().updateStatus(id, status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}
