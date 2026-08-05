import {
  AppointmentStatus,
  AppointmentType,
  ServiceType,
  VisitType,
  LeadStatus,
  Gender,
  PackageStatus,
  StaffRole,
} from '../types';

// --- Appointment enums ---
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  PAID: 'Paid',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
  OVERDUE: 'Overdue',
  UNATTENDED: 'Unattended',
} as const satisfies Record<string, AppointmentStatus>;

export const APPOINTMENT_TYPE = {
  NEW: 'New Consultation',
  FOLLOWUP: 'Follow-up',
  EMERGENCY: 'Emergency',
  PACKAGE: 'Package Session',
} as const satisfies Record<string, AppointmentType>;

export const SERVICE_TYPE = {
  HAIR: 'Hair',
  SKIN: 'Skin',
  COSMETIC: 'Cosmetic',
  HAIR_TRANSPLANT: 'Hair Transplant',
  LASER: 'Laser',
  GENERAL: 'General',
} as const satisfies Record<string, ServiceType>;

export const VISIT_TYPE = {
  CLINIC: 'Clinic',
  HOME: 'Home',
} as const satisfies Record<string, VisitType>;

export const LEAD_STATUS = {
  NEW: 'New',
  REGISTERED: 'Registered',
  CONVERTED: 'Converted',
} as const satisfies Record<string, LeadStatus>;

export const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
} as const satisfies Record<string, Gender>;

// --- Calendar ---
export const GRID_START_HOUR: number = 7; // 07:00
export const GRID_END_HOUR: number = 20; // 20:00
export const SLOT_MINUTES: number = 30;
export const SLOT_HEIGHT: number = 60; // px per slot
export const TIME_LABEL_WIDTH: number = 60; // px

// --- Status colors (hex) ---
export const STATUS_COLORS: Record<string, string> = {
  [APPOINTMENT_STATUS.SCHEDULED]: '#2563EB',
  [APPOINTMENT_STATUS.CONFIRMED]: '#16A34A',
  [APPOINTMENT_STATUS.PAID]: '#7C3AED',
  [APPOINTMENT_STATUS.PENDING]: '#D97706',
  [APPOINTMENT_STATUS.CANCELLED]: '#DC2626',
  [APPOINTMENT_STATUS.RESCHEDULED]: '#0891B2',
  [APPOINTMENT_STATUS.OVERDUE]: '#EF4444',
  [APPOINTMENT_STATUS.UNATTENDED]: '#E11D48',
};

// --- Staff roles ---
export const STAFF_ROLE = {
  RECEPTIONIST: 'Receptionist',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
} as const satisfies Record<string, StaffRole>;

// --- Package ---
export const PACKAGE_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
} as const satisfies Record<string, PackageStatus>;

// --- Enquiry sources ---
export const ENQUIRY_SOURCE: string[] = [
  'Walk-in',
  'Referral',
  'Online',
  'Phone',
  'Other',
];

// --- Selectable lists (for pickers) ---
export const SERVICE_TYPES: string[] = Object.values(SERVICE_TYPE);
export const APPOINTMENT_TYPES: string[] = Object.values(APPOINTMENT_TYPE);
export const VISIT_TYPES: string[] = Object.values(VISIT_TYPE);
export const GENDERS: string[] = Object.values(GENDER);
