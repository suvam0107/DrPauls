/**
 * Therapist API Service
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { Therapist } from '../../types';

export const therapistService = {
  getAll: async (): Promise<Therapist[]> => {
    const res = await apiClient.post<ApiResponse<Therapist[]>>('/nonnested', {
      spc: 'get_all_therapists',
    });
    return res.data.data;
  },

  getByService: async (serviceType?: string): Promise<Therapist[]> => {
    const res = await apiClient.post<ApiResponse<Therapist[]>>('/nonnested', {
      spc: 'get_therapists_by_service',
      payload: { serviceType },
    });
    return res.data.data;
  },
};
