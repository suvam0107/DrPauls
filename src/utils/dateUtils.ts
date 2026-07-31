import { GRID_START_HOUR, GRID_END_HOUR, SLOT_MINUTES, SLOT_HEIGHT, APPOINTMENT_STATUS } from '../constants';
import { Appointment, Doctor, WeekDay } from '../types';

export interface AppointmentLayoutInfo {
  overlapIndex: number;
  totalOverlapCount: number;
}

export interface TimeSlot {
  time: string;
  label: string;
}

export interface MonthGridCell {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
}

// --- Formatting ---
/** Format Date object to "YYYY-MM-DD" in local timezone without UTC shift */
export const formatISODateLocal = (d: Date): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** "HH:mm" → display "10:30 AM" */
export const formatTime = (t: string): string => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/** "YYYY-MM-DD" → "28 Jul 2026" */
export const formatDate = (d: string): string => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** "YYYY-MM-DD" → "Mon, 28 Jul" */
export const formatDateShort = (d: string): string => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
};

/** "YYYY-MM-DD" → "July 2026" */
export const formatMonthYear = (d: string): string => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  return dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/** Today as "YYYY-MM-DD" in local timezone */
export const todayISO = (): string => formatISODateLocal(new Date());

/** Offset date by n days, returns "YYYY-MM-DD" */
export const offsetDate = (dateISO: string, n: number): string => {
  const [y, m, day] = dateISO.split('-').map(Number);
  const d = new Date(y, m - 1, day + n);
  return formatISODateLocal(d);
};

/** Offset date by n months, returns "YYYY-MM-DD" */
export const offsetMonth = (dateISO: string, n: number): string => {
  const [y, m, day] = dateISO.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return formatISODateLocal(d);
};

/** "HH:mm" → total minutes from midnight */
export const timeToMins = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Total minutes → "HH:mm" */
export const minsToTime = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/** Add minutes to "HH:mm", returns "HH:mm" */
export const addMins = (t: string, n: number): string => minsToTime(timeToMins(t) + n);

/** Round a time string to nearest SLOT_MINUTES */
export const roundToSlot = (t: string): string => {
  const mins = timeToMins(t);
  const rounded = Math.round(mins / SLOT_MINUTES) * SLOT_MINUTES;
  return minsToTime(rounded);
};

/** Current time rounded to nearest slot as "HH:mm" */
export const currentTimeSlot = (): string => {
  const now = new Date();
  return roundToSlot(`${now.getHours()}:${now.getMinutes()}`);
};

/** Check if a date + time slot is in the past relative to current date and time */
export const isPastSlot = (dateStr: string, slotTime: string): boolean => {
  const today = todayISO();
  if (dateStr < today) return true;
  if (dateStr > today) return false;

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const slotMins = timeToMins(slotTime);
  return slotMins < currentMins;
};

// --- Calendar slot generation ---
/** Returns array of {time, label} for the grid */
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let m = GRID_START_HOUR * 60; m < GRID_END_HOUR * 60; m += SLOT_MINUTES) {
    slots.push({ time: minsToTime(m), label: formatTime(minsToTime(m)) });
  }
  return slots;
};

/** Pixel top offset for a given time string within the grid */
export const timeToTopOffset = (t: string): number => {
  const mins = timeToMins(t) - GRID_START_HOUR * 60;
  return (mins / SLOT_MINUTES) * SLOT_HEIGHT;
};

/** Pixel height for duration between start and end time */
export const durationToHeight = (start: string, end: string): number => {
  const mins = timeToMins(end) - timeToMins(start);
  return Math.max((mins / SLOT_MINUTES) * SLOT_HEIGHT, SLOT_HEIGHT * 0.8);
};

/** Pixel Y offset → nearest slot "HH:mm" */
export const offsetToTime = (offsetY: number): string => {
  const slotIndex = Math.round(offsetY / SLOT_HEIGHT);
  const mins = GRID_START_HOUR * 60 + slotIndex * SLOT_MINUTES;
  const clamped = Math.max(GRID_START_HOUR * 60, Math.min(GRID_END_HOUR * 60 - SLOT_MINUTES, mins));
  return minsToTime(clamped);
};

// --- Week helpers ---
/** Get an array of 7 dates (Sun–Sat) containing the given ISO date */
export const getWeekDates = (isoDate: string): string[] => {
  const [y, m, day] = isoDate.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const dayOfWeek = d.getDay(); // 0=Sun
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(y, m - 1, day - dayOfWeek + i);
    return formatISODateLocal(dt);
  });
};

/** "YYYY-MM-DD" → weekday short label "Mon" */
export const weekdayLabel = (iso: string): string => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
};

/** "YYYY-MM-DD" → day number "28" */
export const dayNumber = (iso: string): number => parseInt(iso.split('-')[2], 10);

// --- Month Grid Helper ---
/** Generates 35 grid items for a full month matrix in local timezone */
export const getMonthGrid = (isoDate: string): MonthGridCell[] => {
  const [y, m] = isoDate.split('-').map(Number);
  const targetYear = y;
  const targetMonth = m - 1; // 0-indexed

  const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun

  const grid: MonthGridCell[] = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(targetYear, targetMonth, 1 - startingDayOfWeek + i);
    const dateStr = formatISODateLocal(d);
    grid.push({
      date: dateStr,
      dayNum: d.getDate(),
      isCurrentMonth: d.getMonth() === targetMonth,
    });
  }
  return grid;
};

/**
 * Computes side-by-side column positioning for overlapping appointments on a single day.
 * Returns a Map of appointment ID to { overlapIndex, totalOverlapCount }.
 */
export const computeAppointmentLayouts = (appts: Appointment[]): Map<string, AppointmentLayoutInfo> => {
  const layoutMap = new Map<string, AppointmentLayoutInfo>();
  const activeAppts = appts.filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED);

  if (activeAppts.length === 0) return layoutMap;

  // Sort by startTime (mins), then duration descending, then id
  const sorted = [...activeAppts].sort((a, b) => {
    const startA = timeToMins(a.startTime);
    const startB = timeToMins(b.startTime);
    if (startA !== startB) return startA - startB;

    const durA = timeToMins(a.endTime) - startA;
    const durB = timeToMins(b.endTime) - startB;
    if (durA !== durB) return durB - durA;

    return a.id.localeCompare(b.id);
  });

  // Assign columns using greedy algorithm
  const columns: Appointment[][] = [];
  const apptColMap = new Map<string, number>();

  for (const appt of sorted) {
    const startMins = timeToMins(appt.startTime);
    let placed = false;

    for (let c = 0; c < columns.length; c++) {
      const lastInCol = columns[c][columns[c].length - 1];
      const lastEndMins = timeToMins(lastInCol.endTime);

      if (startMins >= lastEndMins) {
        columns[c].push(appt);
        apptColMap.set(appt.id, c);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([appt]);
      apptColMap.set(appt.id, columns.length - 1);
    }
  }

  // Calculate cluster overlap count for each appointment
  for (const appt of sorted) {
    const startMins = timeToMins(appt.startTime);
    const endMins = timeToMins(appt.endTime);

    // Overlapping cluster
    const overlapping = sorted.filter((other) => {
      const oStart = timeToMins(other.startTime);
      const oEnd = timeToMins(other.endTime);
      return startMins < oEnd && endMins > oStart;
    });

    const maxCol = Math.max(...overlapping.map((o) => apptColMap.get(o.id) ?? 0));
    const totalOverlapCount = maxCol + 1;
    const overlapIndex = apptColMap.get(appt.id) ?? 0;

    layoutMap.set(appt.id, { overlapIndex, totalOverlapCount });
  }

  return layoutMap;
};

/**
 * Returns true if doctor works on the given date (weekday check) for a specific center.
 */
export const isDoctorAvailableOnDate = (
  doctor: Doctor | undefined,
  dateStr: string,
  centerId: string
): boolean => {
  if (!doctor) return false;
  const wDay = weekdayLabel(dateStr) as WeekDay;
  const cSched = doctor.centerSchedule?.find((cs) => cs.centerId === centerId);
  const workingDays = cSched ? cSched.workingDays : doctor.workingDays;
  return workingDays ? workingDays.includes(wDay) : false;
};

/**
 * Returns available time slots for a doctor on a given date + center.
 * Respects doctor's centerSchedule, filters past slots if date is today.
 */
export const getDoctorAvailableSlots = (
  doctor: Doctor | undefined,
  dateStr: string,
  centerId: string
): TimeSlot[] => {
  if (!doctor) return [];
  if (!isDoctorAvailableOnDate(doctor, dateStr, centerId)) return [];

  const cSched = doctor.centerSchedule?.find((cs) => cs.centerId === centerId);
  const hours = cSched ? cSched.workingHours : doctor.workingHours;
  if (!hours) return [];

  const startMins = timeToMins(hours.start);
  const endMins = timeToMins(hours.end);

  const slots: TimeSlot[] = [];
  const today = todayISO();
  const isToday = dateStr === today;
  const nowMins = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

  for (let m = startMins; m < endMins; m += SLOT_MINUTES) {
    if (isToday && m < nowMins) {
      continue; // only upcoming timeslot from current timeslot onwards
    }
    const tStr = minsToTime(m);
    slots.push({ time: tStr, label: formatTime(tStr) });
  }

  return slots;
};

/**
 * Returns array of time slots for doctor working hours setup aligned with clinic open & close hours.
 */
export const generateDoctorWorkingHourSlots = (
  clinicStart: string = '10:00',
  clinicEnd: string = '19:00'
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startMins = timeToMins(clinicStart);
  const endMins = timeToMins(clinicEnd);

  for (let m = startMins; m <= endMins; m += SLOT_MINUTES) {
    const tStr = minsToTime(m);
    slots.push({ time: tStr, label: formatTime(tStr) });
  }
  return slots;
};



