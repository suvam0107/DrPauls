import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../api/queryClient';
import { queryKeys } from '../../api/queryKeys';
import usePackageStore, { EnrollParams } from '../../store/usePackageStore';

export function useEnrollPatientMutation() {
  return useMutation({
    mutationFn: (params: EnrollParams) =>
      Promise.resolve(usePackageStore.getState().enrollPatientInPackage(params)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useMarkSessionCompletedMutation() {
  return useMutation({
    mutationFn: ({ enrollmentId, sessionId }: { enrollmentId: string; sessionId: string }) =>
      Promise.resolve(usePackageStore.getState().markSessionCompleted(enrollmentId, sessionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useCancelSessionMutation() {
  return useMutation({
    mutationFn: ({
      enrollmentId,
      sessionId,
      shiftRemaining,
    }: {
      enrollmentId: string;
      sessionId: string;
      shiftRemaining?: boolean;
    }) =>
      Promise.resolve(usePackageStore.getState().cancelSession(enrollmentId, sessionId, shiftRemaining)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useRescheduleSessionMutation() {
  return useMutation({
    mutationFn: ({
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
      Promise.resolve(
        usePackageStore.getState().rescheduleSession(
          enrollmentId,
          sessionId,
          newDate,
          newStartTime,
          shiftRemaining
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function usePauseEnrollmentMutation() {
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      Promise.resolve(usePackageStore.getState().pauseEnrollment(enrollmentId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}

export function useResumeEnrollmentMutation() {
  return useMutation({
    mutationFn: ({ enrollmentId, newStartDate }: { enrollmentId: string; newStartDate: string }) =>
      Promise.resolve(usePackageStore.getState().resumeEnrollment(enrollmentId, newStartDate)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
    },
  });
}
