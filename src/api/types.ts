/**
 * Central API Type Definitions for Dr. Paul's Clinic
 */

export type ApiFamily = 'nested' | 'nonnested';

export type SpcKey =
  // nonnested (flat CRUD)
  | 'get_all_patients'
  | 'get_patient_by_id'
  | 'add_patient'
  | 'update_patient'
  | 'delete_patient'
  | 'get_all_doctors'
  | 'get_doctor_by_id'
  | 'get_all_centers'
  | 'get_center_by_id'
  | 'get_all_therapists'
  | 'get_therapists_by_service'
  | 'get_all_packages'
  | 'get_package_by_id'
  | 'add_package'
  | 'update_package'
  | 'get_staff'
  | 'get_all_appointments'
  | 'add_appointment'
  | 'update_appointment'
  | 'delete_appointment'
  // nested (relational / composed queries)
  | 'get_appointments_by_date'
  | 'get_appointments_by_range'
  | 'get_appointments_for_date_and_doctor'
  | 'search_patients'
  | 'get_appointment_with_details'
  | 'get_today_stats';

export interface ApiRequest<TPayload = unknown> {
  spc: SpcKey;
  payload?: TPayload;
}

export interface ApiResponse<TData = unknown> {
  success: boolean;
  data: TData;
  error?: string;
  timestamp: string;
}
