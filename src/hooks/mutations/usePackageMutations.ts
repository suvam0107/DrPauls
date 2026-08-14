import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../api/queryClient';
import { queryKeys } from '../../api/queryKeys';
import usePackageStore, { EnrollParams } from '../../store/usePackageStore';

export function useEnrollPatientMutation() {
  return useMutation({
    mutationFn: async (params: EnrollParams) =>
      await usePackageStore.getState().enrollPatientInPackage(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useMarkSessionCompletedMutation() {
  return useMutation({
    mutationFn: async ({ enrollmentId, sessionId }: { enrollmentId: string; sessionId: string }) =>
      await usePackageStore.getState().markSessionCompleted(enrollmentId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useCancelSessionMutation() {
  return useMutation({
    mutationFn: async ({
      enrollmentId,
      sessionId,
      shiftRemaining,
    }: {
      enrollmentId: string;
      sessionId: string;
      shiftRemaining?: boolean;
    }) =>
      await usePackageStore.getState().cancelSession(enrollmentId, sessionId, shiftRemaining),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useRescheduleSessionMutation() {
  return useMutation({
    mutationFn: async ({
      enrollmentId,
      sessionId,
      newDate,
      newStartTime,
      shiftRemaining,
    }: {
      enrollmentId: string;
      sessionId: string;
      newDate: string;
      newStartTime: string;
      shiftRemaining?: boolean;
    }) =>
      await usePackageStore.getState().rescheduleSession(
        enrollmentId,
        sessionId,
        newDate,
        newStartTime,
        shiftRemaining
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function usePauseEnrollmentMutation() {
  return useMutation({
    mutationFn: async (enrollmentId: string) =>
      await usePackageStore.getState().pauseEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useResumeEnrollmentMutation() {
  return useMutation({
    mutationFn: async ({ enrollmentId, newStartDate }: { enrollmentId: string; newStartDate: string }) =>
      await usePackageStore.getState().resumeEnrollment(enrollmentId, newStartDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}
