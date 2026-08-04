/**
 * Package Enrollment API Service
 */

import { apiClient } from '../axiosConfig';
import { ApiResponse } from '../types';
import { PackageEnrollment } from '../../types';

export const packageEnrollmentService = {
  getAll: async (): Promise<PackageEnrollment[]> => {
    const res = await apiClient.post<ApiResponse<PackageEnrollment[]>>('/nonnested', {
      spc: 'get_all_enrollments',
    });
    return res.data.data;
  },

  getByPatient: async (patientId: string): Promise<PackageEnrollment[]> => {
    const res = await apiClient.post<ApiResponse<PackageEnrollment[]>>('/nonnested', {
      spc: 'get_enrollments_by_patient',
      payload: { patientId },
    });
    return res.data.data;
  },

  getById: async (enrollmentId: string): Promise<PackageEnrollment | undefined> => {
    const res = await apiClient.post<ApiResponse<PackageEnrollment | undefined>>('/nonnested', {
      spc: 'get_enrollment_by_id',
      payload: { enrollmentId },
    });
    return res.data.data;
  },

  add: async (data: Omit<PackageEnrollment, 'enrollmentId' | 'enrolledAt'>): Promise<PackageEnrollment> => {
    const res = await apiClient.post<ApiResponse<PackageEnrollment>>('/nonnested', {
      spc: 'add_enrollment',
      payload: data,
    });
    return res.data.data;
  },

  update: async (enrollmentId: string, updates: Partial<PackageEnrollment>): Promise<PackageEnrollment> => {
    const res = await apiClient.post<ApiResponse<PackageEnrollment>>('/nonnested', {
      spc: 'update_enrollment',
      payload: { enrollmentId, updates },
    });
    return res.data.data;
  },
};
