// --- Appointment enums ---
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  PAID: 'Paid',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

export const APPOINTMENT_TYPE = {
  NEW: 'New Consultation',
  FOLLOWUP: 'Follow-up',
  EMERGENCY: 'Emergency',
  PACKAGE: 'Package Session',
};

export const SERVICE_TYPE = {
  HAIR: 'Hair',
  SKIN: 'Skin',
  COSMETIC: 'Cosmetic',
  HAIR_TRANSPLANT: 'Hair Transplant',
  LASER: 'Laser',
  GENERAL: 'General',
};

export const VISIT_TYPE = { CLINIC: 'Clinic', HOME: 'Home' };

export const LEAD_STATUS = {
  NEW: 'New',
  REGISTERED: 'Registered',
  CONVERTED: 'Converted',
};

export const GENDER = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

// --- Calendar ---
export const GRID_START_HOUR = 7;   // 07:00
export const GRID_END_HOUR = 20;    // 20:00
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 60;      // px per slot
export const TIME_LABEL_WIDTH = 60; // px

// --- Status colors (hex) ---
export const STATUS_COLORS = {
  [APPOINTMENT_STATUS.SCHEDULED]: '#2563EB',
  [APPOINTMENT_STATUS.CONFIRMED]: '#16A34A',
  [APPOINTMENT_STATUS.PAID]:      '#7C3AED',
  [APPOINTMENT_STATUS.PENDING]:   '#D97706',
  [APPOINTMENT_STATUS.CANCELLED]: '#DC2626',
  [APPOINTMENT_STATUS.RESCHEDULED]: '#0891B2',
};

// --- Staff roles ---
export const STAFF_ROLE = {
  RECEPTIONIST: 'Receptionist',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

// --- Package ---
export const PACKAGE_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
};

// --- Enquiry sources ---
export const ENQUIRY_SOURCE = ['Walk-in', 'Referral', 'Online', 'Phone', 'Other'];

// --- Selectable lists (for pickers) ---
export const SERVICE_TYPES = Object.values(SERVICE_TYPE);
export const APPOINTMENT_TYPES = Object.values(APPOINTMENT_TYPE);
export const VISIT_TYPES = Object.values(VISIT_TYPE);
export const GENDERS = Object.values(GENDER);
