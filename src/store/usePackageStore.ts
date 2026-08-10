import { create } from 'zustand';
import { Package, PackageEnrollment, Appointment } from '../types';
import useAppointmentStore from './useAppointmentStore';
import useDoctorStore from './useDoctorStore';
import { addDays, todayISO } from '../utils/dateUtils';
import { APPOINTMENT_STATUS, LEAD_STATUS } from '../constants';
import enrollmentsRaw from '../../assets/data/enrollments.json';
import { packageService } from '../api/services/packageService';

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
  enrollPatientInPackage: (params: EnrollParams) => PackageEnrollment;
  assignPackageToPatient: (params: EnrollParams) => Appointment[];
  markSessionCompleted: (enrollmentId: string, sessionId: string) => void;
  cancelSession: (enrollmentId: string, sessionId: string, shiftRemaining?: boolean) => void;
  rescheduleSession: (
    enrollmentId: string,
    sessionId: string,
    newDate: string,
    newStartTime: string,
    shiftRemaining?: boolean
  ) => void;
  pauseEnrollment: (enrollmentId: string) => void;
  resumeEnrollment: (enrollmentId: string, newStartDate: string) => void;
}

const seedPackages: Package[] = [
  {
    id: 'PKG-001',
    name: 'Hair Rejuvenation Pack',
    serviceType: 'Hair',
    totalSessions: 10,
    price: 15000,
    perSessionPrice: 1500,
    description: 'Advanced PRP scalp therapy + laser helmet stimulation for hair follicle rejuvenation and density improvement.',
    includedServices: ['Scalp PRP Therapy', 'Low-Level Laser Therapy', 'Trico Analysis'],
    status: 'Active',
  },
  {
    id: 'PKG-002',
    name: 'Skin Glow Package',
    serviceType: 'Skin',
    totalSessions: 6,
    price: 9000,
    perSessionPrice: 1500,
    description: 'Deep hydration HydraFacial + Glutathione peel for even skin tone and glowing complexion.',
    includedServices: ['HydraFacial MD', 'Carbon Laser Peel', 'Vitamin C Infusion'],
    status: 'Completed',
  },
  {
    id: 'PKG-003',
    name: 'Scalp Revitalize Package',
    serviceType: 'Hair',
    totalSessions: 8,
    price: 12000,
    perSessionPrice: 1500,
    description: 'Anti-dandruff detox + micro-needling peptide infusion for healthy scalp environment.',
    includedServices: ['Scalp Detox Peel', 'Peptide Micro-needling', 'Oxygen Therapy'],
    status: 'Active',
  },
  {
    id: 'PKG-004',
    name: 'Anti-Aging Glow Package',
    serviceType: 'Skin',
    totalSessions: 5,
    price: 10000,
    perSessionPrice: 2000,
    description: 'RF Collagen tightening + hyaluronic acid mesotherapy for anti-wrinkle skin restoration.',
    includedServices: ['Micro-needling RF', 'Hyaluronic Mesotherapy', 'LED Light Therapy'],
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

  enrollPatientInPackage: (params) => {
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
      startTime = '11:00',
      sessionInterval = 7,
    } = params;

    const pkg = get().packages.find((p) => p.id === packageId);
    if (!pkg) throw new Error('Package not found');

    const doctor = useDoctorStore.getState().doctors.find((d) => d.id === doctorId);
    const doctorName = doctor ? doctor.name : 'Doctor';

    // Generate enrollment ID
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

      const newAppt = useAppointmentStore.getState().addAppointment(apptData);
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

    set((state) => ({ enrollments: [newEnrollment, ...state.enrollments] }));
    return newEnrollment;
  },

  assignPackageToPatient: (params) => {
    const enrollment = get().enrollPatientInPackage(params);
    const appointments = useAppointmentStore.getState().appointments;
    return appointments.filter((a) => enrollment.sessionIds.includes(a.id));
  },

  markSessionCompleted: (enrollmentId, sessionId) => {
    // 1. Update appointment status to Paid
    useAppointmentStore.getState().updateStatus(sessionId, APPOINTMENT_STATUS.PAID);

    // 2. Increment completedSessions in enrollment
    set((state) => {
      const enrollments = state.enrollments.map((e) => {
        if (e.enrollmentId !== enrollmentId) return e;
        const newCompleted = Math.min(e.totalSessions, e.completedSessions + 1);
        const newStatus = newCompleted >= e.totalSessions ? 'Completed' : e.status;
        return {
          ...e,
          completedSessions: newCompleted,
          status: newStatus as any,
        };
      });
      return { enrollments };
    });
  },

  cancelSession: (enrollmentId, sessionId, shiftRemaining = false) => {
    const appointments = useAppointmentStore.getState().appointments;
    const canceledAppt = appointments.find((a) => a.id === sessionId);

    // Mark current session cancelled
    useAppointmentStore.getState().updateStatus(sessionId, APPOINTMENT_STATUS.CANCELLED);

    if (shiftRemaining && canceledAppt) {
      const enrollment = get().getEnrollmentById(enrollmentId);
      if (!enrollment) return;

      const futureSessionIds = enrollment.sessionIds.slice(
        enrollment.sessionIds.indexOf(sessionId) + 1
      );

      futureSessionIds.forEach((sId) => {
        const appt = appointments.find((a) => a.id === sId);
        if (appt && appt.status !== APPOINTMENT_STATUS.CANCELLED) {
          const newDate = addDays(appt.date, enrollment.sessionInterval);
          useAppointmentStore.getState().updateAppointment(sId, { date: newDate });
        }
      });
    }
  },

  rescheduleSession: (enrollmentId, sessionId, newDate, newStartTime, shiftRemaining = false) => {
    const appointments = useAppointmentStore.getState().appointments;
    const targetAppt = appointments.find((a) => a.id === sessionId);
    if (!targetAppt) return;

    const oldDate = targetAppt.date;

    useAppointmentStore.getState().moveAppointment(
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
        futureSessionIds.forEach((sId) => {
          const appt = appointments.find((a) => a.id === sId);
          if (appt && appt.status !== APPOINTMENT_STATUS.CANCELLED) {
            const shiftedDate = addDays(appt.date, dayDiff);
            useAppointmentStore.getState().updateAppointment(sId, { date: shiftedDate });
          }
        });
      }
    }
  },

  pauseEnrollment: (enrollmentId) => {
    const enrollment = get().getEnrollmentById(enrollmentId);
    if (!enrollment) return;

    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.enrollmentId === enrollmentId ? { ...e, status: 'Paused' } : e
      ),
    }));

    // Update future sessions to Pending
    const today = todayISO();
    const appointments = useAppointmentStore.getState().appointments;
    enrollment.sessionIds.forEach((sId) => {
      const appt = appointments.find((a) => a.id === sId);
      if (appt && appt.date >= today && appt.status !== APPOINTMENT_STATUS.CANCELLED) {
        useAppointmentStore.getState().updateStatus(sId, APPOINTMENT_STATUS.PENDING);
      }
    });
  },

  resumeEnrollment: (enrollmentId, newStartDate) => {
    const enrollment = get().getEnrollmentById(enrollmentId);
    if (!enrollment) return;

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

    remainingSessionIds.forEach((sId, index) => {
      const nextDate = addDays(newStartDate, index * enrollment.sessionInterval);
      useAppointmentStore.getState().updateAppointment(sId, {
        date: nextDate,
        status: APPOINTMENT_STATUS.CONFIRMED,
      });
    });
  },
}));

export default usePackageStore;
