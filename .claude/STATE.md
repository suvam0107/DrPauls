# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-07-29` — Disabled appointment creation on past timeslots, low-latency 60fps VSync auto-scroll loop (`requestAnimationFrame`), Week View date header tap-to-switch Day View, patient double-booking prevention, and side-by-side split layout for concurrent appointments.

---

## Current Sprint Focus

### Disabled Appointment Creation on Past Timeslots (`@Frontend`)
- **Past Slot Protection**:
  - Implemented `isPastSlot(dateStr, slotTime)` helper in [`src/utils/dateUtils.ts`](file:///d:/IconWizard/DrPauls/src/utils/dateUtils.ts).
  - Evaluates if a timeslot is earlier than the current date and time.
  - In [`CalendarGrid.tsx`](file:///d:/IconWizard/DrPauls/src/components/calendar/CalendarGrid.tsx), any slot where `isPastSlot(...) === true` has `disabled={true}` and `onPress` disabled, strictly preventing tap to open `CreateAppointmentSheet` for past slots.
  - Applies a subtle past slot background overlay (`isDark ? 'rgba(0,0,0,0.2)' : 'rgba(229,231,235,0.4)'`) to visually signal inactive past timeslots to receptionists.

### Low-Latency Jitter-Free Auto-Scroll Loop (`@Frontend`)
- **VSync-Tethered Motion**:
  - Native `requestAnimationFrame` loop in [`DraggableChip.tsx`](file:///d:/IconWizard/DrPauls/src/components/calendar/DraggableChip.tsx).
  - Fires in lockstep with native screen refresh VSync ticks (60Hz / 90Hz / 120Hz).
  - Synchronizes chip position `pan.setValue` with `scrollRef.current?.scrollTo({ y: nextOffset, animated: false })` on every single VSync tick for smooth, zero-jitter, low-latency scrolling.

### Week View Date Header Tap-to-Switch Day View (`@Frontend`)
- **Direct Navigation**:
  - Wrapped each day cell in the Week View date header row in [`CalendarGrid.tsx`](file:///d:/IconWizard/DrPauls/src/components/calendar/CalendarGrid.tsx) with `TouchableOpacity`.
  - Connected `onDateSelect={handleMonthDateSelect}` in [`CalendarScreen.tsx`](file:///d:/IconWizard/DrPauls/src/screens/CalendarScreen.tsx).
  - Tapping any date in the Week View header row updates `selectedDate` and smoothly switches the active view to Day View for that date.

### Patient Double-Booking Prevention & Multi-Doctor Layout
- **Patient Double-Booking Prevention**:
  - `validateSlot()` in [`useAppointmentStore.ts`](file:///d:/IconWizard/DrPauls/src/store/useAppointmentStore.ts) rejects ANY overlapping timeslot for the same patient across all doctors.
- **Side-by-Side Split Column Layout**:
  - `computeAppointmentLayouts()` in [`src/utils/dateUtils.ts`](file:///d:/IconWizard/DrPauls/src/utils/dateUtils.ts) groups concurrent appointments for different doctors side-by-side in Day & Week views.

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `@react-native-async-storage/async-storage` persistent token engine
- [x] Global themed Toast (`AppToast.tsx`) with bottom margin above BottomNav
- [x] Entrypoint `"main": "index.ts"` in `package.json`
- [x] `npx tsc --noEmit` — 0 errors
- [x] `npx expo-doctor` — 18/18 checks pass

### Components & Screens (@Frontend & @DataEngineer)
- [x] `dateUtils.ts` — `isPastSlot()` helper and `computeAppointmentLayouts()` side-by-side cluster math.
- [x] `CalendarGrid.tsx` — Past timeslot tap disabled with subtle styling; Week View header touchable date cells.
- [x] `DraggableChip.tsx` — Low-latency 60fps `requestAnimationFrame` VSync auto-scroll loop with synchronized chip motion.
- [x] `CalendarScreen.tsx` — `onDateSelect` switches to Day View mode on date tap.
- [x] `useAppointmentStore.ts` — `validateSlot` enforces doctor interval collision AND patient double-booking prevention.

---

## Blockers
_None_

## Notes
- `npx expo-doctor`: 18/18 checks pass.
- `npx tsc --noEmit`: 0 errors.
- Past timeslot creation strictly disabled visually and functionally.
