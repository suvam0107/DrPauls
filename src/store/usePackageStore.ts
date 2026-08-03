import { create } from 'zustand';
import { Package, Appointment } from '../types';
import useAppointmentStore from './useAppointmentStore';
import useDoctorStore from './useDoctorStore';
import { addDays, todayISO } from '../utils/dateUtils';
import { APPOINTMENT_STATUS, LEAD_STATUS } from '../constants';

export interface PackageState {
  packages: Package[];
  fetchPackages: () => void;
  assignPackageToPatient: (params: {
    packageId: string;
    patientId: string;
    patientName: string;
    patientMobile: string;
    doctorId: string;
    centerId: string;
    startDate?: string;
    startTime?: string;
  }) => Appointment[];
  getPackageById: (id: string) => Package | undefined;
}

const seedPackages: Package[] = [
  {
    id: 'PKG-001',
    name: 'Hair Rejuvenation Pack',
    serviceType: 'Hair',
    totalSessions: 10,
    usedSessions: 4,
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
    usedSessions: 6,
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
    usedSessions: 2,
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
    usedSessions: 1,
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
    usedSessions: 3,
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
    usedSessions: 1,
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
    usedSessions: 2,
    price: 16000,
    perSessionPrice: 2666,
    description: 'Precision IPL & Q-Switched laser for pigmentation reduction and skin smoothing.',
    includedServices: ['Q-Switched ND:YAG Laser', 'Cooling Collagen Mask'],
    status: 'Active',
  },
];

const usePackageStore = create<PackageState>((set, get) => ({
  packages: seedPackages,

  fetchPackages: () => {
    set({ packages: seedPackages });
  },

  assignPackageToPatient: ({
    packageId,
    patientId,
    patientName,
    patientMobile,
    doctorId,
    centerId,
    startDate = todayISO(),
    startTime = '11:00',
  }) => {
    const pkg = get().packages.find((p) => p.id === packageId);
    if (!pkg) return [];

    const doctor = useDoctorStore.getState().doctors.find((d) => d.id === doctorId);
    const doctorName = doctor ? doctor.name : 'Doctor';

    const remainingSessions = Math.max(1, pkg.totalSessions - pkg.usedSessions);
    const createdAppointments: Appointment[] = [];

    // Auto-schedule remaining sessions 7 days apart
    for (let i = 0; i < remainingSessions; i++) {
      const sessionDate = addDays(startDate, i * 7);
      const apptData = {
        centerId,
        patientId,
        patientName,
        patientMobile,
        doctorId,
        doctorName,
        date: sessionDate,
        startTime,
        endTime: '11:30',
        appointmentType: 'Package Session',
        serviceType: pkg.serviceType,
        visitType: 'Clinic',
        isPackage: true,
        packageId: pkg.id,
        prePaymentRequired: false,
        prePaymentAmount: 0,
        status: i === 0 ? APPOINTMENT_STATUS.SCHEDULED : APPOINTMENT_STATUS.CONFIRMED,
        leadStatus: LEAD_STATUS.NEW,
        remark: `Auto-scheduled Session ${pkg.usedSessions + i + 1} of ${pkg.totalSessions} (${pkg.name})`,
      };

      const newAppt = useAppointmentStore.getState().addAppointment(apptData);
      createdAppointments.push(newAppt);
    }

    return createdAppointments;
  },

  getPackageById: (id) => get().packages.find((p) => p.id === id),
}));

export default usePackageStore;
