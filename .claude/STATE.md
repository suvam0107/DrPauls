# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-08-04` — Multi-level Sidebar Drawer & Dedicated Package Screens implemented by `@Frontend`. `npx tsc --noEmit` passes with 0 errors.

---

## Current Sprint Focus

### Multi-Level Sidebar Drawer & Package Screen Split (`@Frontend`)
- **`SidebarDrawer.tsx`**: Updated sub-menu item layout so the active selection highlight background stretches edge-to-edge across the **entire width of the drawer** while maintaining exact icon indentation (`paddingLeft: 44`). Added a vertical tree hierarchy guide line (`left: 26`) matching IDE file tree design, smooth Reanimated chevron rotation (`0deg` -> `90deg`), and active accent border highlighting (`borderLeftWidth: 3`).
- **`AvailablePackagesScreen.tsx`** [NEW]: Dedicated treatment packs & subscriptions catalog screen with service filter chips, search bar, and booking sheet integration.
- **`PatientEnrollmentsScreen.tsx`** [NEW]: Dedicated live patient package enrollments screen with status filter chips, progress rings, search bar, and ERP detail sheet integration.
- **`App.tsx`**: Updated router configuration to route `'available-packages'` and `'patient-enrollments'` to their respective screens and pass `currentScreen` state to `SidebarDrawer`.
- **`.claude/ARCHITECTURE.md`**: Updated directory structure tree and Section 5 Navigation Hierarchy documentation.

#### Bug Fixes & UX Enhancements Completed This Session
- `AppointmentDetailModal.tsx` & Packaged Visit Linkage: Implemented automatic package enrollment resolution using `usePackageStore`. Tapping the **"Packaged Treatment Visit" / Package Banner** now dynamically resolves the parent ERP package enrollment record and opens the `PackageEnrollmentDetailSheet` timeline modal directly. Increased `snapHeight` to `560` for spacious layout.
- `PackageEnrollmentDetailSheet.tsx`: Added dedicated **Pause / Resume Confirmation Modal** dialog (`confirmPauseResume`) with warning/success icon badges, explicit confirmation message text, and touch feedback before modifying package state.
- `PackageSessionCard.tsx`: Re-aligned action buttons (**Attended**, **Reschedule**, **Cancel**) and card layout (`borderRadius: 16`, `borderWidth: 1`, `paddingVertical: 9`) to match the exact button styling, color scheme, and typography of `AppointmentDetailModal.tsx`.
- `RescheduleModal.tsx`: Increased `snapHeight` to `580` for comfortable date, doctor, and time slot selection.
- `BottomSheet.tsx`: Fixed modal visibility bug where `@gorhom/bottom-sheet` initialized with index `-1` on mount inside `Modal`, triggering premature `onClose()` calls and preventing modals/sheets from opening. Added `hasOpenedRef` state tracking and delayed mount index snapping.
- `HomeScreen.tsx`: replaced stale `AppRefreshControl` ref with standard `RefreshControl`.
- `PackageSessionCard.tsx`: `StatusChip size="sm"` → `StatusChip small` (correct prop).
- `PatientRecordsScreen.tsx`: `patientPackages` → `patientEnrollments` (correct variable).
- `usePackageStore.ts`: `updateAppointmentStatus` → `updateStatus`, `rescheduleAppointment` → `moveAppointment` (correct `useAppointmentStore` API).

---

## Previous Sprint Focus

### Appointments, Patient Priority & Package Integration (`@Frontend`)
- Dedicated Appointments Screen (`AppointmentsScreen.tsx`) — Today/Yesterday/Custom Range, Doctor/Patient grouping.
- Patient Priority Engine (High/Medium/Low) from reschedule count.
- Patient Past Records Screen (`PatientRecordsScreen.tsx`) with full timeline.
- Original Scheduling Details log + Reschedule Confirmation Dialog.
- Available Packages Directory Screen + Automatic multi-session scheduling.
- Pricing & Service Type Breakdown Card in `CreateAppointmentSheet.tsx`.
- Theme-Aligned `AppRefreshControl` + `useRefresh` hook.
- Navigation cleanup: removed Reports, added `All Appointments` & `Available Packages` in drawer.

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `@gorhom/bottom-sheet`, `react-native-keyboard-controller`, `expo-clipboard` installed
- [x] `react-native-svg` (required by `SessionProgressRing.tsx`)
- [x] `npx tsc --noEmit` — **0 errors** ✓

### Packaged Sessions ERP
- [x] `PackageEnrollment` type & `EnrollmentStatus` union in `src/types/index.ts`
- [x] Enrollment seed data (`assets/data/enrollments.json`)
- [x] API layer: dataStore, handlers, service, barrel export
- [x] `usePackageStore.ts` full lifecycle store
- [x] `SessionProgressRing.tsx` Reanimated SVG component
- [x] `PackageSessionCard.tsx` session action card
- [x] `PackageEnrollmentDetailSheet.tsx` ERP management bottom sheet
- [x] `UpcomingSessionsWidget.tsx` dashboard widget
- [x] `PackagesScreen.tsx` Catalog/Enrollments tabs
- [x] `HomeScreen.tsx` widget + detail sheet integration
- [x] `CreateAppointmentSheet.tsx` enrollment on booking
- [x] `PatientRecordsScreen.tsx` enrollment progress display
- [x] `AppointmentDetailModal.tsx` packaged session banner
- [x] Haptic + sound feedback for session lifecycle events
- [x] All icons via `@expo/vector-icons` Ionicons — no emojis

---

## Blockers
_None_

## Notes
- `npx tsc --noEmit`: **0 errors**.
- No emoji used anywhere in UI — all icons are Ionicons.
- Shift-remaining-sessions behavior is user-selectable (modal prompt on cancel/reschedule).
- Therapist assignment is per-enrollment (set at `enrollPatientInPackage` call time).
- Package catalog is static (read from `packages.json`, no write API needed).
