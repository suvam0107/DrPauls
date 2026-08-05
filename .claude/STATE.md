# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-08-05` — Overdue / Unattended Past Sessions Status Chip Evaluation completed by `@Frontend`.

---

## Current Sprint Focus

### Overdue / Unattended Past Sessions Status Chip (`@Frontend`)
- **Automatic Overdue Evaluation (`StatusChip.tsx`)**: Enhanced `StatusChip` to accept an optional `date` prop. When an appointment date is in the past (`date < today`) and its status is unsettled (not `Paid` and not `Cancelled`), `StatusChip` dynamically renders an **`Overdue`** badge chip with high-visibility red highlight (`#EF4444` text with tinted background).
- **Constants & Type System (`types/index.ts` & `constants/index.ts`)**: Added `'Overdue'` and `'Unattended'` to `AppointmentStatus` type, `APPOINTMENT_STATUS` constant object, and `STATUS_COLORS` token dictionary.
- **Card & Modal Synchronization ([PackageSessionCard.tsx](file:///c:/Iconwizard/DrPauls/src/components/package/PackageSessionCard.tsx) & [AppointmentDetailModal.tsx](file:///c:/Iconwizard/DrPauls/src/components/calendar/AppointmentDetailModal.tsx))**: Past non-settled session cards in package timelines and appointment detail modals now display the red **`Overdue`** chip with red indicator dots instead of conflicting chips like "Confirmed" or "Scheduled".
- **App-Wide Propagation**: Passed `date={appt.date}` to `StatusChip` across `AppointmentsScreen`, `PatientRecordsScreen`, `PastAppointmentsScreen`, `HomeScreen`, and `CalendarScreen`.

### Patient Past Records & Package Session Timeline Discrepancy Fix (`@Frontend`, `@DataEngineer`)
- **Complete Session Timeline Resolution (`PackageEnrollmentDetailSheet.tsx`)**: Overhauled session list generation logic. Instead of mapping strictly over `enrollment.sessionIds` (which previously left incomplete/generic session cards), `sessionsList` now constructs a complete 1-to-`totalSessions` sequence for every enrollment. Each session looks up its store appointment or dynamically constructs a fallback appointment object with correct dates (spaced by `sessionInterval`), status (`Paid` for completed sessions, `Scheduled`/`Confirmed` for future sessions), therapist, doctor, and service details.
- **Seed Database Hydration (`enrollments.json` & `appointments.json`)**: Populated full `sessionIds` arrays for seed package enrollments (`ENR-001` through `ENR-005`) and added explicit package session appointment records for Ravi Sharma (10 sessions, 4 completed `Paid`), Priya Das (6 completed `Paid`), Amit Bora (8 sessions, 2 `Paid`), Sunita Kalita (5 sessions, 1 `Paid`), and Neha Gogoi (6 sessions, 3 `Paid`).
- **Individual Session Detail Modals**: Tapping on ANY session card in the timeline (past completed sessions or upcoming sessions) triggers `onViewSessionDetails(appointment)`, opening `AppointmentDetailModal` with complete details for that specific session.
- **Patient Past Records Timeline (`PatientRecordsScreen.tsx`)**: In Patient Past Records, the appointment timeline now lists all past completed package sessions along with regular appointments, matching patient history accurately.

### Appointments Directory & Packaged Timeline Navigation Fix (`@Frontend`)
- **Appointments Directory (`AppointmentsScreen.tsx`)**: Fixed packaged appointment banner click behavior. Previously, clicking the packaged treatment banner inside `AppointmentDetailModal` on the Appointments Directory page fell back to showing a Toast (`"Package Enrollment: Linked to Enrollment ID..."`) because `onOpenEnrollmentTimeline` callback was missing and `PackageEnrollmentDetailSheet` was not rendered.
- **Lifted ERP Timeline & Reschedule Modals**: Integrated `PackageEnrollmentDetailSheet` and `RescheduleModal` into `AppointmentsScreen.tsx`, `CalendarScreen.tsx`, `PatientRecordsScreen.tsx`, and `PastAppointmentsScreen.tsx`.
- **Seamless Navigation**: Passing `onOpenEnrollmentTimeline` callback to `AppointmentDetailModal` allows clicking any packaged appointment across all directory screens to seamlessly transition to the full interactive Package ERP Session Timeline sheet (`PackageEnrollmentDetailSheet.tsx`).

### Modal Architecture & Dialog UI Overhaul (`@Frontend`, `@UXEngineer`)
- **Flattened Modal Stack**: Lifted `RescheduleModal` and `AppointmentDetailModal` to screen level as siblings in `PatientEnrollmentsScreen.tsx` and `HomeScreen.tsx`, eliminating 3-level deep Modal nesting bugs.
- **`BottomSheet.tsx`**: Removed `if (!visible) return null` early exit to keep the Modal wrapper mounted during closing animations, fixing open/close flash issues.
- **`RescheduleModal.tsx`**: Moved internal Date Picker `<Modal>` outside of `<BottomSheet>` JSX fragment to render as a top-level sibling, resolving Date Picker invisibility bugs on Android. BottomSheet now stays visible during `RescheduleConfirmationModal` confirmation step.
- **`PackageEnrollmentDetailSheet.tsx`**: Refactored child modal triggers into emitted callbacks (`onRescheduleSession`, `onViewSessionDetails`). Overhauled Pause/Resume and Cancel Session confirmation dialogs to use proper overlay/backdrop touch traps, `statusBarTranslucent`, and solid buttons.
- **`PackageSessionCard.tsx`**: Added `isPast` action button guard so past non-paid sessions don't display action buttons. Added "Today" badge, fixed therapist icon to `body-outline`, and converted action buttons to solid filled semantic colors.
- **Solid Button Design System**: Standardized `ExitConfirmationModal`, `LogoutConfirmationModal`, `RescheduleConfirmationModal`, and `PackageEnrollmentDetailSheet` dialog buttons to use solid `#52525B` (Zinc-600) dark neutral secondary buttons with white text/icons for high contrast across both Light and Dark themes.

### Date Formatting & Reschedule Log Bug Fix (`@DataEngineer`)
- **`dateUtils.ts`**: Updated `formatDate`, `formatDateShort`, and `formatMonthYear` to isolate `YYYY-MM-DD` via `d.split('T')[0].split(' ')[0]` before parsing, preventing `NaN` / `Invalid Date` when processing ISO 8601 timestamp strings (e.g. `"2026-08-04T17:34:01.123Z"`).
- **`PatientRecordsScreen.tsx`**: Fixed line 276 where `formatDateShort(appt.originalSchedule.rescheduledAt)` previously rendered `"Invalid Date"`.
- **`AppointmentsScreen.tsx` & `AppointmentDetailModal.tsx`**: Standardized reschedule log date formatting across all appointment detail views.

---

## Previous Sprint Focus

### Multi-Level Sidebar Drawer & Package Screen Split (`@Frontend`)
- Dedicated Packages Catalog (`AvailablePackagesScreen.tsx`) & Patient Enrollments (`PatientEnrollmentsScreen.tsx`).
- Full sub-menu highlight drawer navigation alignment in `SidebarDrawer.tsx`.
- Package enrollment resolution & detail sheet timeline modal links.

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `@gorhom/bottom-sheet`, `react-native-keyboard-controller`, `expo-clipboard` installed
- [x] `react-native-svg` (required by `SessionProgressRing.tsx`)
- [x] All screens & modals type-checked

### Packaged Sessions & Modal System
- [x] Flat screen-level modal hierarchy — no double/triple modal nesting
- [x] `BottomSheet.tsx` keep-alive modal wrapper (no animation flashes)
- [x] `RescheduleModal.tsx` top-level date picker modal
- [x] `PackageEnrollmentDetailSheet.tsx` callback-based child modal trigger
- [x] Solid button design language across confirmation dialogs
- [x] Robust ISO timestamp & date formatting in `dateUtils.ts`
- [x] All icons via `@expo/vector-icons` Ionicons — no emojis

---

## Blockers
_None_

## Notes
- No emoji used anywhere in UI — all icons are Ionicons.
- Shift-remaining-sessions behavior is user-selectable (modal prompt on cancel/reschedule).
- All confirmation dialogs use `statusBarTranslucent`, backdrop touch traps, and solid white-text buttons.
