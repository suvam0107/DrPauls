/**
 * Non-Nested API Handlers (Flat Single-Collection CRUD)
 */

import { dataStore } from '../dataStore';
import { Patient, Doctor, Therapist, Package, PackageEnrollment, Appointment, StaffUser } from '../../types';
import { nextPatientId, nextAppointmentId, nextDoctorId } from '../../utils/searchUtils';

export const nonnestedHandlers = {
  // --- Patients ---
  get_all_patients: () => {
    return [...dataStore.getData().patients];
  },

  get_patient_by_id: (payload: { id: string }) => {
    return dataStore.getData().patients.find((p) => p.id === payload.id);
  },

  add_patient: (payload: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const store = dataStore.getData();
    const newPatient: Patient = {
      ...payload,
      id: nextPatientId(store.patients),
      parentDetails: payload.parentDetails || [],
      therapistDetails: payload.therapistDetails || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.patients = [newPatient, ...store.patients];
    return newPatient;
  },

  update_patient: (payload: { id: string; updates: Partial<Patient> }) => {
    const store = dataStore.getData();
    const index = store.patients.findIndex((p) => p.id === payload.id);
    if (index === -1) throw new Error(`Patient ${payload.id} not found`);
    const updated = {
      ...store.patients[index],
      ...payload.updates,
      updatedAt: new Date().toISOString(),
    };
    store.patients = store.patients.map((p) => (p.id === payload.id ? updated : p));
    return updated;
  },

  delete_patient: (payload: { id: string }) => {
    const store = dataStore.getData();
    store.patients = store.patients.filter((p) => p.id !== payload.id);
    return { id: payload.id };
  },

  // --- Doctors ---
  get_all_doctors: () => {
    return [...dataStore.getData().doctors];
  },

  get_doctor_by_id: (payload: { id: string }) => {
    return dataStore.getData().doctors.find((d) => d.id === payload.id);
  },

  add_doctor: (payload: Omit<Doctor, 'id'>) => {
    const store = dataStore.getData();
    const newDoc: Doctor = {
      ...payload,
      id: nextDoctorId(store.doctors),
      centerSchedule: payload.centerSchedule || [
        {
          centerId: 'CC-001',
          workingDays: payload.workingDays || ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
          workingHours: payload.workingHours || { start: '10:00', end: '19:00' },
        },
      ],
    };
    store.doctors = [newDoc, ...store.doctors];
    return newDoc;
  },

  update_doctor: (payload: { id: string; updates: Partial<Doctor> }) => {
    const store = dataStore.getData();
    const index = store.doctors.findIndex((d) => d.id === payload.id);
    if (index === -1) throw new Error(`Doctor ${payload.id} not found`);
    const updated = {
      ...store.doctors[index],
      ...payload.updates,
    };
    store.doctors = store.doctors.map((d) => (d.id === payload.id ? updated : d));
    return updated;
  },

  // --- Centers ---
  get_all_centers: () => {
    return [...dataStore.getData().centers];
  },

  get_center_by_id: (payload: { id: string }) => {
    return dataStore.getData().centers.find((c) => c.id === payload.id);
  },

  // --- Therapists ---
  get_all_therapists: () => {
    return [...dataStore.getData().therapists];
  },

  get_therapists_by_service: (payload: { serviceType?: string }) => {
    const therapists = dataStore.getData().therapists;
    if (!payload?.serviceType) return [...therapists];
    return therapists.filter((t) => t.specialization === payload.serviceType);
  },

  // --- Packages ---
  get_all_packages: () => {
    return [...dataStore.getData().packages];
  },

  get_package_by_id: (payload: { id: string }) => {
    return dataStore.getData().packages.find((pkg) => pkg.id === payload.id);
  },

  add_package: (payload: Omit<Package, 'id'>) => {
    const store = dataStore.getData();
    const maxId = store.packages.reduce((m, p) => {
      const n = parseInt(p.id.replace('PKG-', ''), 10);
      return n > m ? n : m;
    }, 0);
    const newPkg: Package = {
      ...payload,
      id: `PKG-${String(maxId + 1).padStart(3, '0')}`,
    };
    store.packages = [newPkg, ...store.packages];
    return newPkg;
  },

  update_package: (payload: { id: string; updates: Partial<Package> }) => {
    const store = dataStore.getData();
    const index = store.packages.findIndex((p) => p.id === payload.id);
    if (index === -1) throw new Error(`Package ${payload.id} not found`);
    const updated = { ...store.packages[index], ...payload.updates };
    store.packages = store.packages.map((p) => (p.id === payload.id ? updated : p));
    return updated;
  },

  // --- Package Enrollments ---
  get_all_enrollments: () => {
    return [...dataStore.getData().enrollments];
  },

  get_enrollments_by_patient: (payload: { patientId: string }) => {
    return dataStore.getData().enrollments.filter((e) => e.patientId === payload.patientId);
  },

  get_enrollment_by_id: (payload: { enrollmentId: string }) => {
    return dataStore.getData().enrollments.find((e) => e.enrollmentId === payload.enrollmentId);
  },

  add_enrollment: (payload: Omit<PackageEnrollment, 'enrollmentId' | 'enrolledAt'>) => {
    const store = dataStore.getData();
    const maxId = store.enrollments.reduce((m, e) => {
      const n = parseInt(e.enrollmentId.replace('ENR-', ''), 10);
      return !isNaN(n) && n > m ? n : m;
    }, 0);
    const newEnrollment: PackageEnrollment = {
      ...payload,
      enrollmentId: `ENR-${String(maxId + 1).padStart(3, '0')}`,
      enrolledAt: new Date().toISOString(),
    };
    store.enrollments = [newEnrollment, ...store.enrollments];
    return newEnrollment;
  },

  update_enrollment: (payload: { enrollmentId: string; updates: Partial<PackageEnrollment> }) => {
    const store = dataStore.getData();
    const index = store.enrollments.findIndex((e) => e.enrollmentId === payload.enrollmentId);
    if (index === -1) throw new Error(`Enrollment ${payload.enrollmentId} not found`);
    const updated = { ...store.enrollments[index], ...payload.updates };
    store.enrollments = store.enrollments.map((e) => (e.enrollmentId === payload.enrollmentId ? updated : e));
    return updated;
  },

  // --- Staff ---
  get_staff: () => {
    return dataStore.getData().staff;
  },

  // --- Appointments Flat CRUD ---
  get_all_appointments: () => {
    return [...dataStore.getData().appointments];
  },

  add_appointment: (payload: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const store = dataStore.getData();
    const newAppt: Appointment = {
      ...payload,
      id: nextAppointmentId(store.appointments),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.appointments = [newAppt, ...store.appointments];
    return newAppt;
  },

  update_appointment: (payload: { id: string; updates: Partial<Appointment> }) => {
    const store = dataStore.getData();
    const index = store.appointments.findIndex((a) => a.id === payload.id);
    if (index === -1) throw new Error(`Appointment ${payload.id} not found`);
    const updated = {
      ...store.appointments[index],
      ...payload.updates,
      updatedAt: new Date().toISOString(),
    };
    store.appointments = store.appointments.map((a) => (a.id === payload.id ? updated : a));
    return updated;
  },

  delete_appointment: (payload: { id: string }) => {
    const store = dataStore.getData();
    store.appointments = store.appointments.filter((a) => a.id !== payload.id);
    return { id: payload.id };
  },
};
