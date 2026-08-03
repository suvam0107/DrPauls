# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-08-03` — Appointments Directory, Patient Priority Engine, Package Directory, Auto-Scheduling, Theme-Aligned Pull-to-Refresh & ARCHITECTURE.md synchronization completed by `@UXEngineer`.

---

## Current Sprint Focus

### Appointments, Patient Priority & Package Integration (`@Frontend`)
- **Dedicated Appointments Screen (`AppointmentsScreen.tsx`)**:
  - Replaced `PastAppointmentsScreen.tsx` with a unified Appointments Directory.
  - Date filtering: **Today**, **Yesterday**, and **Custom Range** (with interactive Start and End Date pickers).
  - Grouping toggle: **Doctor-wise** vs. **Patient-wise** with total appointment count badges per section.
  - Displays appointments sorted in **descending order of time** (newest date and latest time first).
- **Patient Priority Engine (`usePatientStore.ts`, `PatientListScreen.tsx`, `PatientDetailModal.tsx`, `PatientRecordsScreen.tsx`, `AppointmentsScreen.tsx`)**:
  - Dynamically calculates patient priority based on reschedule count:
    - 0 reschedules -> 🟢 **High Priority** (`#10B981`)
    - 1-2 reschedules -> 🟡 **Medium Priority** (`#F59E0B`)
    - 3+ reschedules -> 🔴 **Low Priority** (`#EF4444`)
  - Highlighted patient cards with prominent 5px left accent borders (`borderLeftWidth: 5`, `borderLeftColor: priorityColor`) and matching 1px border outlines (`borderColor: priorityColor + '40'`) across Patient Directory, Patient Detail Modal, Patient Records Page, and Grouped Appointments.
  - Removed badge pills beside patient names; priority is displayed cleanly as text-only inside `PatientDetailModal.tsx` and `PatientRecordsScreen.tsx` (`Priority: High Priority`).
- **Patient Past Records Screen (`PatientRecordsScreen.tsx`)**:
  - Dedicated screen linked directly from `PatientDetailModal` (`"View Patient Past Records & History"`).
  - Shows full patient header, priority badge, reschedule metrics, active/past packages, and complete appointment timeline.
  - Tapping any past appointment record opens `AppointmentDetailModal.tsx` showing complete visit details and original reschedule log.
- **Original Scheduling Details & Reschedule Confirmation (`RescheduleConfirmationModal.tsx`, `RescheduleModal.tsx`, `DraggableChip.tsx`, `AppointmentDetailModal.tsx`)**:
  - Created reusable theme-aligned `RescheduleConfirmationModal.tsx` popup dialog matching `ExitConfirmationModal` system design.
  - Replaced inline bottom-sheet confirmation step with `RescheduleConfirmationModal` popup overlay when saving changes in `RescheduleModal.tsx`.
  - Integrated `RescheduleConfirmationModal` popup step on calendar Drag-and-Drop release (`DraggableChip.tsx`), prompting confirmation before committing slot moves.
  - Preserves original schedule data (`originalSchedule: { date, startTime, doctorName, rescheduledAt }`) on appointments and increments patient reschedule count.
  - Renders an **Original Schedule Details** log box in `AppointmentDetailModal` for rescheduled appointments.
- **Package Directory & Automatic Multi-Session Scheduling (`PackagesScreen.tsx`, `usePackageStore.ts`, `CreateAppointmentSheet.tsx`)**:
  - Dedicated **Available Packages** screen in the sidebar drawer showing all treatment packs with prices, per-session cost breakdown, session counts, descriptions, and included services.
  - Automatically schedules remaining package sessions at 7-day intervals starting from the selected initial date when booking a package appointment.
- **Updated Create Appointment Page (`CreateAppointmentSheet.tsx`)**:
  - Shows service type auto-selected when package mode is selected.
  - Displays clear pricing breakdown card: Doctor Consultation Fee (Normal visit) vs. Package Total Price and Cost Per Session (Package visit).
- **Theme-Aligned Pull-To-Refresh Component (`AppRefreshControl.tsx`, `useRefresh.ts`, `HomeScreen.tsx`, `AppointmentsScreen.tsx`, `PatientListScreen.tsx`, `DoctorScreen.tsx`, `PackagesScreen.tsx`, `PatientRecordsScreen.tsx`, `CalendarGrid.tsx`)**:
  - Built custom `AppRefreshControl.tsx` component fully aligned with Dr. Paul's Clinic active Theme Tokens (`colors.primary` spinner tint, `colors.card` background container on Android preventing dark mode backdrop bleed, and `colors.textMuted` title label).
  - Created centralized `useRefresh` hook for smooth pull-to-refresh gesture handling and store re-synchronization (`fetchAppointments`, `fetchPatients`, `fetchDoctorsAndTherapists`, `fetchCenters`, `fetchPackages`).
- **Navigation Cleanup (`App.tsx`, `SidebarDrawer.tsx`, `HomeScreen.tsx`)**:
  - Removed `ReportsScreen` from navigation drawer and router as requested.
  - Updated sidebar drawer items: Added `All Appointments` (`appointments`) and `Available Packages` (`packages`).

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `@gorhom/bottom-sheet`, `react-native-keyboard-controller`, `expo-clipboard` installed
- [x] Dedicated Appointments Directory Screen with Today/Yesterday/Custom Range & Doctor/Patient Grouping (`AppointmentsScreen.tsx`)
- [x] Patient Priority Engine (High/Medium/Low) based on reschedule frequency (`usePatientStore.ts`)
- [x] Dedicated Patient Past Records Page (`PatientRecordsScreen.tsx`)
- [x] Original Scheduling Details Log (`AppointmentDetailModal.tsx`, `useAppointmentStore.ts`)
- [x] Reschedule Confirmation Dialog (`RescheduleModal.tsx`)
- [x] Available Packages Directory Screen (`PackagesScreen.tsx`, `usePackageStore.ts`)
- [x] Package Automatic Session Scheduling Engine (`usePackageStore.ts`)
- [x] Pricing & Service Type Breakdown Card (`CreateAppointmentSheet.tsx`)
- [x] Removed Reports screen & updated sidebar navigation (`SidebarDrawer.tsx`, `App.tsx`)
- [x] `npx tsc --noEmit` — 0 errors

---

## Blockers
_None_

## Notes
- `npx tsc --noEmit`: 0 errors.
