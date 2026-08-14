import { create } from 'zustand';
import { Package, PackageEnrollment, Appointment, EnrollmentStatus } from '../types';
import useAppointmentStore from './useAppointmentStore';
import useDoctorStore from './useDoctorStore';
import { addDays, todayISO } from '../utils/dateUtils';
import { APPOINTMENT_STATUS, LEAD_STATUS } from '../constants';
import enrollmentsRaw from '../../assets/data/enrollments.json';
import { packageService } from '../api/services/packageService';
import { packageEnrollmentService } from '../api/services/packageEnrollmentService';

export interface EnrollParams {
  packageId: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  doctorId: string;
  centerId: string;
  therapistId?: string;
  therapistName?: string;
  startDate?: string;
  startTime?: string;
  sessionInterval?: number; // days (default 7)
}

export interface PackageState {
  packages: Package[];
  enrollments: PackageEnrollment[];
  getPackageById: (id: string) => Package | undefined;
  getEnrollmentById: (enrollmentId: string) => PackageEnrollment | undefined;
  getEnrollmentsByPatient: (patientId: string) => PackageEnrollment[];
  getActiveEnrollments: () => PackageEnrollment[];
  enrollPatientInPackage: (params: EnrollParams) => Promise<PackageEnrollment>;
  assignPackageToPatient: (params: EnrollParams) => Promise<Appointment[]>;
  markSessionCompleted: (enrollmentId: string, sessionId: string) => Promise<void>;
  cancelSession: (enrollmentId: string, sessionId: string, shiftRemaining?: boolean) => Promise<void>;
  rescheduleSession: (
    enrollmentId: string,
    sessionId: string,
    newDate: string,
    newStartTime: string,
    shiftRemaining?: boolean
  ) => Promise<void>;
  pauseEnrollment: (enrollmentId: string) => Promise<void>;
  resumeEnrollment: (enrollmentId: string, newStartDate: string) => Promise<void>;
}

const seedPackages: Package[] = [
  {
    id: 'PKG-001',
    name: 'Hair Rejuvenation Pack',
    serviceType: 'Hair',
    totalSessions: 10,
    price: 35000,
    perSessionPrice: 3500,
    description: 'Comprehensive hair growth package including GFC therapy & laser bio-stimulation.',
    includedServices: ['GFC Therapy', 'Laser Bio-stimulation', 'Micro-needling'],
    status: 'Active',
  },
  {
    id: 'PKG-002',
    name: 'Skin Glow Package',
    serviceType: 'Skin',
    totalSessions: 6,
    price: 15000,
    perSessionPrice: 2500,
    description: 'Advanced skin brightening & hydrating facial peel sessions.',
    includedServices: ['Chemical Peel', 'HydraFacial', 'Vitamin C Serum Infusion'],
    status: 'Active',
  },
  {
    id: 'PKG-003',
    name: 'Scalp Revitalize Package',
    serviceType: 'Hair',
    totalSessions: 8,
    price: 22000,
    perSessionPrice: 2750,
    description: 'Scalp detox, anti-dandruff therapy and root strengthening.',
    includedServices: ['Scalp Detox', 'Ozone Hair Spa', 'PRP Session'],
    status: 'Active',
  },
  {
    id: 'PKG-004',
    name: 'Anti-Aging Glow Package',
    serviceType: 'Skin',
    totalSessions: 5,
    price: 28000,
    perSessionPrice: 5600,
    description: 'Collagen boosting radiofrequency & HIFU skin tightening treatment.',
    includedServices: ['RF Tightening', 'HIFU Lifting', 'Collagen Mask'],
    status: 'Active',
  },
  {
    id: 'PKG-005',
    name: 'Laser Hair Reduction Pack',
    serviceType: 'Laser',
    totalSessions: 6,
    price: 18000,
    perSessionPrice: 3000,
    description: 'Full face/body triple-wavelength diode laser hair reduction for permanent hair removal.',
    includedServices: ['Diode Laser Session', 'Post-cooling Gel Mask', 'Patch Test'],
    status: 'Active',
  },
  {
    id: 'PKG-006',
    name: 'Follicular Growth Pack',
    serviceType: 'Hair Transplant',
    totalSessions: 4,
    price: 25000,
    perSessionPrice: 6250,
    description: 'Post-transplant GFC (Growth Factor Concentrate) therapy for graft survival and acceleration.',
    includedServices: ['GFC Injections', 'Graft Health Inspection', 'Laser Bio-stimulation'],
    status: 'Active',
  },
  {
    id: 'PKG-007',
    name: 'Laser Smooth Pack',
    serviceType: 'Laser',
    totalSessions: 6,
    price: 16000,
    perSessionPrice: 2666,
    description: 'Precision IPL & Q-Switched laser for pigmentation reduction and skin smoothing.',
    includedServices: ['Q-Switched ND:YAG Laser', 'Cooling Collagen Mask'],
    status: 'Active',
  },
];

const usePackageStore = create<PackageState>((set, get) => ({
  packages: seedPackages,
  enrollments: enrollmentsRaw as PackageEnrollment[],

  getPackageById: (id) => get().packages.find((p) => p.id === id),

  getEnrollmentById: (id) => get().enrollments.find((e) => e.enrollmentId === id),

  getEnrollmentsByPatient: (patientId) =>
    get().enrollments.filter((e) => e.patientId === patientId),

  getActiveEnrollments: () =>
    get().enrollments.filter((e) => e.status === 'Active' || e.status === 'Paused'),

  enrollPatientInPackage: async (params) => {
    const {
      packageId,
      patientId,
      patientName,
      patientMobile,
      doctorId,
      centerId,
      therapistId,
      therapistName,
      startDate = todayISO(),
      startTime = '10:00',
      sessionInterval = 7,
    } = params;

    const pkg = get().getPackageById(packageId);
    if (!pkg) throw new Error(`Package ${packageId} not found`);

    const doctorObj = useDoctorStore.getState().doctors.find((d) => d.id === doctorId);
    const doctorName = doctorObj ? doctorObj.name : 'Duty Doctor';

    const enrollments = get().enrollments;
    const maxId = enrollments.reduce((m, e) => {
      const n = parseInt(e.enrollmentId.replace('ENR-', ''), 10);
      return !isNaN(n) && n > m ? n : m;
    }, 0);
    const enrollmentId = `ENR-${String(maxId + 1).padStart(3, '0')}`;
    const sessionIds: string[] = [];

    // Auto-schedule appointments spaced by sessionInterval days
    for (let i = 0; i < pkg.totalSessions; i++) {
      const sessionDate = addDays(startDate, i * sessionInterval);
      const apptData = {
        centerId,
        patientId,
        patientName,
        patientMobile,
        doctorId,
        doctorName,
        therapistId,
        therapistName,
        date: sessionDate,
        startTime,
        endTime: '11:30',
        appointmentType: 'Package Session',
        serviceType: pkg.serviceType,
        visitType: 'Clinic',
        isPackage: true,
        packageId: pkg.id,
        enrollmentId,
        sessionNumber: i + 1,
        prePaymentRequired: false,
        prePaymentAmount: 0,
        status: i === 0 ? APPOINTMENT_STATUS.SCHEDULED : APPOINTMENT_STATUS.CONFIRMED,
        leadStatus: LEAD_STATUS.NEW,
        remark: `Session ${i + 1} of ${pkg.totalSessions} (${pkg.name})`,
      };

      const newAppt = await useAppointmentStore.getState().addAppointment(apptData);
      sessionIds.push(newAppt.id);
    }

    const newEnrollment: PackageEnrollment = {
      enrollmentId,
      packageId: pkg.id,
      packageName: pkg.name,
      serviceType: pkg.serviceType,
      patientId,
      patientName,
      patientMobile,
      centerId,
      doctorId,
      doctorName,
      therapistId,
      therapistName,
      startDate,
      sessionInterval,
      totalSessions: pkg.totalSessions,
      completedSessions: 0,
      status: 'Active',
      enrolledAt: new Date().toISOString(),
      sessionIds,
    };

    packageEnrollmentService.add(newEnrollment);
    set((state) => ({ enrollments: [newEnrollment, ...state.enrollments] }));
    return newEnrollment;
  },

  assignPackageToPatient: async (params) => {
    const enrollment = await get().enrollPatientInPackage(params);
    const appointments = useAppointmentStore.getState().appointments;
    return appointments.filter((a) => enrollment.sessionIds.includes(a.id));
  },

  markSessionCompleted: async (enrollmentId, sessionId) => {
    // 1. Update appointment status to Paid
    await useAppointmentStore.getState().updateStatus(sessionId, APPOINTMENT_STATUS.PAID);

    // 2. Increment completedSessions in enrollment
    set((state) => {
      let updatedCompleted = 0;
      let updatedStatus: EnrollmentStatus = 'Active';
      const enrollments = state.enrollments.map((e) => {
        if (e.enrollmentId !== enrollmentId) return e;
        updatedCompleted = Math.min(e.totalSessions, e.completedSessions + 1);
        updatedStatus = updatedCompleted >= e.totalSessions ? 'Completed' : e.status;
        return {
          ...e,
          completedSessions: updatedCompleted,
          status: updatedStatus,
        };
      });
      packageEnrollmentService.update(enrollmentId, {
        completedSessions: updatedCompleted,
        status: updatedStatus,
      });
      return { enrollments };
    });
  },

  cancelSession: async (enrollmentId, sessionId, shiftRemaining = false) => {
    const appointments = useAppointmentStore.getState().appointments;
    const canceledAppt = appointments.find((a) => a.id === sessionId);

    // Mark current session cancelled
    await useAppointmentStore.getState().updateStatus(sessionId, APPOINTMENT_STATUS.CANCELLED);

    if (shiftRemaining && canceledAppt) {
      const enrollment = get().getEnrollmentById(enrollmentId);
      if (!enrollment) return;

      const futureSessionIds = enrollment.sessionIds.slice(
        enrollment.sessionIds.indexOf(sessionId) + 1
      );

      for (const sId of futureSessionIds) {
        const appt = appointments.find((a) => a.id === sId);
        if (appt && appt.status !== APPOINTMENT_STATUS.CANCELLED) {
          const newDate = addDays(appt.date, enrollment.sessionInterval);
          await useAppointmentStore.getState().updateAppointment(sId, { date: newDate });
        }
      }
    }
  },

  rescheduleSession: async (enrollmentId, sessionId, newDate, newStartTime, shiftRemaining = false) => {
    const appointments = useAppointmentStore.getState().appointments;
    const targetAppt = appointments.find((a) => a.id === sessionId);
    if (!targetAppt) return;

    const oldDate = targetAppt.date;

    await useAppointmentStore.getState().moveAppointment(
      sessionId,
      newDate,
      newStartTime,
      targetAppt.endTime
    );

    if (shiftRemaining) {
      const enrollment = get().getEnrollmentById(enrollmentId);
      if (!enrollment) return;

      const [y1, m1, d1] = oldDate.split('-').map(Number);
      const [y2, m2, d2] = newDate.split('-').map(Number);
      const dayDiff = Math.round(
        (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) /
          (1000 * 3600 * 24)
      );

      if (dayDiff !== 0) {
        const futureSessionIds = enrollment.sessionIds.slice(
          enrollment.sessionIds.indexOf(sessionId) + 1
        );
        for (const sId of futureSessionIds) {
          const appt = appointments.find((a) => a.id === sId);
          if (appt && appt.status !== APPOINTMENT_STATUS.CANCELLED) {
            const shiftedDate = addDays(appt.date, dayDiff);
            await useAppointmentStore.getState().updateAppointment(sId, { date: shiftedDate });
          }
        }
      }
    }
  },

  pauseEnrollment: async (enrollmentId) => {
    const enrollment = get().getEnrollmentById(enrollmentId);
    if (!enrollment) return;

    packageEnrollmentService.update(enrollmentId, { status: 'Paused' });

    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.enrollmentId === enrollmentId ? { ...e, status: 'Paused' } : e
      ),
    }));

    // Update future sessions to Pending
    const today = todayISO();
    const appointments = useAppointmentStore.getState().appointments;
    for (const sId of enrollment.sessionIds) {
      const appt = appointments.find((a) => a.id === sId);
      if (appt && appt.date >= today && appt.status !== APPOINTMENT_STATUS.CANCELLED) {
        await useAppointmentStore.getState().updateStatus(sId, APPOINTMENT_STATUS.PENDING);
      }
    }
  },

  resumeEnrollment: async (enrollmentId, newStartDate) => {
    const enrollment = get().getEnrollmentById(enrollmentId);
    if (!enrollment) return;

    packageEnrollmentService.update(enrollmentId, { status: 'Active', startDate: newStartDate });

    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.enrollmentId === enrollmentId ? { ...e, status: 'Active', startDate: newStartDate } : e
      ),
    }));

    // Reschedule uncompleted/pending future sessions starting from newStartDate
    const appointments = useAppointmentStore.getState().appointments;
    const remainingSessionIds = enrollment.sessionIds.filter((sId) => {
      const appt = appointments.find((a) => a.id === sId);
      return appt && appt.status !== APPOINTMENT_STATUS.PAID && appt.status !== APPOINTMENT_STATUS.CANCELLED;
    });

    for (let index = 0; index < remainingSessionIds.length; index++) {
      const sId = remainingSessionIds[index];
      const nextDate = addDays(newStartDate, index * enrollment.sessionInterval);
      await useAppointmentStore.getState().updateAppointment(sId, {
        date: nextDate,
        status: APPOINTMENT_STATUS.CONFIRMED,
      });
    }
  },
}));

export default usePackageStore;
