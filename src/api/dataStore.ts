/**
 * In-Memory Data Store for Dr. Paul's Clinic
 * Hydrated from static JSON files under assets/data/ at startup.
 * Maintains state across API operations during the app runtime session.
 */

import patientsRaw from '../../assets/data/patients.json';
import doctorsRaw from '../../assets/data/doctors.json';
import therapistsRaw from '../../assets/data/therapists.json';
import packagesRaw from '../../assets/data/packages.json';
import appointmentsRaw from '../../assets/data/appointments.json';
import staffRaw from '../../assets/data/staff.json';
import centersRaw from '../../assets/data/centers.json';
import enrollmentsRaw from '../../assets/data/enrollments.json';

import { Patient, Doctor, Therapist, Package, PackageEnrollment, Appointment, StaffUser, Center } from '../types';
import { todayISO, offsetDate } from '../utils/dateUtils';

export interface InMemoryStoreData {
  patients: Patient[];
  doctors: Doctor[];
  therapists: Therapist[];
  packages: Package[];
  enrollments: PackageEnrollment[];
  appointments: Appointment[];
  staff: StaffUser;
  centers: Center[];
}

const buildInitialStore = (): InMemoryStoreData => {
  const today = todayISO();
  const nowISO = new Date().toISOString();

  // Hydrate packages with dynamic dates from dayOffset
  const packages: Package[] = (packagesRaw as any[]).map((pkg) => {
    const { dayOffset, ...rest } = pkg;
    return {
      ...rest,
      validUntil: typeof dayOffset === 'number' ? offsetDate(today, dayOffset) : rest.validUntil,
    };
  });

  // Hydrate appointments with dynamic dates from dayOffset
  const appointments: Appointment[] = (appointmentsRaw as any[]).map((apt) => {
    const { dayOffset, ...rest } = apt;
    return {
      ...rest,
      centerId: rest.centerId || 'CC-001',
      date: typeof dayOffset === 'number' ? offsetDate(today, dayOffset) : rest.date || today,
      createdAt: rest.createdAt || nowISO,
      updatedAt: rest.updatedAt || nowISO,
    };
  });

  const enrollments: PackageEnrollment[] = [...(enrollmentsRaw as PackageEnrollment[])];

  return {
    patients: [...(patientsRaw as Patient[])],
    doctors: [...(doctorsRaw as Doctor[])],
    therapists: [...(therapistsRaw as Therapist[])],
    packages,
    enrollments,
    appointments,
    staff: { ...(staffRaw as StaffUser) },
    centers: [...(centersRaw as Center[])],
  };
};

class DataStoreSingleton {
  private data: InMemoryStoreData;

  constructor() {
    this.data = buildInitialStore();
  }

  public getData(): InMemoryStoreData {
    return this.data;
  }

  public reset(): void {
    this.data = buildInitialStore();
  }
}

export const dataStore = new DataStoreSingleton();
