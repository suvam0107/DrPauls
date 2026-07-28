import { GRID_START_HOUR, GRID_END_HOUR, SLOT_MINUTES, SLOT_HEIGHT } from '../constants';

// --- Formatting ---
/** Format Date object to "YYYY-MM-DD" in local timezone without UTC shift */
export const formatISODateLocal = (d) => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** "HH:mm" → display "10:30 AM" */
export const formatTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/** "YYYY-MM-DD" → "28 Jul 2026" */
export const formatDate = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** "YYYY-MM-DD" → "Mon, 28 Jul" */
export const formatDateShort = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
};

/** "YYYY-MM-DD" → "July 2026" */
export const formatMonthYear = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  return dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/** Today as "YYYY-MM-DD" in local timezone */
export const todayISO = () => formatISODateLocal(new Date());

/** Offset date by n days, returns "YYYY-MM-DD" */
export const offsetDate = (dateISO, n) => {
  const [y, m, day] = dateISO.split('-').map(Number);
  const d = new Date(y, m - 1, day + n);
  return formatISODateLocal(d);
};

/** Offset date by n months, returns "YYYY-MM-DD" */
export const offsetMonth = (dateISO, n) => {
  const [y, m, day] = dateISO.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return formatISODateLocal(d);
};

/** "HH:mm" → total minutes from midnight */
export const timeToMins = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Total minutes → "HH:mm" */
export const minsToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/** Add minutes to "HH:mm", returns "HH:mm" */
export const addMins = (t, n) => minsToTime(timeToMins(t) + n);

/** Round a time string to nearest SLOT_MINUTES */
export const roundToSlot = (t) => {
  const mins = timeToMins(t);
  const rounded = Math.round(mins / SLOT_MINUTES) * SLOT_MINUTES;
  return minsToTime(rounded);
};

/** Current time rounded to nearest slot as "HH:mm" */
export const currentTimeSlot = () => {
  const now = new Date();
  return roundToSlot(`${now.getHours()}:${now.getMinutes()}`);
};

// --- Calendar slot generation ---
/** Returns array of {time, label} for the grid */
export const generateTimeSlots = () => {
  const slots = [];
  for (let m = GRID_START_HOUR * 60; m < GRID_END_HOUR * 60; m += SLOT_MINUTES) {
    slots.push({ time: minsToTime(m), label: formatTime(minsToTime(m)) });
  }
  return slots;
};

/** Pixel top offset for a given time string within the grid */
export const timeToTopOffset = (t) => {
  const mins = timeToMins(t) - GRID_START_HOUR * 60;
  return (mins / SLOT_MINUTES) * SLOT_HEIGHT;
};

/** Pixel height for duration between start and end time */
export const durationToHeight = (start, end) => {
  const mins = timeToMins(end) - timeToMins(start);
  return Math.max((mins / SLOT_MINUTES) * SLOT_HEIGHT, SLOT_HEIGHT * 0.8);
};

/** Pixel Y offset → nearest slot "HH:mm" */
export const offsetToTime = (offsetY) => {
  const slotIndex = Math.round(offsetY / SLOT_HEIGHT);
  const mins = GRID_START_HOUR * 60 + slotIndex * SLOT_MINUTES;
  const clamped = Math.max(GRID_START_HOUR * 60, Math.min(GRID_END_HOUR * 60 - SLOT_MINUTES, mins));
  return minsToTime(clamped);
};

// --- Week helpers ---
/** Get an array of 7 dates (Sun–Sat) containing the given ISO date */
export const getWeekDates = (isoDate) => {
  const [y, m, day] = isoDate.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const dayOfWeek = d.getDay(); // 0=Sun
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(y, m - 1, day - dayOfWeek + i);
    return formatISODateLocal(dt);
  });
};

/** "YYYY-MM-DD" → weekday short label "Mon" */
export const weekdayLabel = (iso) => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
};

/** "YYYY-MM-DD" → day number "28" */
export const dayNumber = (iso) => parseInt(iso.split('-')[2], 10);

// --- Month Grid Helper ---
/** Generates 35 grid items for a full month matrix in local timezone */
export const getMonthGrid = (isoDate) => {
  const [y, m] = isoDate.split('-').map(Number);
  const targetYear = y;
  const targetMonth = m - 1; // 0-indexed

  const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun

  const grid = [];
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
