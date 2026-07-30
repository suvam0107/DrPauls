/**
 * Patient API Service
 * Handles patient CRUD and regex search via /nonnested and /nested endpoints.
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { Patient } from '../../types';

export const patientService = {
  getAll: async (): Promise<Patient[]> => {
    const res = await apiClient.post<ApiResponse<Patient[]>>('/nonnested', {
      spc: 'get_all_patients',
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Patient | undefined> => {
    const res = await apiClient.post<ApiResponse<Patient | undefined>>('/nonnested', {
      spc: 'get_patient_by_id',
      payload: { id },
    });
    return res.data.data;
  },

  search: async (query: string): Promise<Patient[]> => {
    const res = await apiClient.post<ApiResponse<Patient[]>>('/nested', {
      spc: 'search_patients',
      payload: { query },
    });
    return res.data.data;
  },

  add: async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    const res = await apiClient.post<ApiResponse<Patient>>('/nonnested', {
      spc: 'add_patient',
      payload: data,
    });
    return res.data.data;
  },

  update: async (id: string, updates: Partial<Patient>): Promise<Patient> => {
    const res = await apiClient.post<ApiResponse<Patient>>('/nonnested', {
      spc: 'update_patient',
      payload: { id, updates },
    });
    return res.data.data;
  },

  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.post<ApiResponse<{ id: string }>>('/nonnested', {
      spc: 'delete_patient',
      payload: { id },
    });
    return res.data.data;
  },
};
