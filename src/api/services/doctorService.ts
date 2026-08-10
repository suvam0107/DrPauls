/**
 * Doctor API Service
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { Doctor } from '../../types';

export const doctorService = {
  getAll: async (): Promise<Doctor[]> => {
    const res = await apiClient.post<ApiResponse<Doctor[]>>('/nonnested', {
      spc: 'get_all_doctors',
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Doctor | undefined> => {
    const res = await apiClient.post<ApiResponse<Doctor | undefined>>('/nonnested', {
      spc: 'get_doctor_by_id',
      payload: { id },
    });
    return res.data.data;
  },

  search: async (query: string): Promise<Doctor[]> => {
    const res = await apiClient.post<ApiResponse<Doctor[]>>('/nested', {
      spc: 'search_doctors',
      payload: { query },
    });
    return res.data.data;
  },

  add: async (data: Omit<Doctor, 'id'>): Promise<Doctor> => {
    const res = await apiClient.post<ApiResponse<Doctor>>('/nonnested', {
      spc: 'add_doctor',
      payload: data,
    });
    return res.data.data;
  },

  update: async (id: string, updates: Partial<Doctor>): Promise<Doctor> => {
    const res = await apiClient.post<ApiResponse<Doctor>>('/nonnested', {
      spc: 'update_doctor',
      payload: { id, updates },
    });
    return res.data.data;
  },
};

