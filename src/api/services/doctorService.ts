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
};
