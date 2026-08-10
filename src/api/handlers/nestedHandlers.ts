/**
 * Nested API Handlers (Relational & Composed Queries)
 */

import { dataStore } from '../dataStore';
import { APPOINTMENT_STATUS } from '../../constants';
import { todayISO } from '../../utils/dateUtils';
import { searchPatients } from '../../utils/searchUtils';

export const nestedHandlers = {
  get_appointments_by_date: (payload: { date: string; statuses?: string[] }) => {
    const appointments = dataStore.getData().appointments;
    const { date, statuses } = payload;
    let filtered = appointments.filter(
      (a) => a.date === date && a.status !== APPOINTMENT_STATUS.CANCELLED
    );
    if (statuses && statuses.length > 0) {
      filtered = filtered.filter((a) => statuses.includes(a.status));
    }
    return filtered;
  },

  get_appointments_by_range: (payload: { startDate: string; endDate: string }) => {
    const appointments = dataStore.getData().appointments;
    const { startDate, endDate } = payload;
    return appointments
      .filter(
        (a) =>
          a.date >= startDate &&
          a.date <= endDate &&
          a.status !== APPOINTMENT_STATUS.CANCELLED
      )
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  },

  get_appointments_for_date_and_doctor: (payload: {
    date: string;
    doctorId?: string | null;
  }) => {
    const appointments = dataStore.getData().appointments;
    const { date, doctorId } = payload;
    const forDate = appointments.filter(
      (a) => a.date === date && a.status !== APPOINTMENT_STATUS.CANCELLED
    );
    return doctorId ? forDate.filter((a) => a.doctorId === doctorId) : forDate;
  },

  search_patients: (payload: { query: string }) => {
    const patients = dataStore.getData().patients;
    return searchPatients(patients, payload.query);
  },

  search_packages: (payload: { query: string; serviceType?: string }) => {
    const packages = dataStore.getData().packages;
    const { query, serviceType } = payload;
    const q = query.trim().toLowerCase();
    return packages.filter((pkg) => {
      const matchesService = !serviceType || serviceType === 'All' || pkg.serviceType === serviceType;
      const matchesQuery =
        pkg.name.toLowerCase().includes(q) ||
        pkg.serviceType.toLowerCase().includes(q) ||
        (pkg.description ? pkg.description.toLowerCase().includes(q) : false);
      return matchesService && matchesQuery;
    });
  },

  search_appointments_by_query: (payload: { query: string; startDate?: string; endDate?: string }) => {
    const appointments = dataStore.getData().appointments;
    const { query, startDate, endDate } = payload;
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      const inRange =
        !startDate || !endDate
          ? true
          : a.date >= startDate && a.date <= endDate;
      const matchesQuery =
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.patientMobile.includes(q) ||
        a.serviceType.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q);
      return inRange && matchesQuery;
    });
  },

  search_enrollments: (payload: { query: string; status?: string }) => {
    const enrollments = dataStore.getData().enrollments;
    const { query, status } = payload;
    const q = query.trim().toLowerCase();
    return enrollments.filter((e) => {
      const matchesStatus = !status || status === 'All' || e.status === status;
      const matchesQuery =
        e.patientName.toLowerCase().includes(q) ||
        e.packageName.toLowerCase().includes(q) ||
        e.enrollmentId.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  },

  get_appointment_with_details: (payload: { id: string }) => {
    const store = dataStore.getData();
    const appt = store.appointments.find((a) => a.id === payload.id);
    if (!appt) return null;

    const patient = store.patients.find((p) => p.id === appt.patientId);
    const doctor = store.doctors.find((d) => d.id === appt.doctorId);

    return {
      ...appt,
      patientDetail: patient || null,
      doctorDetail: doctor || null,
    };
  },

  search_doctors: (payload: { query: string }) => {
    const doctors = dataStore.getData().doctors;
    const q = payload.query.trim().toLowerCase();
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        (d.phone ? d.phone.includes(q) : false) ||
        d.id.toLowerCase().includes(q)
    );
  },

  get_today_stats: () => {
    const store = dataStore.getData();
    const today = todayISO();
    const todayAppts = store.appointments.filter(
      (a) => a.date === today && a.status !== APPOINTMENT_STATUS.CANCELLED
    );

    return {
      todayDate: today,
      totalCount: todayAppts.length,
      scheduledCount: todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.SCHEDULED).length,
      confirmedCount: todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED).length,
      paidCount: todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PAID).length,
      pendingCount: todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length,
      totalPatients: store.patients.length,
      availableDoctorsCount: store.doctors.filter((d) => d.available).length,
    };
  },
};
