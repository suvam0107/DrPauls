import { useQuery } from '@tanstack/react-query';
import { packageService } from '../../api/services/packageService';
import { packageEnrollmentService } from '../../api/services/packageEnrollmentService';
import { queryKeys } from '../../api/queryKeys';
import { dataStore } from '../../api/dataStore';
import { Package, PackageEnrollment } from '../../types';

export function usePackagesQuery() {
  return useQuery<Package[]>({
    queryKey: queryKeys.packages.all(),
    queryFn: () => packageService.getAll(),
    initialData: () => dataStore.getData().packages,
  });
}

export function useEnrollmentsQuery() {
  return useQuery<PackageEnrollment[]>({
    queryKey: queryKeys.enrollments.all(),
    queryFn: () => packageEnrollmentService.getAll(),
    initialData: () => dataStore.getData().enrollments,
  });
}

export function useEnrollmentsByPatientQuery(patientId?: string) {
  return useQuery<PackageEnrollment[]>({
    queryKey: queryKeys.enrollments.byPatient(patientId || ''),
    queryFn: () => (patientId ? packageEnrollmentService.getByPatient(patientId) : Promise.resolve([])),
    enabled: !!patientId,
  });
}

export function usePackageSearchQuery(query: string, serviceType?: string) {
  return useQuery<Package[]>({
    queryKey: queryKeys.packages.search(query, serviceType),
    queryFn: () => packageService.search(query, serviceType),
    enabled: query.trim().length >= 1,
    staleTime: 30_000,
  });
}

export function useEnrollmentSearchQuery(query: string, status?: string) {
  return useQuery<PackageEnrollment[]>({
    queryKey: queryKeys.enrollments.search(query, status),
    queryFn: () => packageEnrollmentService.search(query, status),
    enabled: query.trim().length >= 1,
    staleTime: 30_000,
  });
}
