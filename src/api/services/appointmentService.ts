/**
 * Appointment API Service
 * Routes calls through axios instance to /nonnested or /nested endpoints using spc keys.
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { Appointment } from '../../types';

export const appointmentService = {
  getAll: async (): Promise<Appointment[]> => {
    const res = await apiClient.post<ApiResponse<Appointment[]>>('/nonnested', {
      spc: 'get_all_appointments',
    });
    return res.data.data;
  },

  getByDate: async (date: string, statuses?: string[]): Promise<Appointment[]> => {
    const res = await apiClient.post<ApiResponse<Appointment[]>>('/nested', {
      spc: 'get_appointments_by_date',
      payload: { date, statuses },
    });
    return res.data.data;
  },

  getByRange: async (startDate: string, endDate: string): Promise<Appointment[]> => {
    const res = await apiClient.post<ApiResponse<Appointment[]>>('/nested', {
      spc: 'get_appointments_by_range',
      payload: { startDate, endDate },
    });
    return res.data.data;
  },

  getForDateAndDoctor: async (
    date: string,
    doctorId?: string | null
  ): Promise<Appointment[]> => {
    const res = await apiClient.post<ApiResponse<Appointment[]>>('/nested', {
      spc: 'get_appointments_for_date_and_doctor',
      payload: { date, doctorId },
    });
    return res.data.data;
  },

  getWithDetails: async (id: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/nested', {
      spc: 'get_appointment_with_details',
      payload: { id },
    });
    return res.data.data;
  },

  getTodayStats: async (): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/nested', {
      spc: 'get_today_stats',
    });
    return res.data.data;
  },

  searchByQuery: async (query: string, startDate?: string, endDate?: string): Promise<Appointment[]> => {
    const res = await apiClient.post<ApiResponse<Appointment[]>>('/nested', {
      spc: 'search_appointments_by_query',
      payload: { query, startDate, endDate },
    });
    return res.data.data;
  },

  add: async (
    data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> => {
    const res = await apiClient.post<ApiResponse<Appointment>>('/nonnested', {
      spc: 'add_appointment',
      payload: data,
    });
    return res.data.data;
  },

  update: async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
    const res = await apiClient.post<ApiResponse<Appointment>>('/nonnested', {
      spc: 'update_appointment',
      payload: { id, updates },
    });
    return res.data.data;
  },

  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.post<ApiResponse<{ id: string }>>('/nonnested', {
      spc: 'delete_appointment',
      payload: { id },
    });
    return res.data.data;
  },
};
