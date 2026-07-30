/**
 * Center API Service
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { Center } from '../../types';

export const centerService = {
  getAll: async (): Promise<Center[]> => {
    const res = await apiClient.post<ApiResponse<Center[]>>('/nonnested', {
      spc: 'get_all_centers',
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Center | undefined> => {
    const res = await apiClient.post<ApiResponse<Center | undefined>>('/nonnested', {
      spc: 'get_center_by_id',
      payload: { id },
    });
    return res.data.data;
  },
};
