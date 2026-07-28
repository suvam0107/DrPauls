import { create } from 'zustand';
import { appointments as seed } from '../data/mockData';
import { nextAppointmentId } from '../utils/searchUtils';
import { APPOINTMENT_STATUS } from '../constants';
import { timeToMins, todayISO } from '../utils/dateUtils';

/**
 * Slot map key: "YYYY-MM-DD|HH:mm|doctorId"
 * Value: appointmentId or null
 */
const buildSlotMap = (appts) => {
  const map = {};
  appts.forEach((a) => {
    if (a.status !== APPOINTMENT_STATUS.CANCELLED) {
      map[`${a.date}|${a.startTime}|${a.doctorId}`] = a.id;
    }
  });
  return map;
};

/** Helper to synchronize in-memory seed array so mutations persist permanently */
const syncSeedData = (updatedAppts) => {
  seed.length = 0;
  seed.push(...updatedAppts);
};

const useAppointmentStore = create((set, get) => ({
  appointments: seed,
  slotMap: buildSlotMap(seed),

  /** Add a new appointment */
  addAppointment: (data) => {
    const newAppt = {
      ...data,
      id: nextAppointmentId(get().appointments),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => {
      const updated = [newAppt, ...s.appointments];
      syncSeedData(updated);
      return { appointments: updated, slotMap: buildSlotMap(updated) };
    });
    return newAppt;
  },

  /** Update status of an appointment */
  updateStatus: (id, status) => {
    set((s) => {
      const updated = s.appointments.map((a) =>
        a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
      );
      syncSeedData(updated);
      return { appointments: updated, slotMap: buildSlotMap(updated) };
    });
  },

  /** Move appointment to new date/time (drag-drop or reschedule) - Permanent Persistence */
  moveAppointment: (id, newDate, newStartTime, newEndTime) => {
    set((s) => {
      const updated = s.appointments.map((a) =>
        a.id === id
          ? {
              ...a,
              date: newDate,
              startTime: newStartTime,
              endTime: newEndTime,
              status: APPOINTMENT_STATUS.RESCHEDULED,
              updatedAt: new Date().toISOString(),
            }
          : a
      );
      syncSeedData(updated);
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

    // 2. Interval collision check
    const newStartMins = timeToMins(startTime);
    const newEndMins = timeToMins(endTime);

    const collidingAppt = get().appointments.find((a) => {
      if (a.id === excludeId) return false;
      if (a.status === APPOINTMENT_STATUS.CANCELLED) return false;
      if (a.date !== date) return false;

      const aStartMins = timeToMins(a.startTime);
      const aEndMins = timeToMins(a.endTime);

      // Overlap condition: startA < endB && endA > startB
      return newStartMins < aEndMins && newEndMins > aStartMins;
    });

    if (collidingAppt) {
      return {
        valid: false,
        reason: 'collision',
        collidingAppt,
        message: `Collides with ${collidingAppt.patientName}'s appointment.`,
      };
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
