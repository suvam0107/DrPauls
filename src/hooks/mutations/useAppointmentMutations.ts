import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../api/queryClient';
import { queryKeys } from '../../api/queryKeys';
import useAppointmentStore from '../../store/useAppointmentStore';
import { Appointment } from '../../types';

export function useAddAppointmentMutation() {
  return useMutation({
    mutationFn: async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) =>
      await useAppointmentStore.getState().addAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useUpdateAppointmentMutation() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Appointment> }) =>
      await useAppointmentStore.getState().updateAppointment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useMoveAppointmentMutation() {
  return useMutation({
    mutationFn: async ({
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
      await useAppointmentStore
        .getState()
        .moveAppointment(id, newDate, newStartTime, newEndTime, newDoctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
    },
  });
}

export function useCancelAppointmentMutation() {
  return useMutation({
    mutationFn: async (id: string) =>
      await useAppointmentStore.getState().cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useUpdateStatusMutation() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      await useAppointmentStore.getState().updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}
