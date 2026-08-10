import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '../../api/services/appointmentService';
import { queryKeys } from '../../api/queryKeys';
import { dataStore } from '../../api/dataStore';
import { Appointment } from '../../types';

export function useAppointmentsQuery() {
  return useQuery<Appointment[]>({
    queryKey: queryKeys.appointments.all(),
    queryFn: () => appointmentService.getAll(),
    initialData: () => dataStore.getData().appointments,
  });
}

export function useAppointmentsByDateQuery(date: string, statuses?: string[]) {
  return useQuery<Appointment[]>({
    queryKey: [...queryKeys.appointments.byDate(date), statuses],
    queryFn: () => appointmentService.getByDate(date, statuses),
    initialData: () => {
      const all = dataStore.getData().appointments;
      return all.filter((a) => {
        if (a.date !== date) return false;
        if (statuses && statuses.length > 0) {
          return statuses.includes(a.status);
        }
        return true;
      });
    },
  });
}

export function useAppointmentsByRangeQuery(startDate: string, endDate: string) {
  return useQuery<Appointment[]>({
    queryKey: queryKeys.appointments.byRange(startDate, endDate),
    queryFn: () => appointmentService.getByRange(startDate, endDate),
    initialData: () => {
      const all = dataStore.getData().appointments;
      return all.filter((a) => a.date >= startDate && a.date <= endDate);
    },
  });
}

export function useTodayStatsQuery() {
  return useQuery({
    queryKey: queryKeys.appointments.todayStats(),
    queryFn: () => appointmentService.getTodayStats(),
  });
}

export function useAppointmentSearchQuery(
  query: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery<Appointment[]>({
    queryKey: queryKeys.appointments.search(query, startDate, endDate),
    queryFn: () => appointmentService.searchByQuery(query, startDate, endDate),
    enabled: query.trim().length >= 1,
    staleTime: 30_000,
  });
}
