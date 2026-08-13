# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-08-13` — Completed **Session Card Action Logic & Modal Toast Layer Architecture**:
1. **Package Session Card Exact Action Logic (`PackageSessionCard.tsx`)**:
   - **Past Sessions (`date < today`)**: No action buttons rendered (`showActions = false`). Past un-attended sessions remain marked as Overdue.
   - **Current Date Session (`date === today`) AFTER/AT Timeslot**: Displays **Attended**, **Reschedule**, and **Cancel** buttons.
   - **Current Date Session (`date === today`) BEFORE Timeslot**: Displays **Reschedule** and **Cancel** buttons ONLY (No Attended button).
   - **Future Sessions (`date > today`)**: Displays **Reschedule** and **Cancel** buttons ONLY (No Attended button). Future sessions are NEVER marked as unattended or overdue.
   - **Paid / Cancelled Sessions**: No action buttons rendered.
2. **Modal Toast Layer Architecture (`AppToast.tsx`, `PackageEnrollmentDetailSheet`, `AppointmentDetailModal`, `RescheduleModal`, `PatientDetailModal`, `DoctorDetailModal`)**: Mounted `<AppToast />` directly inside active modal container layers with max elevation (`elevation: 999999`, `zIndex: 999999`). Toasts triggered during modal interactions now display at top z-index directly on top of active modals without blocking touch gestures.
3. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.
2. **Scroll-Driven Navbar Translation**: Built `useScrollNavbar` hook and animated `translateY` transform (`120px` hide / `0px` show via `withTiming`) on `BottomNav.tsx`. Attached `onScroll` handlers across all scrollable screens & grids (`HomeScreen`, `CalendarScreen`, `CalendarGrid`, `MonthGrid`, `AppointmentsScreen`, `PatientListScreen`, `DoctorScreen`, `AvailablePackagesScreen`, `PatientEnrollmentsScreen`, `ReportsScreen`).
2. **PredictiveBack Removal**: Completely removed all PredictiveBack wrappers, context provider, custom hooks (`PredictiveBackContext.tsx`, `usePredictiveBack.ts`, `PredictiveBackWrapper.tsx`), and usages across 10 modal/sheet components. Retained `enableOnBackInvokedCallback: true` in `app.json`.
3. **Standard Android BackHandler**: Replaced predictive back logic in `App.tsx` with a standard React Native `BackHandler` hardware back button listener that pops the screen history stack or opens `ExitConfirmationModal` on root.
4. **Navigation Architecture**: Per-tab animated spring pill highlights (`TabItem` in `BottomNav.tsx`) with `scaleX` expansion and `withSpring` physics matching WhatsApp tab bar design. Hidden cleanly on `SettingsScreen`.
5. **QuickAdd Popup Positioning**: Re-anchored `QuickAddPopup` to bottom-right (`alignItems: 'flex-end'`, `paddingRight: 16`), aligned above the `[+]` FAB circle button.
6. **Reliability Terminology & Standardization**: Standardized "Reliability" tier terminology across `PatientListScreen`, `PatientDetailModal`, and `PatientRecordsScreen`. Fixed color tokens (`#10B981` High, `#F59E0B` Medium, `#EF4444` Low). Converted filter chips to pill-shaped elements (`borderRadius: 20`) with flex-shrink layout to eliminate sort button overlap.
7. **HomeScreen Schedule Completion**: Rendered all non-zero status count badges (`Total`, `Confirmed`, `Paid`, `Pending`, `Scheduled`, `Rescheduled`, `Cancelled`) using theme tokens (`colors.*`) and pill-shaped styling.
8. **Calendar Drag Handle**: Replaced icon with `⋮⋮` text character, hidden for non-draggable/cancelled appointments via `isDraggable={isEligible}` prop.
9. **Appointments Directory Filter Overhaul**: Added full status chip row (`All`, `Scheduled`, `Confirmed`, `Paid`, `Pending`, `Rescheduled`, `Overdue`, `Unattended`, `Cancelled`). Fixed global scan logic for `Overdue` & `Unattended` to search across all dates.
10. **Status Engine Audit (`StatusChip.tsx`)**: Disentangled `Pending`, `Overdue`, and `Unattended`. Active pending items display Amber **Pending**, past pending items evaluate to Red **Overdue**, and past confirmed/scheduled unfulfilled items evaluate to Rose **Unattended**.
11. **JSON Seed Database Audit**: Audited `assets/data/*.json` and seeded explicit `Unattended` (`APT-008`) and `Overdue` (`APT-020`) records for comprehensive test coverage.
12. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors** across the entire codebase.

---

## Current Sprint Focus

### TanStack Query Migration (`@DataEngineer`, `@Frontend`, `@UXEngineer`)

**Goal**: Replace all Zustand `fetch*` methods and `loading` flags with TanStack Query (`useQuery` / `useMutation`). Zustand retains all write-through mutation logic.

**Decisions locked & implemented**:
- `staleTime = 2 min`, `gcTime = 10 min`, `refetchOnWindowFocus = false`
- Entity list queries use `initialData: dataStore.getData().[entity]` for zero-flicker instant render
- Detail/secondary queries (e.g. `useEnrollmentsByPatientQuery`, `useStaffQuery`) use skeleton loading
- Mutation cascade logic stays in Zustand stores; `useMutation` wraps the store action and calls `queryClient.invalidateQueries()` on success
- **TypeScript Gate Passed**: `npx tsc --noEmit` returns 0 errors across the entire codebase.

**Phase Status**:
- [x] **Phase 0** — Installed `@tanstack/react-query` v5 (`@DataEngineer`)
- [x] **Phase 1** — `src/api/queryClient.ts` + `QueryClientProvider` wrapper in `App.tsx` (`@DataEngineer` / `@Frontend`)
- [x] **Phase 2** — `src/api/queryKeys.ts` centralized key factory (`@DataEngineer`)
- [x] **Phase 3** — `src/hooks/queries/` — all custom `useQuery` hooks created (`@DataEngineer`)
- [x] **Phase 4** — `src/hooks/mutations/` — all custom `useMutation` hooks created (`@DataEngineer`)
- [x] **Phase 5** — Stripped `fetch*` + `loading` from all Zustand stores (`@DataEngineer`)
- [x] **Phase 6** — `useRefresh.ts` → `queryClient.invalidateQueries()` (`@DataEngineer`)
- [x] **Phase 7** — Screen + component consumer migration completed (`@Frontend`)
  - [x] `HomeScreen.tsx` → `useAppointmentsQuery`, `usePatientsQuery`, `useDoctorsQuery`
  - [x] `CalendarScreen.tsx` → `useAppointmentsQuery`, `useDoctorsQuery`
  - [x] `AppointmentsScreen.tsx` → `useAppointmentsQuery`, `useDoctorsQuery`, `usePatientsQuery`
  - [x] `PatientListScreen.tsx` → `usePatientsQuery`, `searchPatients`
  - [x] `PatientRecordsScreen.tsx` → `usePatientsQuery`, `useAppointmentsQuery`, `usePackagesQuery`, `useEnrollmentsQuery`
  - [x] `DoctorScreen.tsx` → `useDoctorsQuery`
  - [x] `AvailablePackagesScreen.tsx` → `usePackagesQuery`
  - [x] `PatientEnrollmentsScreen.tsx` → `useEnrollmentsQuery`, `useAppointmentsQuery`
  - [x] `ReportsScreen.tsx` → `useAppointmentsQuery`, `usePatientsQuery`, `useDoctorsQuery`, `usePackagesQuery`, `useEnrollmentsQuery`
  - [x] `SettingsScreen.tsx` → `useCentersQuery`, `useStaffQuery`
  - [x] `CreateAppointmentSheet.tsx` → `useDoctorsQuery`, `useTherapistsQuery`, `useCentersQuery`, `usePackagesQuery`, `useAppointmentsQuery`, `useAddAppointmentMutation`, `useEnrollPatientMutation`
  - [x] `AddPatientSheet.tsx` → `useAddPatientMutation`
  - [x] `AddDoctorSheet.tsx` → `useCentersQuery`, `useAddDoctorMutation`
  - [x] `CenterSwitchSheet.tsx` → `useCentersQuery`
  - [x] `Header.tsx` → `useCentersQuery`
  - [x] `RescheduleModal.tsx` → `useDoctorsQuery`, `useMoveAppointmentMutation`
  - [x] `AppointmentDetailModal.tsx` → `usePatientsQuery`, `useCentersQuery`, `useEnrollmentsQuery`, `useUpdateStatusMutation`, `useCancelAppointmentMutation`
  - [x] `UpcomingSessionsWidget.tsx` → `useEnrollmentsQuery`, `useAppointmentsQuery`
  - [x] `PackageEnrollmentDetailSheet.tsx` → `useEnrollmentsQuery`, `useAppointmentsQuery`, `useMarkSessionCompletedMutation`, `useCancelSessionMutation`, `usePauseEnrollmentMutation`, `useResumeEnrollmentMutation`
  - [x] `DoctorDetailModal.tsx` → `useUpdateDoctorMutation`
- [x] **Phase 8** — `npx tsc --noEmit` — 0 errors verified (`@DataEngineer`, `@Frontend`, `@UXEngineer`)
- [x] **Phase 9** — Updated `ARCHITECTURE.md` + `STATE.md` (`@DataEngineer`)
- [x] **UX Audit** — Verified skeleton loaders & mutation `isPending` states (`@UXEngineer`)

**Created files**:
```
src/api/queryClient.ts
src/api/queryKeys.ts
src/hooks/queries/useAppointmentsQuery.ts
src/hooks/queries/usePatientsQuery.ts
src/hooks/queries/useDoctorsQuery.ts
src/hooks/queries/useCentersQuery.ts
src/hooks/queries/usePackagesQuery.ts
src/hooks/queries/useStaffQuery.ts
src/hooks/mutations/useAppointmentMutations.ts
src/hooks/mutations/usePatientMutations.ts
src/hooks/mutations/useDoctorMutations.ts
src/hooks/mutations/usePackageMutations.ts
```

**Modified files**:
```
App.tsx                          — QueryClientProvider wrapper, removed fetchCenters() useEffect
src/store/useAppointmentStore.ts — Stripped loading & fetchAppointments
src/store/usePatientStore.ts     — Stripped loading & fetchPatients
src/store/useDoctorStore.ts      — Stripped loading & fetchDoctorsAndTherapists
src/store/useCenterStore.ts      — Stripped fetchCenters
src/store/usePackageStore.ts     — Stripped loading, fetchPackages, fetchEnrollments
src/utils/useRefresh.ts          — queryClient.invalidateQueries() instead of store.fetch*()
src/screens/HomeScreen.tsx
src/screens/CalendarScreen.tsx
src/screens/AppointmentsScreen.tsx
src/screens/PatientListScreen.tsx
src/screens/PatientRecordsScreen.tsx
src/screens/DoctorScreen.tsx
src/screens/AvailablePackagesScreen.tsx
src/screens/PatientEnrollmentsScreen.tsx
src/screens/ReportsScreen.tsx
src/screens/SettingsScreen.tsx
src/components/Header.tsx
src/components/appointment/CreateAppointmentSheet.tsx
src/components/appointment/AddPatientSheet.tsx
src/components/doctor/AddDoctorSheet.tsx
src/components/doctor/DoctorDetailModal.tsx
src/components/shared/CenterSwitchSheet.tsx
src/components/calendar/RescheduleModal.tsx
src/components/calendar/AppointmentDetailModal.tsx
src/components/package/UpcomingSessionsWidget.tsx
src/components/package/PackageEnrollmentDetailSheet.tsx
```

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `@gorhom/bottom-sheet`, `react-native-keyboard-controller`, `expo-clipboard` installed
- [x] `react-native-svg` (required by `SessionProgressRing.tsx`)
- [x] `@tanstack/react-query` v5 installed
- [x] All screens & components type-checked with zero errors (`npx tsc --noEmit`)

### TanStack Query Migration
- [x] Package installed
- [x] QueryClient + Provider configured
- [x] Query key registry created (`src/api/queryKeys.ts`)
- [x] All `useQuery` hooks created (`src/hooks/queries/`)
- [x] All `useMutation` hooks created (`src/hooks/mutations/`)
- [x] Zustand stores stripped of `fetch*` / `loading`
- [x] `useRefresh.ts` updated with `queryClient.invalidateQueries()`
- [x] All screens & components migrated
- [x] Zero TypeScript errors (`npx tsc --noEmit`)

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
- **TanStack Query rule**: Never call store `fetch*` methods from screens. Never read store `loading` flags. Use hooks from `src/hooks/queries/` and `src/hooks/mutations/` only.
- **TSC gate**: `npx tsc --noEmit` verified with **0 errors**.
