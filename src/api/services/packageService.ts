/**
 * Package API Service
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { Package } from '../../types';

export const packageService = {
  getAll: async (): Promise<Package[]> => {
    const res = await apiClient.post<ApiResponse<Package[]>>('/nonnested', {
      spc: 'get_all_packages',
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Package | undefined> => {
    const res = await apiClient.post<ApiResponse<Package | undefined>>('/nonnested', {
      spc: 'get_package_by_id',
      payload: { id },
    });
    return res.data.data;
  },

  search: async (query: string, serviceType?: string): Promise<Package[]> => {
    const res = await apiClient.post<ApiResponse<Package[]>>('/nested', {
      spc: 'search_packages',
      payload: { query, serviceType },
    });
    return res.data.data;
  },

  add: async (data: Omit<Package, 'id'>): Promise<Package> => {
    const res = await apiClient.post<ApiResponse<Package>>('/nonnested', {
      spc: 'add_package',
      payload: data,
    });
    return res.data.data;
  },

  update: async (id: string, updates: Partial<Package>): Promise<Package> => {
    const res = await apiClient.post<ApiResponse<Package>>('/nonnested', {
      spc: 'update_package',
      payload: { id, updates },
    });
    return res.data.data;
  },
};
