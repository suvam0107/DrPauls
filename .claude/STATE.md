# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-08-17` — Completed **Unused Dependencies Cleanup & Permissions Removal (`@DataEngineer`, `@Frontend`)**:
1. **Uninstalled Unused Packages**: Removed `@react-navigation/bottom-tabs`, `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `lucide-react-native`, `expo-contacts`, and `expo-location`.
2. **Explicit Icon Package**: Explicitly installed `@expo/vector-icons@^15.0.3` matching Expo SDK 54 requirements.
3. **Cleaned `app.json` Configuration**:
   - Removed unused location permissions (`ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`).
   - Removed unused contacts permissions (`READ_CONTACTS`, `WRITE_CONTACTS`).
   - Removed `expo-location` and `expo-contacts` config plugins from `plugins` array.
4. **Validation**: `npx depcheck` returned 0 unused dependencies; `npx tsc --noEmit` returned 0 errors.

`2026-08-17` — Completed **React Hook Form + Zod Form Engine Migration (`@DataEngineer`, `@Frontend`, `@UXEngineer`)**:
1. **Installed Form Stack**: Installed `react-hook-form`, `zod`, and `@hookform/resolvers` via Expo SDK 54 package manager.
2. **Domain Schemas (`src/schemas/`)**:
   - `authSchema.ts` (`AuthSchema`, `AuthFormValues`)
   - `patientSchema.ts` (`AddPatientSchema`, `AddPatientFormValues`)
   - `doctorSchema.ts` (`AddDoctorSchema`, `AddDoctorFormValues`)
   - `appointmentSchema.ts` (`CreateAppointmentSchema` with `z.discriminatedUnion` on `activeTab`, `NormalAppointmentSchema`, `PackageAppointmentSchema`)
   - `rescheduleSchema.ts` (`RescheduleSchema`, `RescheduleFormValues`)
   - `index.ts` barrel export
3. **Shared Form Component (`src/components/shared/FormField.tsx`)**: Built a reusable, theme-aware typed `FormField` component for consistent label, required asterisk, input slot, and inline error styling.
4. **Complete Form Migration (5 Form Surfaces)**:
   - `AuthScreen.tsx` — RHF `useForm` + `Controller` with inline field errors and demo account auto-population.
   - `AddPatientSheet.tsx` — RHF `useForm` + `Controller` + `FormField` with phone regex validation and instant reset.
   - `AddDoctorSheet.tsx` — Full 11-field RHF migration with `Controller` for `Select`, `Switch`, and interactive day chip selection.
   - `CreateAppointmentSheet.tsx` — Dual-mode Normal / Package discriminated union schema with patient search, package interval, pricing calculation, and slot conflict guards.
   - `RescheduleModal.tsx` — RHF `useForm` + `Controller` with calendar date picker and doctor availability validations.
5. **Seamless Native Left-to-Right Gradient Shimmer Engine (`SkeletonBox.tsx`)**: Built a continuous, seamless left-to-right gradient sweep in `SkeletonBox.tsx` using `expo-linear-gradient` and `react-native-reanimated`. The beam traverses from strictly `-beamWidth` (off-screen left) to `+layoutWidth` (off-screen right) with transparent gradient feathered borders and cubic bezier momentum easing (`Easing.bezier(0.35, 0, 0.25, 1)`), eliminating any abrupt visual looping or jump.
6. **Deduplicated React Engine**: `npm ls react` returns 0 errors with 100% deduplication to `react@19.1.0`.
7. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors** across the entire codebase.

`2026-08-17` — Fixed **Pie / Donut Slice Touch Angle Alignment (`@Frontend`)**:
1. **Geometric Angle Alignment (`findSliceFromTouch` in `ReportsScreen.tsx`)**:
   - Realigned the canvas touch angle math to match Skia's `Path.arcToOval` layout geometry (which begins at `0°` / 3 o'clock / East and rotates clockwise).
   - Removed the artificial `+90°` offset that previously caused touch events on a slice (e.g. green Confirmed) to incorrectly match the adjacent slice (blue Scheduled).
2. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.

`2026-08-17` — Enhanced **Reports & Analytics Chart Layouts, 45° Tilted Ticks & Interactive Detail Modal (`@Frontend`)**:
1. **Resolved Bar Cut-offs (`ReportsScreen.tsx`)**:
   - Expanded `domainPadding` to `{ left: 36, right: 36, top: 32, bottom: 8 }` (Volume) and `{ left: 40, right: 40, top: 32, bottom: 25 }` (Acquisition) with generous horizontal canvas width formulas.
   - Index `0` and index `n-1` bars and their top count labels now render fully without boundary clipping.
2. **45-Degree Angled Axis Ticks (`ReportsScreen.tsx`)**:
   - Enabled `labelRotate: -45` with `labelOffset: 8` on the Patient Enquiry Source chart.
   - Removed substring truncation so complete channel names render crisply at a 45° angle with increased chart height (`245px`).
3. **Cleaned Pie Slices & Interactive `ChartDetailModal` (`ReportsScreen.tsx`)**:
   - Removed crowded `<Pie.Label>` text overlays from all Polar/Pie charts for clean visual aesthetics.
   - Added interactive tap zones on pie canvases (angular touch detection via `atan2`), donut rings, legend items, lifecycle cards, and bar columns.
   - Created a modal (`ChartDetailModal`) displaying category badge, formatted count, percentage progress bar, and clinical insight.
4. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.

`2026-08-17` — Enhanced **Darker Bottom Navbar & Pill Shadow Elevation (`@Frontend`)**:
1. **Prominent Dark Shadows (`BottomNav.tsx`)**:
   - Replaced muted rgba shadow with deep `#000000` shadow tokens (`shadowOpacity: 0.35` in light mode, `0.85` in dark mode).
   - Increased shadow blur radius and offset (`shadowRadius: 16`, `shadowOffset: { width: 0, height: 8 }`, `elevation: 18`) on `pillContainer` and `fabCircle`.
   - Added drop shadow to inner selection `tabPill` (`elevation: 3`, `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.18`, `shadowRadius: 4`).
2. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.

`2026-08-17` — Enhanced **Bottom Nav FAB Plus Icon Plain Smooth Rotation Animation (`@Frontend`)**:
1. **FAB Plus Icon Smooth Plain Rotation (`BottomNav.tsx`, `App.tsx`)**:
   - Replaced spring physics with a smooth, plain `withTiming` transition (`duration: 220ms`, `Easing.bezier(0.25, 0.1, 0.25, 1)`) from `0deg` to `45deg` on the FAB `+` icon when opened to form an `×`.
   - Smoothly rotates back to `0deg` on popup dismissal without spring bouncing or overshoot.
2. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.

`2026-08-17` — Enhanced **Bottom Navbar Shadow & Dense Spring Icon / Bold Title Micro-Interactions (`@Frontend`)**:
1. **Bottom Nav Shadow Elevation (`BottomNav.tsx`)**:
   - Upgraded floating pill container and `[+]` FAB circle shadows (`elevation: 12`, `shadowRadius: 12`, `shadowOffset: { width: 0, height: 6 }`, theme-adaptive `shadowOpacity` and `shadowColor`).
2. **Dense Spring Icon Animation (`TabItem` in `BottomNav.tsx`)**:
   - Added a dense, tactile spring transform (`scale: 1.15`, `translateY: -1.5` with `damping: 12`, `stiffness: 350`, `mass: 0.5`) to active tab icons when the selection pill expands.
3. **Synchronized Bold Title Micro-Spring (`BottomNav.tsx`)**:
   - Enhanced tab labels to bold `fontWeight: '700'` with a synchronized micro-spring scale (`scale: 1.05`, `translateY: -0.5`) when activated.
4. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.

`2026-08-17` — Fixed **Pull-To-Refresh Invalid Hook / useContext Null Crash (`@UXEngineer` & `@Frontend`)**:
1. **Root Cause Analysis**:
   - Several screens (`HomeScreen`, `ReportsScreen`, `PatientRecordsScreen`, `CalendarScreen`, `PatientListScreen`, `DoctorScreen`, `AvailablePackagesScreen`, `PatientEnrollmentsScreen`, `AppointmentsScreen`) were conditionally rendering full-screen skeleton components when `refreshing === true`.
   - When a user initiated a native pull-to-refresh gesture, the active `<ScrollView>` or `<FlatList>` hosting the active `<RefreshControl>` / `<AppRefreshControl>` was immediately unmounted while the native refresh gesture and event dispatch were active.
   - This tore down the active Fiber tree during gesture handling, corrupting React's internal dispatcher context and throwing `TypeError: Cannot read property 'useContext' of null` / `Invalid hook call`.
2. **Architecture Resolution**:
   - Removed early full-screen skeleton unmounting guards on `refreshing === true` across all screens.
   - Preserved persistent `<ScrollView>` and `<FlatList>` component trees with `<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />` so the native spinner smoothly manages the loading indicator without unmounting the view hierarchy.
   - Connected `CalendarGrid` to consume `refreshing` and `onRefresh` from `CalendarScreen`.
   - Added an unmounted component lifecycle guard (`mountedRef`) in `src/utils/useRefresh.ts` to guarantee clean state updates.
3. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.

`2026-08-17` — Completed **Expo Audio System Mixing Configuration (`@UXEngineer`)**:
1. **Audio Mode Configuration (`App.tsx`, `src/utils/feedback.ts`)**:
   - Initialized `setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' })` from `expo-audio` inside top-level component `App.tsx` and centralized feedback utility module `src/utils/feedback.ts`.
   - Allows UI sound effects and audio feedback to seamlessly mix with background media playback (Spotify, YouTube Music, podcasts) and play during silent mode without interrupting other audio sessions or taking exclusive audio focus.
2. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.

`2026-08-14` — Fixed **Today's Overview Live Indicator Operating Hours Status**:
1. **Dynamic Operating Hours Detection (`HomeScreen.tsx`)**:
   - Integrated `useCentersQuery` to dynamically look up the active clinic's `openHours` (e.g. `10:00`–`19:00`) and `closedDays`.
   - Calculated `isClinicOpen` based on current time (`currentMins`) relative to clinic start/end working hours.
2. **Live Pulsing Dot Color State**:
   - **During Clinic Timing**: Evaluates to Green (`colors.success`).
   - **Before Clinic Timing, After Clinic Timing, or Closed Days**: Evaluates to Red (`colors.danger`).
3. **TypeScript Gate Passed**: `npx tsc --noEmit` returned **0 errors**.
1. **Root Cause Diagnosis**:
   - `nonnestedHandlers.update_appointment` was mutating elements of `store.appointments` in-place, modifying the exact same array reference held in TanStack Query's cache. When `queryClient.invalidateQueries` fired `queryFn` (`appointmentService.getAll()`), TanStack Query compared `oldData === newData` (or structural sharing on the mutated reference), saw no object difference, and suppressed re-renders.
   - `useAppointmentStore` store mutation methods (`moveAppointment`, `updateStatus`, `updateAppointment`, `cancelAppointment`) were firing `appointmentService.update(...)` asynchronously without `await`. In `useAppointmentMutations`, `mutationFn` resolved immediately, causing `onSuccess` invalidations to run before `dataStore` finished updating.
2. **Immutable DataStore & Refetching overhaul (`nonnestedHandlers.ts`, `useAppointmentsQuery.ts`)**:
   - Replaced in-place array element mutations in `nonnestedHandlers.ts` with immutable array replacements (`store.appointments = store.appointments.map(...)`).
   - Ensured all `get_all_*` handlers return a fresh shallow array copy (`[...store.appointments]`).
   - Updated `useAppointmentsQuery` `initialData` to return `[...dataStore.getData().appointments]` shallow array copies so cached data is decoupled from the mutable singleton store instance.
3. **Async Mutation Synchronization (`useAppointmentStore.ts`, `useAppointmentMutations.ts`, `usePackageStore.ts`, `usePackageMutations.ts`)**:
   - Converted store mutation methods (`moveAppointment`, `updateStatus`, `updateAppointment`, `addAppointment`, `cancelAppointment`, `rescheduleSession`, etc.) to `async` functions that `await appointmentService.*` operations.
   - Converted all TanStack `mutationFn` definitions to `async/await` so `onSuccess` invalidations fire strictly after `dataStore` updates resolve.
4. **Result**: Rescheduling an appointment (via modal or calendar drag-and-drop) or pulling to refresh now immediately updates the Calendar Screen and all listening screens in real time without needing to reopen the screen.
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

### React Hook Form + Zod Form Engine Migration
- [x] Installed `react-hook-form`, `zod`, and `@hookform/resolvers`
- [x] Created `src/schemas/` directory with 5 domain schemas and barrel export
- [x] Created `FormField.tsx` shared component for inline error display
- [x] Migrated `AuthScreen.tsx` (Sign In)
- [x] Migrated `AddPatientSheet.tsx` (Quick Patient Registration)
- [x] Migrated `AddDoctorSheet.tsx` (Doctor Registration)
- [x] Migrated `CreateAppointmentSheet.tsx` (Normal & Package Appointment Creation)
- [x] Migrated `RescheduleModal.tsx` (Appointment Reschedule)
- [x] Zero TypeScript errors (`npx tsc --noEmit`)

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `@gorhom/bottom-sheet`, `react-native-keyboard-controller`, `expo-clipboard` installed
- [x] `react-native-svg` (required by `SessionProgressRing.tsx`)
- [x] `@tanstack/react-query` v5 installed
- [x] `react-hook-form`, `zod`, `@hookform/resolvers` installed
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
