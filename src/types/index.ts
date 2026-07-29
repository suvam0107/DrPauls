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
  | 'Rescheduled';

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

export type StaffRole = 'Receptionist' | 'Manager' | 'Admin' | 'Doctor';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ModalType =
  | 'createAppointment'
  | 'appointmentDetail'
  | 'addPatient'
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

// --- Domain Models ---
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
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string; // "DOC-001"
  name: string;
  specialty: string;
  department: string;
  qualification?: string;
  available: boolean;
  consultFee: number;
  location: string;
  workingDays: WeekDay[];
  workingHours: { start: string; end: string }; // "HH:mm"
  photo?: string;
}

export interface Appointment {
  id: string; // "APT-001"
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
  prePaymentRequired: boolean;
  prePaymentAmount: number;
  status: AppointmentStatus | string;
  leadStatus: LeadStatus | string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string; // "PKG-001"
  name: string;
  serviceType: ServiceType | string;
  totalSessions: number;
  usedSessions: number;
  price: number;
  patientId: string;
  validUntil?: string;
  status: PackageStatus;
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
