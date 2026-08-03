import { create } from 'zustand';
import { appointmentService } from '../api/services/appointmentService';
import { dataStore } from '../api/dataStore';
import { nextAppointmentId } from '../utils/searchUtils';
import { APPOINTMENT_STATUS } from '../constants';
import { timeToMins, todayISO, isDoctorAvailableOnDate, formatDateShort } from '../utils/dateUtils';
import { Appointment } from '../types';
import useDoctorStore from './useDoctorStore';
import useUIStore from './useUIStore';

export interface AppointmentValidationResult {
  valid: boolean;
  reason?: 'past' | 'collision' | 'doctor_unavailable';
  collidingAppt?: Appointment;
  message?: string;
}

export interface ExtendedAppointmentState {
  appointments: Appointment[];
  slotMap: Record<string, string>;
  fetchAppointments: () => Promise<void>;
  addAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Appointment;
  updateStatus: (id: string, status: string) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  moveAppointment: (
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newDoctorId?: string
  ) => void;
  cancelAppointment: (id: string) => void;
  validateSlot: (
    date: string,
    startTime: string,
    endTime: string,
    doctorId: string,
    excludeId?: string
  ) => AppointmentValidationResult;
  isSlotFree: (date: string, startTime: string, doctorId: string, excludeId?: string) => boolean;
  forDate: (date: string) => Appointment[];
  forRange: (startDate: string, endDate: string) => Appointment[];
  forDateFiltered: (date: string, statuses?: string[]) => Appointment[];
  forDateAndDoctor: (date: string, doctorId?: string | null) => Appointment[];
  todayCount: () => number;
  upcoming: () => Appointment[];
}

/**
 * Slot map key: "YYYY-MM-DD|HH:mm|doctorId"
 * Value: appointmentId or null
 */
const buildSlotMap = (appts: Appointment[]): Record<string, string> => {
  const map: Record<string, string> = {};
  appts.forEach((a) => {
    if (a.status !== APPOINTMENT_STATUS.CANCELLED) {
      map[`${a.date}|${a.startTime}|${a.doctorId}`] = a.id;
    }
  });
  return map;
};

const initialSeed = dataStore.getData().appointments;

const useAppointmentStore = create<ExtendedAppointmentState>((set, get) => ({
  appointments: initialSeed,
  slotMap: buildSlotMap(initialSeed),

  fetchAppointments: async () => {
    const fetched = await appointmentService.getAll();
    set({ appointments: fetched, slotMap: buildSlotMap(fetched) });
  },

  /** Add a new appointment */
  addAppointment: (data) => {
    const newAppt: Appointment = {
      ...data,
      id: nextAppointmentId(get().appointments),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Call service to mutate JSON-backed dataStore
    appointmentService.add(data);

    set((s) => {
      const updated = [newAppt, ...s.appointments];
      return { appointments: updated, slotMap: buildSlotMap(updated) };
    });
    return newAppt;
  },

  /** Update status of an appointment */
  updateStatus: (id, status) => {
    appointmentService.update(id, { status });
    set((s) => {
      const updated = s.appointments.map((a) =>
        a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
      );
      return { appointments: updated, slotMap: buildSlotMap(updated) };
    });
  },

  /** Update generic fields of an appointment */
  updateAppointment: (id, updates) => {
    appointmentService.update(id, updates);
    set((s) => {
      const updated = s.appointments.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      );
      return { appointments: updated, slotMap: buildSlotMap(updated) };
    });
  },

  /** Move/reschedule appointment to new date/time - Permanent Persistence & Original Schedule Logging */
  moveAppointment: (id, newDate, newStartTime, newEndTime, newDoctorId) => {
    const appt = get().appointments.find((a) => a.id === id);
    if (!appt) return;

    // Preserve original schedule if not already logged
    const originalSchedule = appt.originalSchedule || {
      date: appt.date,
      startTime: appt.startTime,
      endTime: appt.endTime,
      doctorId: appt.doctorId,
      doctorName: appt.doctorName,
      rescheduledAt: new Date().toISOString(),
    };

    const targetDoctorId = newDoctorId || appt.doctorId;
    const doctorObj = useDoctorStore.getState().doctors.find((d) => d.id === targetDoctorId);
    const targetDoctorName = doctorObj ? doctorObj.name : appt.doctorName;

    const updates: Partial<Appointment> = {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      doctorId: targetDoctorId,
      doctorName: targetDoctorName,
      status: APPOINTMENT_STATUS.RESCHEDULED,
      originalSchedule,
      updatedAt: new Date().toISOString(),
    };

    appointmentService.update(id, updates);

    // Increment patient reschedule count
    if (appt.patientId) {
      const usePatientStore = require('./usePatientStore').default;
      usePatientStore.getState().incrementRescheduleCount(appt.patientId);
    }

    set((s) => {
      const updated = s.appointments.map((a) =>
        a.id === id
          ? {
              ...a,
              ...updates,
            }
          : a
      );
      return { appointments: updated, slotMap: buildSlotMap(updated) };
    });
  },

  /** Cancel appointment */
  cancelAppointment: (id) => get().updateStatus(id, APPOINTMENT_STATUS.CANCELLED),

  /**
   * Validate if a target date/time range is valid & free:
   * 1. Rejects if date/time is earlier than current date & time.
   * 2. Rejects if time range overlaps/collides with any existing active appointment.
   */
  validateSlot: (date, startTime, endTime, doctorId, excludeId) => {
    const now = new Date();
    const today = todayISO();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // 1. Past check
    if (date < today) {
      return { valid: false, reason: 'past', message: 'Cannot reschedule to a past date.' };
    }
    if (date === today) {
      const startMins = timeToMins(startTime);
      if (startMins < currentMins) {
        return { valid: false, reason: 'past', message: 'Cannot reschedule to a past time slot.' };
      }
    }

    // 2. Doctor Availability & Working Hours Check
    const activeCenterId = useUIStore.getState().activeCenterId;
    const doctor = useDoctorStore.getState().doctors.find((d) => d.id === doctorId);

    if (doctor) {
      if (!isDoctorAvailableOnDate(doctor, date, activeCenterId)) {
        return {
          valid: false,
          reason: 'doctor_unavailable',
          message: `${doctor.name} is not available on ${formatDateShort(date)}.`,
        };
      }

      const cSched = doctor.centerSchedule?.find((cs) => cs.centerId === activeCenterId);
      const hours = cSched ? cSched.workingHours : doctor.workingHours;
      if (hours) {
        const newStartMins = timeToMins(startTime);
        const newEndMins = timeToMins(endTime);
        const doctorStartMins = timeToMins(hours.start);
        const doctorEndMins = timeToMins(hours.end);
        if (newStartMins < doctorStartMins || newEndMins > doctorEndMins) {
          return {
            valid: false,
            reason: 'doctor_unavailable',
            message: `${doctor.name} is only available between ${hours.start} and ${hours.end}.`,
          };
        }
      }
    }

    // 2. Doctor interval collision check
    const newStartMins = timeToMins(startTime);
    const newEndMins = timeToMins(endTime);

    const doctorCollision = get().appointments.find((a) => {
      if (a.id === excludeId) return false;
      if (a.status === APPOINTMENT_STATUS.CANCELLED) return false;
      if (a.date !== date) return false;
      if (a.doctorId !== doctorId) return false;

      const aStartMins = timeToMins(a.startTime);
      const aEndMins = timeToMins(a.endTime);

      return newStartMins < aEndMins && newEndMins > aStartMins;
    });

    if (doctorCollision) {
      return {
        valid: false,
        reason: 'collision',
        collidingAppt: doctorCollision,
        message: `Collides with ${doctorCollision.patientName}'s appointment (${doctorCollision.startTime}–${doctorCollision.endTime}).`,
      };
    }

    // 3. Patient Double-Booking Check (A patient strictly cannot have two appointments in the same timeslot)
    const targetAppt = excludeId ? get().appointments.find((a) => a.id === excludeId) : null;
    if (targetAppt) {
      const patientCollision = get().appointments.find((a) => {
        if (a.id === excludeId) return false;
        if (a.status === APPOINTMENT_STATUS.CANCELLED) return false;
        if (a.date !== date) return false;
        if (a.patientId !== targetAppt.patientId && a.patientName !== targetAppt.patientName) return false;

        const aStartMins = timeToMins(a.startTime);
        const aEndMins = timeToMins(a.endTime);

        return newStartMins < aEndMins && newEndMins > aStartMins;
      });

      if (patientCollision) {
        return {
          valid: false,
          reason: 'collision',
          collidingAppt: patientCollision,
          message: `${targetAppt.patientName} already has an appointment at this time (${patientCollision.startTime}–${patientCollision.endTime} with ${patientCollision.doctorName}).`,
        };
      }
    }

    return { valid: true };
  },

  /** Legacy helper retained for backwards compatibility */
  isSlotFree: (date, startTime, doctorId, excludeId) => {
    const key = `${date}|${startTime}|${doctorId}`;
    const occupant = get().slotMap[key];
    return !occupant || occupant === excludeId;
  },

  // --- Selectors ---
  /** Appointments for a specific date */
  forDate: (date) =>
    get().appointments.filter((a) => a.date === date && a.status !== APPOINTMENT_STATUS.CANCELLED),

  /** Appointments for a date range (inclusive) */
  forRange: (startDate, endDate) =>
    get().appointments.filter(
      (a) => a.date >= startDate && a.date <= endDate && a.status !== APPOINTMENT_STATUS.CANCELLED
    ),

  /** Appointments for a date filtered by status list */
  forDateFiltered: (date, statuses) => {
    const all = get().forDate(date);
    if (!statuses || statuses.length === 0) return all;
    return all.filter((a) => statuses.includes(a.status));
  },

  /** Appointments for a date + optional doctorId filter */
  forDateAndDoctor: (date, doctorId) => {
    const all = get().forDate(date);
    return doctorId ? all.filter((a) => a.doctorId === doctorId) : all;
  },

  /** Today's total (non-cancelled) count */
  todayCount: () => get().forDate(todayISO()).length,

  /** Upcoming appointments (future dates, non-cancelled) */
  upcoming: () => {
    const today = todayISO();
    return get().appointments
      .filter((a) => a.date >= today && a.status !== APPOINTMENT_STATUS.CANCELLED)
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  },
}));

export default useAppointmentStore;
