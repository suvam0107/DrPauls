import { APPOINTMENT_STATUS, LEAD_STATUS, APPOINTMENT_TYPE, SERVICE_TYPE, VISIT_TYPE, PACKAGE_STATUS } from '../constants';

// Helpers
const today = () => new Date().toISOString().split('T')[0];
const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const now = () => new Date().toISOString();

// --- Patients ---
/** @type {import('./schema').Patient[]} */
export const patients = [
  {
    id: 'PAT-001', name: 'Ravi Sharma', mobile: '9876543210', whatsapp: '9876543210',
    dob: '1988-04-15', gender: 'Male', email: 'ravi.sharma@email.com',
    address: 'Zoo Tiniali, Guwahati', pinCode: '781024', state: 'Assam', district: 'Kamrup',
    enquirySource: 'Walk-in', parentDetails: [], therapistDetails: [{ therapistId: 'THR-001', therapistName: 'Meera Singh', isPrimary: true }],
    createdAt: '2026-01-10T09:00:00Z', updatedAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'PAT-002', name: 'Priya Das', mobile: '9123456789',
    dob: '1995-09-22', gender: 'Female', email: 'priya.das@email.com',
    address: 'GS Road, Guwahati', pinCode: '781007', state: 'Assam', district: 'Kamrup',
    enquirySource: 'Referral', parentDetails: [], therapistDetails: [{ therapistId: 'THR-002', therapistName: 'Pooja Nath', isPrimary: true }],
    createdAt: '2026-02-05T10:30:00Z', updatedAt: '2026-02-05T10:30:00Z',
  },
  {
    id: 'PAT-003', name: 'Amit Bora', mobile: '7001234567',
    dob: '1980-12-03', gender: 'Male',
    address: 'Beltola, Guwahati', pinCode: '781028', state: 'Assam', district: 'Kamrup',
    enquirySource: 'Online', parentDetails: [], therapistDetails: [],
    createdAt: '2026-03-01T11:00:00Z', updatedAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'PAT-004', name: 'Sunita Kalita', mobile: '8001234567', whatsapp: '8001234567',
    dob: '1992-07-18', gender: 'Female', email: 'sunita.k@email.com',
    address: 'Hatigaon, Guwahati', pinCode: '781038', state: 'Assam', district: 'Kamrup',
    enquirySource: 'Phone', parentDetails: [], therapistDetails: [{ therapistId: 'THR-002', therapistName: 'Pooja Nath', isPrimary: true }],
    createdAt: '2026-04-14T08:45:00Z', updatedAt: '2026-04-14T08:45:00Z',
  },
  {
    id: 'PAT-005', name: 'Dipankar Roy', mobile: '6001234567',
    dob: '1975-03-30', gender: 'Male',
    address: 'Dispur, Guwahati', pinCode: '781006', state: 'Assam', district: 'Kamrup',
    enquirySource: 'Walk-in', parentDetails: [], therapistDetails: [],
    createdAt: '2026-05-20T14:00:00Z', updatedAt: '2026-05-20T14:00:00Z',
  },
  {
    id: 'PAT-006', name: 'Neha Gogoi', mobile: '9435012345',
    dob: '1990-11-12', gender: 'Female', email: 'neha.gogoi@email.com',
    address: 'Silpukhuri, Guwahati', pinCode: '781003', state: 'Assam', district: 'Kamrup',
    enquirySource: 'Instagram', parentDetails: [], therapistDetails: [],
    createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'PAT-007', name: 'Bikash Saikia', mobile: '9864098765',
    dob: '1983-08-05', gender: 'Male', email: 'bikash.saikia@email.com',
    address: 'Chandmari, Guwahati', pinCode: '781003', state: 'Assam', district: 'Kamrup',
    enquirySource: 'Google Ads', parentDetails: [], therapistDetails: [],
    createdAt: '2026-06-15T11:30:00Z', updatedAt: '2026-06-15T11:30:00Z',
  },
];

// --- Doctors ---
/** @type {import('./schema').Doctor[]} */
export const doctors = [
  {
    id: 'DOC-001', name: 'Dr. Sarah Paul', specialty: 'Dermatologist', department: 'Skin',
    qualification: 'MBBS, MD (Dermatology)', available: true, consultFee: 500,
    location: 'Room 1, 2nd Floor', workingDays: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
    workingHours: { start: '10:00', end: '19:00' },
  },
  {
    id: 'DOC-002', name: 'Dr. Rajesh Kumar', specialty: 'Trichologist', department: 'Hair',
    qualification: 'MBBS, DV&D, Trichology Certified', available: true, consultFee: 600,
    location: 'Room 2, 2nd Floor', workingDays: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
    workingHours: { start: '10:00', end: '19:00' },
  },
  {
    id: 'DOC-003', name: 'Dr. Ananya Bose', specialty: 'Cosmetic Surgeon', department: 'Cosmetic',
    qualification: 'MBBS, MS, MCh (Plastic Surgery)', available: true, consultFee: 1000,
    location: 'Room 3, 2nd Floor', workingDays: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat'],
    workingHours: { start: '11:00', end: '18:00' },
  },
];

// --- Therapists ---
/** @type {import('./schema').Therapist[]} */
export const therapists = [
  { id: 'THR-001', name: 'Meera Singh', specialization: SERVICE_TYPE.HAIR, available: true },
  { id: 'THR-002', name: 'Pooja Nath', specialization: SERVICE_TYPE.SKIN, available: true },
  { id: 'THR-003', name: 'Kavita Das', specialization: SERVICE_TYPE.COSMETIC, available: false },
];

// --- Packages ---
/** @type {import('./schema').Package[]} */
export const packages = [
  {
    id: 'PKG-001', name: 'Hair Rejuvenation Pack', serviceType: SERVICE_TYPE.HAIR,
    totalSessions: 10, usedSessions: 4, price: 15000, patientId: 'PAT-001',
    validUntil: dayOffset(90), status: PACKAGE_STATUS.ACTIVE,
  },
  {
    id: 'PKG-002', name: 'Skin Glow Package', serviceType: SERVICE_TYPE.SKIN,
    totalSessions: 6, usedSessions: 6, price: 9000, patientId: 'PAT-002',
    validUntil: dayOffset(-10), status: PACKAGE_STATUS.COMPLETED,
  },
];

// --- Appointments (30 comprehensive mock records spread across dates) ---
/** @type {import('./schema').Appointment[]} */
export const appointments = [
  // Today's Appointments
  {
    id: 'APT-001', patientId: 'PAT-001', patientName: 'Ravi Sharma', patientMobile: '9876543210',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: today(), startTime: '10:00', endTime: '10:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, therapistId: 'THR-001', therapistName: 'Meera Singh',
    isPackage: true, packageId: 'PKG-001', prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.REGISTERED,
    remark: 'PRP session 5 of 10', createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-002', patientId: 'PAT-002', patientName: 'Priya Das', patientMobile: '9123456789',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: today(), startTime: '11:00', endTime: '11:30',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, therapistId: 'THR-002', therapistName: 'Pooja Nath',
    isPackage: false, prePaymentRequired: true, prePaymentAmount: 200,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-003', patientId: 'PAT-003', patientName: 'Amit Bora', patientMobile: '7001234567',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: today(), startTime: '14:00', endTime: '15:00',
    appointmentType: APPOINTMENT_TYPE.PACKAGE, serviceType: SERVICE_TYPE.HAIR_TRANSPLANT,
    visitType: VISIT_TYPE.CLINIC, isPackage: false,
    prePaymentRequired: true, prePaymentAmount: 5000,
    status: APPOINTMENT_STATUS.PAID, leadStatus: LEAD_STATUS.CONVERTED,
    remark: 'FUE procedure — 1200 grafts', createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-004', patientId: 'PAT-004', patientName: 'Sunita Kalita', patientMobile: '8001234567',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: today(), startTime: '15:30', endTime: '16:00',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, therapistId: 'THR-002', therapistName: 'Pooja Nath',
    isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.PENDING, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-005', patientId: 'PAT-006', patientName: 'Neha Gogoi', patientMobile: '9435012345',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: today(), startTime: '16:30', endTime: '17:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false,
    prePaymentRequired: true, prePaymentAmount: 300,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-006', patientId: 'PAT-005', patientName: 'Dipankar Roy', patientMobile: '6001234567',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: today(), startTime: '17:30', endTime: '18:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.HOME, isPackage: false,
    prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    remark: 'Home visit — scalp evaluation', createdAt: now(), updatedAt: now(),
  },

  // Yesterday & Past Days
  {
    id: 'APT-007', patientId: 'PAT-001', patientName: 'Ravi Sharma', patientMobile: '9876543210',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(-1), startTime: '14:00', endTime: '14:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, therapistId: 'THR-001', therapistName: 'Meera Singh',
    isPackage: true, packageId: 'PKG-001', prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.PAID, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-008', patientId: 'PAT-007', patientName: 'Bikash Saikia', patientMobile: '9864098765',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: dayOffset(-1), startTime: '11:00', endTime: '12:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.COSMETIC,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-009', patientId: 'PAT-002', patientName: 'Priya Das', patientMobile: '9123456789',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(-2), startTime: '10:30', endTime: '11:00',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.PAID, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },

  // Future Week Appointments
  {
    id: 'APT-010', patientId: 'PAT-002', patientName: 'Priya Das', patientMobile: '9123456789',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: dayOffset(1), startTime: '11:00', endTime: '11:30',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.COSMETIC,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: true, prePaymentAmount: 500,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-011', patientId: 'PAT-005', patientName: 'Dipankar Roy', patientMobile: '6001234567',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(1), startTime: '10:00', endTime: '10:30',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-012', patientId: 'PAT-006', patientName: 'Neha Gogoi', patientMobile: '9435012345',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(1), startTime: '15:00', endTime: '15:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-013', patientId: 'PAT-003', patientName: 'Amit Bora', patientMobile: '7001234567',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: dayOffset(2), startTime: '13:00', endTime: '13:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR_TRANSPLANT,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CANCELLED, leadStatus: LEAD_STATUS.CONVERTED,
    remark: 'Patient requested rescheduling', createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-014', patientId: 'PAT-007', patientName: 'Bikash Saikia', patientMobile: '9864098765',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(2), startTime: '11:30', endTime: '12:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-015', patientId: 'PAT-004', patientName: 'Sunita Kalita', patientMobile: '8001234567',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(2), startTime: '16:00', endTime: '16:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-016', patientId: 'PAT-001', patientName: 'Ravi Sharma', patientMobile: '9876543210',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(3), startTime: '10:00', endTime: '10:30',
    appointmentType: APPOINTMENT_TYPE.PACKAGE, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: true, packageId: 'PKG-001', prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-017', patientId: 'PAT-002', patientName: 'Priya Das', patientMobile: '9123456789',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(3), startTime: '14:30', endTime: '15:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-018', patientId: 'PAT-006', patientName: 'Neha Gogoi', patientMobile: '9435012345',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: dayOffset(3), startTime: '16:00', endTime: '17:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.COSMETIC,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: true, prePaymentAmount: 1000,
    status: APPOINTMENT_STATUS.PAID, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-019', patientId: 'PAT-005', patientName: 'Dipankar Roy', patientMobile: '6001234567',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(4), startTime: '11:00', endTime: '11:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-020', patientId: 'PAT-003', patientName: 'Amit Bora', patientMobile: '7001234567',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: dayOffset(4), startTime: '15:00', endTime: '16:00',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR_TRANSPLANT,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.CONVERTED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-021', patientId: 'PAT-004', patientName: 'Sunita Kalita', patientMobile: '8001234567',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(5), startTime: '10:30', endTime: '11:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-022', patientId: 'PAT-007', patientName: 'Bikash Saikia', patientMobile: '9864098765',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(5), startTime: '14:00', endTime: '14:30',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-023', patientId: 'PAT-001', patientName: 'Ravi Sharma', patientMobile: '9876543210',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(6), startTime: '11:00', endTime: '11:30',
    appointmentType: APPOINTMENT_TYPE.PACKAGE, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: true, packageId: 'PKG-001', prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-024', patientId: 'PAT-002', patientName: 'Priya Das', patientMobile: '9123456789',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(6), startTime: '16:00', endTime: '16:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-025', patientId: 'PAT-006', patientName: 'Neha Gogoi', patientMobile: '9435012345',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(7), startTime: '10:00', endTime: '10:30',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-026', patientId: 'PAT-005', patientName: 'Dipankar Roy', patientMobile: '6001234567',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: dayOffset(7), startTime: '15:30', endTime: '16:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.COSMETIC,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-027', patientId: 'PAT-003', patientName: 'Amit Bora', patientMobile: '7001234567',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(8), startTime: '12:00', endTime: '12:30',
    appointmentType: APPOINTMENT_TYPE.FOLLOWUP, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-028', patientId: 'PAT-007', patientName: 'Bikash Saikia', patientMobile: '9864098765',
    doctorId: 'DOC-001', doctorName: 'Dr. Sarah Paul',
    date: dayOffset(8), startTime: '14:00', endTime: '14:30',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.SKIN,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-029', patientId: 'PAT-004', patientName: 'Sunita Kalita', patientMobile: '8001234567',
    doctorId: 'DOC-003', doctorName: 'Dr. Ananya Bose',
    date: dayOffset(9), startTime: '11:00', endTime: '12:00',
    appointmentType: APPOINTMENT_TYPE.NEW, serviceType: SERVICE_TYPE.COSMETIC,
    visitType: VISIT_TYPE.CLINIC, isPackage: false, prePaymentRequired: true, prePaymentAmount: 500,
    status: APPOINTMENT_STATUS.CONFIRMED, leadStatus: LEAD_STATUS.NEW,
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 'APT-030', patientId: 'PAT-001', patientName: 'Ravi Sharma', patientMobile: '9876543210',
    doctorId: 'DOC-002', doctorName: 'Dr. Rajesh Kumar',
    date: dayOffset(10), startTime: '10:00', endTime: '10:30',
    appointmentType: APPOINTMENT_TYPE.PACKAGE, serviceType: SERVICE_TYPE.HAIR,
    visitType: VISIT_TYPE.CLINIC, isPackage: true, packageId: 'PKG-001', prePaymentRequired: false, prePaymentAmount: 0,
    status: APPOINTMENT_STATUS.SCHEDULED, leadStatus: LEAD_STATUS.REGISTERED,
    createdAt: now(), updatedAt: now(),
  },
];

// --- Staff ---
/** @type {import('./schema').StaffUser} */
export const currentStaff = {
  id: 'STF-001', name: 'Anjali Deka', role: 'Receptionist',
  staffId: 'DRP-R-0042', email: 'anjali@drpaulsclinic.com', mobile: '9000000001',
};
