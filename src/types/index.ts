/**
 * Central TypeScript Type Definitions for Dr. Paul's Clinic
 * Replaces schema.js with strict TypeScript interfaces & types.
 */

// --- Enums & Union Types ---
export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Paid'
  | 'Pending'
  | 'Cancelled'
  | 'Rescheduled'
  | 'Overdue'
  | 'Unattended';

export type AppointmentType =
  | 'New Consultation'
  | 'Follow-up'
  | 'Emergency'
  | 'Package Session';

export type ServiceType =
  | 'Hair'
  | 'Skin'
  | 'Cosmetic'
  | 'Hair Transplant'
  | 'Laser'
  | 'General';

export type VisitType = 'Clinic' | 'Home';

export type LeadStatus = 'New' | 'Registered' | 'Converted';

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type Gender = 'Male' | 'Female' | 'Other';

export type PackageStatus = 'Active' | 'Completed' | 'Expired';

export type EnrollmentStatus = 'Active' | 'Completed' | 'Expired' | 'Paused';

export type StaffRole = 'Receptionist' | 'Manager' | 'Admin' | 'Doctor';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ModalType =
  | 'createAppointment'
  | 'appointmentDetail'
  | 'addPatient'
  | 'centerSwitch'
  | 'quickAdd'
  | 'rescheduleAppointment'
  | null;

export type CalendarView = 'day' | 'week' | 'month';

// --- Sub-types ---
export interface ParentDetail {
  name: string;
  relation: string;
  contactNo: string;
  whatsapp?: string;
}

export interface TherapistAssignment {
  therapistId: string;
  therapistName: string;
  isPrimary: boolean;
}

export interface DoctorCenterSchedule {
  centerId: string;
  workingDays: WeekDay[];
  workingHours: { start: string; end: string };
}

// --- Domain Models ---
export interface Center {
  id: string; // "CC-001"
  cc_name: string;
  comp_name?: string;
  bill_address: string;
  bill_state: string;
  bill_pin: number;
  phone: string;
  email?: string;
  isMain: boolean;
  openDays: WeekDay[];
  closedDays: WeekDay[];
  openHours: { start: string; end: string };
}

export interface OriginalSchedule {
  date: string;
  startTime: string;
  endTime: string;
  doctorId?: string;
  doctorName?: string;
  rescheduledAt: string;
  rescheduledReason?: string;
}

export interface Patient {
  id: string; // "PAT-001"
  name: string;
  mobile: string;
  whatsapp?: string;
  alternateMobile?: string;
  dob?: string; // "YYYY-MM-DD"
  gender: Gender;
  email?: string;
  address?: string;
  pinCode?: string;
  state?: string;
  district?: string;
  enquirySource?: string;
  enquirySubSource?: string;
  referenceDoctor?: string;
  parentDetails: ParentDetail[];
  therapistDetails: TherapistAssignment[];
  rescheduleCount?: number;
  priority?: 'High' | 'Medium' | 'Low';
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string; // "DOC-001"
  name: string;
  specialty: string;
  department: string;
  qualification?: string;
  phone?: string;
  maxPatientsPerDay: number;
  available: boolean;
  consultFee: number;
  location: string;
  workingDays: WeekDay[];
  workingHours: { start: string; end: string }; // "HH:mm"
  centerSchedule: DoctorCenterSchedule[];
  photo?: string;
}

export interface Appointment {
  id: string; // "APT-001"
  centerId: string; // "CC-001"
  patientId: string;
  patientName: string;
  patientMobile: string;
  doctorId: string;
  doctorName: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  appointmentType: AppointmentType | string;
  serviceType: ServiceType | string;
  visitType: VisitType | string;
  consultancy?: string;
  therapistId?: string;
  therapistName?: string;
  isPackage: boolean;
  packageId?: string;
  enrollmentId?: string;
  sessionNumber?: number;
  prePaymentRequired: boolean;
  prePaymentAmount: number;
  status: AppointmentStatus | string;
  leadStatus: LeadStatus | string;
  remark?: string;
  originalSchedule?: OriginalSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string; // "PKG-001"
  name: string;
  serviceType: ServiceType | string;
  totalSessions: number;
  usedSessions?: number;
  price: number;
  patientId?: string;
  validUntil?: string;
  status: PackageStatus;
  description?: string;
  includedServices?: string[];
  perSessionPrice?: number;
}

export interface PackageEnrollment {
  enrollmentId: string; // "ENR-001"
  packageId: string; // "PKG-001"
  packageName: string;
  serviceType: ServiceType | string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  centerId: string;
  doctorId: string;
  doctorName: string;
  therapistId?: string;
  therapistName?: string;
  startDate: string; // "YYYY-MM-DD"
  sessionInterval: number; // days between sessions (default 7)
  totalSessions: number;
  completedSessions: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  sessionIds: string[]; // ordered list of Appointment IDs
}

export interface Therapist {
  id: string; // "THR-001"
  name: string;
  specialization: string;
  available: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  staffId: string; // "DRP-R-0042"
  email?: string;
  mobile?: string;
}

// --- Auth Models ---
export interface MockUser {
  id: string;
  staffId: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: string;
}

export interface UserProfile {
  id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface JWTPayload {
  userId: string;
  staffId: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface MockJWTResult {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  token?: string;
  message?: string;
}

// --- Store State Interfaces ---
export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshTokenStr: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  registeredUsers: MockUser[];
  checkAndVerifyAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (params: {
    name: string;
    email: string;
    phone: string;
    role?: string;
    password: string;
  }) => Promise<LoginResult>;
  refreshAuthTokenForUser: (userObj: UserProfile) => Promise<string | null>;
  logout: () => Promise<void>;
}

export interface UIState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeModal: ModalType;
  modalData: any;
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  calendarView: CalendarView;
  setCalendarView: (v: CalendarView) => void;
  activeStatusFilters: string[];
  toggleStatusFilter: (status: string) => void;
  clearStatusFilters: () => void;
  activeDoctorFilter: string | null;
  setDoctorFilter: (id: string | null) => void;
  activeCenterId: string;
  setActiveCenterId: (id: string) => void;
}

export interface AppointmentState {
  appointments: Appointment[];
  selectedDate: string;
  selectedAppointment: Appointment | null;
  setSelectedDate: (date: string) => void;
  setSelectedAppointment: (apt: Appointment | null) => void;
  addAppointment: (
    apt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  rescheduleAppointment: (
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ) => void;
  updateAppointmentStatus: (
    id: string,
    status: AppointmentStatus | string
  ) => void;
  getAppointmentsForDate: (date: string) => Appointment[];
  getAppointmentsForRange: (
    startDate: string,
    endDate: string
  ) => Appointment[];
}

export interface PatientState {
  patients: Patient[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addPatient: (
    patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>
  ) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  getPatientById: (id: string) => Patient | undefined;
  filterPatients: (query: string) => Patient[];
}

export interface DoctorState {
  doctors: Doctor[];
  selectedDoctorId: string | null;
  setSelectedDoctorId: (id: string | null) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  getAvailableDoctors: () => Doctor[];
}
