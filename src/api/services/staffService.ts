/**
 * Staff API Service
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { StaffUser } from '../../types';

export const staffService = {
  getStaff: async (): Promise<StaffUser> => {
    const res = await apiClient.post<ApiResponse<StaffUser>>('/nonnested', {
      spc: 'get_staff',
    });
    return res.data.data;
  },
};
