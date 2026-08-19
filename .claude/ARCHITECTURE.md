# Dr. Paul's Multispeciality Clinic — Application Architecture

> **Clinic Context**: Dr. Paul's Multispeciality Clinic  
> Specialities: Hair, Skin, Cosmetic procedures  
> Target Persona: Receptionist Console (Anita Roy • Staff ID: REC-2026-04)  
> Hours: Mon–Sun 10:00 AM – 7:00 PM (Thursday Closed)

---

## 1. Design Philosophy & Guidelines

- **Clean & Professional aesthetic**: Premium medical UI matching receptionist clinical workflow.
- **Micro-interactions & 60Hz Refresh Rate Optimization**: Lightweight 80ms–120ms `withTiming` `Easing.out(Easing.quad)` hardware-accelerated transforms (`translateY`, `translateX`, `opacity`); heavy spring physics, `scaleY` distortion, `Easing.back` overshoots, and layout-reflow height animations avoided for guaranteed 60fps+ stutter-free native performance.
- **Safe Area Inset Management & Keyboard Control**: Managed via `react-native-safe-area-context` (`SafeAreaProvider`, `useSafeAreaInsets`) and `KeyboardAvoidingView` / `react-native-keyboard-controller`. Top insets applied to Header; bottom insets applied to BottomNav, BottomSheet, and Toast offset. Auth form utilizes `KeyboardAvoidingView` container lifting to elevate the card as a single layout unit, eliminating field-switching scroll jitter when navigating between Email and Password fields.
- **Native Gesture Bottom Sheets & Safe Area Constraints**: Built with `@gorhom/bottom-sheet` (`GorhomBottomSheet`) inside React Native `Modal` wrappers with `GestureHandlerRootView`. Configured with `keyboardBehavior="extend"` and hard-capped at an 85% safe-area height ceiling (`maxPct` derived from `insets.top`) so modals rest safely below the status bar. Features 2-stage downward drag snapping (`enableOverDrag={false}`) where swiping down from index 1 snaps to index 0 first before closing. Quick Patient Registration utilizes `keyboardBlurBehavior="restore"` to minimize back to initial snap height on keyboard dismiss, while Add Doctor, Create Appointment, and update modals utilize `keyboardBlurBehavior="none"` to stay maximized at max peek even when the keyboard is closed.
- **Back Navigation & Exit Policy**: Full Android hardware back button & gesture navigation stack (`router.back()`). Home screen back press presents a theme-aligned exit app confirmation modal (`ExitConfirmationModal`).
- **Full TypeScript Security**: Strict TypeScript configuration (`"strict": true`, `"noImplicitAny": true`) with central domain interfaces in `src/types/index.ts`.
- **JSON File-System Data Layer & Axios Interceptor Engine**: All domain records originate from static JSON files (`assets/data/*.json`). Data access is routed through an elaborate Axios interceptor layer (`src/api/`) with custom in-memory adapter routing requests to `/nested` and `/nonnested` endpoint families keyed by `spc`.

- **React Hook Form + Zod Form Validation Engine**: All form surfaces across the application (`AuthScreen`, `AddPatientSheet`, `AddDoctorSheet`, `CreateAppointmentSheet`, `RescheduleModal`) utilize a standardized **React Hook Form + Zod** architecture with `@hookform/resolvers/zod`. Domain schemas are centrally maintained under `src/schemas/` with strict type safety (`z.infer`). Custom controls (`Select`, day chips, calendar date pickers, switches, `PatientSearchInput`) are seamlessly wrapped via RHF's `<Controller>` pattern. Form fields utilize a reusable `FormField.tsx` wrapper for consistent label and inline error display, while server/business logic validations (doctor availability, slot conflict detection) surface dynamically via `setError('root')` error banners.
- **TanStack Query + Zustand Coexistence**: Server-state (remote data fetching, caching, background refetch, deduplication, loading/error state) is owned by **TanStack Query** (@tanstack/react-query). Client/UI state (theme, activeCenterId, modals, auth token) and write-through optimistic mutations are owned by **Zustand**. Screens and components consume data exclusively via custom query hooks (src/hooks/queries/) and mutation hooks (src/hooks/mutations/). Zustand stores no longer expose fetch* methods or loading flags — those responsibilities belong to TanStack Query. Pull-to-refresh is handled by queryClient.invalidateQueries() in useRefresh.ts. Query keys are centralized in src/api/queryKeys.ts (no magic strings). staleTime = 2 min, gcTime = 10 min. For entity list queries, initialData is seeded from dataStore.getData() for zero-flicker instant render. For detail/secondary queries, skeleton loaders are shown while isLoading = true.
- **Debounced Server-Side Search Architecture**: Search inputs across all screens (`SearchInput`, `PatientSearchInput`, `PatientListScreen`, `AppointmentsScreen`, `AvailablePackagesScreen`, `PatientEnrollmentsScreen`, `PastAppointmentsScreen`, `DoctorScreen`) utilize controlled input components powered by a custom `useDebounce` hook (200ms delay, 1-character threshold). Keystrokes update local UI state immediately for responsive typing, while debounced values trigger TanStack Query server-side search hooks (`usePatientSearchQuery`, `usePackageSearchQuery`, `useAppointmentSearchQuery`, `useEnrollmentSearchQuery`, `useDoctorSearchQuery`) starting on the very first character typed. Uncontrolled `defaultValue` re-render issues are eliminated. Loading states display an activity indicator inside the input suffix and skeleton loading cards during active fetches.
- **Robinhood-Style OLED Dark Aesthetics**: Deep pitch-black background (`#000000`), elevated dark card surfaces (`#131722`), sleek subtle dark borders (`#1E2432`), high-contrast crisp white typography (`#FFFFFF`), and high-energy electric Robinhood accent tokens (`#3875F6` blue, `#00C805` emerald green, `#FF9500` amber, `#FF3B30` red).
- **Multi-Center Global Scoping**: Global active center selector in Header (`activeCenterId`), filtering appointments, doctor availability, working days/hours, and scheduling slots across branches.

---

## 2. Directory Structure

```
DrPauls/
├── App.tsx                        # Root entrypoint + Auth Token Gate + CenterInit + SafeAreaProvider + BackHandler + Toast
├── index.ts
├── tsconfig.json                  # TypeScript compiler configuration (strict mode)
├── metro.config.js                # Metro bundler config
├── tailwind.config.js             # Tailwind CSS config
├── package.json
├── assets/
│   ├── audio/                     # UI sound assets (.wav)
│   ├── images/                    # Visual assets & logos
│   └── data/                      # JSON File-System Seed Database
│       ├── appointments.json      # Appointment seed records (with centerId, enrollmentId, sessionNumber)
│       ├── centers.json           # Clinic centers seed data (Guwahati Main, Dispur, Silchar)
│       ├── doctors.json           # Doctor records with phone, maxPatientsPerDay, centerSchedule
│       ├── enrollments.json       # Package enrollment seed records (PackageEnrollment[])
│       ├── packages.json          # Static package catalog records (Package[])
│       ├── patients.json          # 7 patient records
│       ├── staff.json             # 1 staff user record
│       └── therapists.json        # 3 therapist records
└── src/
    ├── api/                       # Axios Interceptor & Data Access Layer (@DataEngineer)
    │   ├── adapter.ts             # Custom Axios adapter routing spc keys to in-memory handlers
    │   ├── axiosConfig.ts         # Axios instance setup with base URL, headers & interceptors
    │   ├── dataStore.ts           # In-memory session store hydrated from assets/data/*.json
    │   ├── index.ts               # Barrel export for API layer
    │   ├── queryClient.ts         # Singleton QueryClient (staleTime=2min, gcTime=10min)
    │   ├── queryKeys.ts           # Centralized TanStack Query key factory (no magic strings)
    │   ├── types.ts               # ApiFamily, SpcKey, ApiRequest, ApiResponse definitions
    │   ├── handlers/
    │   │   ├── nestedHandlers.ts  # Relational / composed query handlers
    │   │   └── nonnestedHandlers.ts # Flat single-collection CRUD handlers (including centers)
    │   ├── interceptors/
    │   │   ├── requestInterceptor.ts # Bearer token injection, request timestamps, logging
    │   │   └── responseInterceptor.ts# Payload unwrapping & error handling
    │   └── services/
    │       ├── appointmentService.ts # Appointment API operations
    │       ├── centerService.ts      # Clinic Center API operations
    │       ├── doctorService.ts     # Doctor API operations
    │       ├── packageEnrollmentService.ts # PackageEnrollment CRUD API operations [NEW]
    │       ├── packageService.ts    # Package catalog API operations
    │       ├── patientService.ts    # Patient API operations
    │       ├── staffService.ts      # Staff API operations
    │       └── therapistService.ts  # Therapist API operations
    ├── hooks/                     # Custom TanStack Query hooks (@DataEngineer)
    │   ├── queries/               # useQuery hooks (server read state)
    │   │   ├── useAppointmentsQuery.ts  # Appointments queries (all, byDate, byRange, todayStats)
    │   │   ├── usePatientsQuery.ts      # Patients queries (all, byId, search)
    │   │   ├── useDoctorsQuery.ts       # Doctors + Therapists queries
    │   │   ├── useCentersQuery.ts       # Centers queries
    │   │   ├── usePackagesQuery.ts      # Packages + Enrollments queries
    │   │   └── useStaffQuery.ts         # Staff/profile query
    │   └── mutations/             # useMutation hooks (server write state)
    │       ├── useAppointmentMutations.ts  # add, update, move, cancel, updateStatus
    │       ├── usePatientMutations.ts      # add, update patient
    │       ├── useDoctorMutations.ts       # add, update doctor
    │       └── usePackageMutations.ts      # enroll, markCompleted, cancel/reschedule session, pause/resume
    ├── schemas/                   # Zod Validation Schemas (@DataEngineer & @Frontend)
    │   ├── index.ts               # Barrel export for validation schemas
    │   ├── authSchema.ts          # Sign In form schema & inferred types
    │   ├── patientSchema.ts       # Quick patient registration schema
    │   ├── doctorSchema.ts        # Doctor registration & schedule schema
    │   ├── appointmentSchema.ts   # Discriminated union appointment creation schema (Normal vs Package)
    │   └── rescheduleSchema.ts    # Appointment reschedule & slot change schema
    ├── types/
    │   └── index.ts               # Central TypeScript type definitions & interfaces (Center, Doctor, Appointment)
    ├── components/
    │   ├── Header.tsx             # Top app bar with center toggle badge & staff profile avatar button
    │   ├── BottomNav.tsx          # Floating bottom row: 4-tab pill (Home, Calendar, Patients, Appts) with Reanimated sliding indicator + 52px [+] FAB
    │   ├── SidebarDrawer.tsx      # Reanimated slide-in/out navigation drawer for secondary items (Home, Reports, Packages)
    │   ├── appointment/
    │   │   ├── AddPatientSheet.tsx       # Quick patient creation bottom sheet (returns new patientId onCreated)
    │   │   ├── CreateAppointmentSheet.tsx # Validated appointment creation bottom sheet with date picker & slots
    │   │   └── PatientSearchInput.tsx     # Search dropdown component
    │   ├── calendar/
    │   │   ├── CalendarHeader.tsx # Date navigator, view mode, list/grid toggle & status filters
    │   │   ├── CalendarGrid.tsx   # Time grid (Day & Week views) with red unavailable slot overlays during drag
    │   │   ├── DraggableChip.tsx  # Drag-and-Drop rescheduling wrapper with PanResponder (ghost opacity 0.5)
    │   │   ├── AppointmentChip.tsx# Individual appointment card component with right-side drag handle
    │   │   ├── MonthGrid.tsx      # 7x5 month view matrix with out-of-month navigation
    │   │   ├── RescheduleModal.tsx# Validated appointment edit modal (date, doctor, slot)
    │   │   └── AppointmentDetailModal.tsx # Appointment detail sheet with Edit action button & reschedule log
    │   ├── doctor/
    │   │   ├── AddDoctorSheet.tsx # Doctor creation bottom sheet
    │   │   └── DoctorDetailModal.tsx # Doctor schedule & contact details sheet
    │   ├── patient/
    │   │   └── PatientDetailModal.tsx # Patient detail sheet with reliability metadata & past records link
    │   └── shared/
    │       ├── AppRefreshControl.tsx # Theme-aligned pull-to-refresh control component matching dark/light mode
    │       ├── BottomSheet.tsx    # @gorhom/bottom-sheet wrapper with dual snap points & backdrop
    │       ├── CenterSwitchSheet.tsx # Bottom sheet for switching clinic center
    │       ├── ForgotPasswordModal.tsx# Modal dialog directing password resets to admin email with one-tap copy
    │       ├── FormField.tsx      # Reusable typed form field wrapper with inline error display
    │       ├── QuickAddPopup.tsx  # Floating popup above navbar with New Appt, New Patient & New Doctor options
    │       ├── ExitConfirmationModal.tsx  # Theme-aligned exit confirmation modal dialog
    │       ├── LogoutConfirmationModal.tsx# Theme-aligned sign out confirmation modal dialog
    │       ├── RescheduleConfirmationModal.tsx # Theme-aligned popup dialog for appointment reschedule confirmation
    │       ├── SearchInput.tsx    # Debounced search bar with clear button
    │       ├── Select.tsx         # Custom dropdown selector
    │       └── StatusChip.tsx     # Color-coded status badge
    ├── constants/
    │   └── index.ts               # Status definitions & status color tokens
    ├── screens/
    │   ├── AuthScreen.tsx         # Dedicated Sign In page with Quick Demo pills
    │   ├── HomeScreen.tsx         # Dashboard: stat grid, UpcomingSessionsWidget, today's schedule
    │   ├── CalendarScreen.tsx     # Appointment calendar screen (grid & list display modes)
    │   ├── AppointmentsScreen.tsx # Appointments Directory with date filters & grouping
    │   ├── PatientListScreen.tsx  # Patient directory screen with priority border highlights
    │   ├── PatientRecordsScreen.tsx # Patient Past Records, timeline, active enrollments
    │   ├── DoctorScreen.tsx       # Doctor schedule screen with phone & direct system dialer call icon
    │   ├── ReportsScreen.tsx      # Comprehensive clinical data analytics & operational dashboard
    │   ├── AvailablePackagesScreen.tsx # Dedicated Available Packages catalog screen
    │   ├── PatientEnrollmentsScreen.tsx # Dedicated Patient Package Enrollments screen
    │   └── SettingsScreen.tsx     # Settings screen with Staff Profile & Sign Out
    ├── store/
    │   ├── useAuthStore.ts        # Persistent AsyncStorage Auth Token Engine & 24-hour mock JWT issuance
    │   ├── useAppointmentStore.ts # Write-through mutations: updateStatus, updateAppointment, moveAppointment, cancelAppointment, addAppointment (fetch* removed)
    │   ├── useCenterStore.ts      # Center selectors (getCenterById); fetchCenters removed
    │   ├── usePatientStore.ts     # Patient CRUD mutations + priority calculation; fetchPatients removed
    │   ├── useDoctorStore.ts      # Doctor/therapist CRUD mutations; fetchDoctorsAndTherapists removed
    │   ├── usePackageStore.ts     # Package enrollment lifecycle mutations; fetchPackages/fetchEnrollments removed
    │   └── useUIStore.ts          # UI theme, layout & activeCenterId state
    ├── theme/
    │   ├── colors.ts              # Dark & light color tokens
    │   └── ThemeContext.tsx       # Theme context provider & hook
    └── utils/
        ├── authUtils.ts          # Base64 mock JWT generator, parsing, expiration & refresh helpers
        ├── clipboardUtils.ts     # Centralized expo-clipboard long-press copy helper with toast & haptics
        ├── dateUtils.ts          # ISO date formatting, slot calculators & doctor availability helpers
        ├── feedback.ts           # Centralized audio & haptic feedback controller
        ├── searchUtils.ts        # Patient search & ID generation logic
        ├── shareUtils.ts         # Utility for sharing appointment details via system share sheet
        └── useRefresh.ts         # Pull-to-refresh via queryClient.invalidateQueries() (all active queries)
```

---

## 3. Multi-Center Global Architecture

1. **Seed Data (`assets/data/centers.json`)**:
   - Stores center details (`cc_hash`, `cc_name`, `bill_address`, `bill_state`, `bill_pin`, `phone`, `email`, `openDays`, `openHours`).
2. **Doctor Center Schedule (`DoctorCenterSchedule`)**:
   - Each doctor specifies `centerSchedule` array defining working days and hours for each clinic branch.
3. **Global Center Selector (`activeCenterId`)**:
   - Maintained in `useUIStore`. Header presents a center pill (if `centers.length > 1`) that opens `CenterSwitchSheet`.
   - Changing active center updates appointment lists, stat cards, calendar grid views, and doctor scheduling options across the app.

---

## 4. Persistent AsyncStorage JWT Token Lifecycle & Startup Flow

1. **App Startup Verification**:
   - On launch, `checkAndVerifyAuth()` inspects `@react-native-async-storage/async-storage` for `@drpauls_jwt_token` and `fetchCenters()` loads clinic branches.
   - **If a valid token exists**: User is directly routed to Home Page.
   - **If no token exists**: Presented with Login Page (`AuthScreen`).

---

## 5. Navigation Hierarchy & Hardware Back Button Policy

```
App Root (SafeAreaProvider)
├── AuthScreen (If isAuthenticated = false / Token is null)
└── MainApp Component (If isAuthenticated = true / Valid Token verified)
    ├── Top Header (Logo + Center Toggle + Drawer Toggle + Theme Toggle)
    ├── Active Screen Container (History Stack)
    │   ├── HomeScreen
    │   ├── CalendarScreen (List & Grid modes)
    │   ├── AppointmentsScreen (Directory with Today/Yesterday/Custom filters & Doctor/Patient grouping)
    │   ├── PatientListScreen (Priority card border highlights)
    │   ├── PatientRecordsScreen (Past records & interactive timeline)
    │   ├── DoctorScreen
    │   ├── ReportsScreen (Analytics & operational data dashboard)
    │   ├── Packages (Multi-level Collapsible Sidebar Group)
    │   │   ├── AvailablePackagesScreen (Catalog & booking)
    │   │   └── PatientEnrollmentsScreen (Live enrollments & timelines)
    │   └── SettingsScreen
    └── Bottom Nav Bar (Home | Quick Add [+] | Settings)
```

### Navigation & Scroll-Driven BottomNav Behavior:
1. **Scroll Translate Animation (`useScrollNavbar.ts`)**:
   - Scrolling down on any scrollable screen or component (`HomeScreen`, `CalendarScreen`, `CalendarGrid`, `MonthGrid`, `AppointmentsScreen`, `PatientListScreen`, `DoctorScreen`, `AvailablePackagesScreen`, `PatientEnrollmentsScreen`, `ReportsScreen`) smoothly translates `BottomNav` down on the Y-axis (`translateY: 120px`) via Reanimated `withTiming`.
   - Scrolling up or returning near top (`contentOffset.y <= 10`) translates `BottomNav` back up (`translateY: 0`).
   - Navigating between screens or selecting tabs automatically resets `navVisible = true`.

### Back Button Policy (`BackHandler`):
1. Modal open (QuickAdd, CenterSwitch, CreateAppt, AddPatient, AddDoctor, ExitConfirmation) → Dismiss active modal.
2. Sidebar Drawer open → Close drawer.
3. Screen History length > 1 → Pop top screen from navigation stack (`screenHistory.pop()`).
4. On `HomeScreen` → Show `ExitConfirmationModal`.
5. Android `enableOnBackInvokedCallback: true` maintained in `app.json`.

---

## 6. Patient Reliability System & Visual Accent Engine

1. **Reliability Formula (`usePatientStore.ts`)**:
   - Evaluated dynamically via `calculatePatientPriority(rescheduleCount)`:
     - `0 reschedules` -> 🟢 **High Reliability** (`#10B981`)
     - `1–2 reschedules` -> 🟡 **Medium Reliability** (`#F59E0B`)
     - `3+ reschedules` -> 🔴 **Low Reliability** (`#EF4444`)
2. **Visual Highlight Format**:
   - Cards across `PatientListScreen`, `PatientDetailModal`, `PatientRecordsScreen`, and `AppointmentsScreen` are highlighted with prominent 5px left accent borders (`borderLeftWidth: 5`, `borderLeftColor: priorityColor`) and subtle 1px outlines (`borderColor: priorityColor + '40'`).
   - Filter chips on `PatientListScreen` and `AppointmentsScreen` are pill-shaped (`borderRadius: 20`) with flex-shrink controls to prevent overflow when sorting by Reliability.
   - Reliability metadata is rendered as text-only (`Reliability: High Reliability`) inside detail sheets and headers without badge pills.

---

## 7. Status Engine & Appointment Directory Filters

1. **Canonical Status Classification System**:
   - **`Scheduled`**: Future booking awaiting attendance (`#2563EB`).
   - **`Confirmed`**: Confirmed upcoming booking (`#16A34A`).
   - **`Paid`**: Successfully completed & billed session (`#7C3AED`).
   - **`Pending`**: Active/upcoming booking awaiting pre-payment or receptionist action (`#D97706`).
   - **`Rescheduled`**: Booking moved from an earlier slot (`#0891B2`).
   - **`Overdue`**: Booking explicitly marked `'Overdue'` OR past `Pending` sessions (`date < today`) (`#EF4444`).
   - **`Unattended`**: Booking explicitly marked `'Unattended'` OR past unfulfilled `Scheduled`/`Confirmed` sessions (`date < today`) (`#E11D48`).
   - **`Cancelled`**: Cancelled appointment (`#DC2626`).
2. **StatusChip Component Behavior (`StatusChip.tsx`)**:
   - Evaluates `effectiveStatus` without conflating Pending and Overdue: active `Pending` items remain Amber **Pending**; past `Pending` items evaluate to Red **Overdue**; past `Confirmed`/`Scheduled` items evaluate to Rose **Unattended**.
3. **Appointments Directory Filtering (`AppointmentsScreen.tsx`)**:
   - Full status chip row: `All`, `Scheduled`, `Confirmed`, `Paid`, `Pending`, `Rescheduled`, `Overdue`, `Unattended`, `Cancelled`.
   - Global status filters (`Overdue` & `Unattended`) scan across all dates regardless of range mode.

---

## 7. Reschedule Confirmation & Audit Log

1. **Standalone Confirmation Dialog (`RescheduleConfirmationModal.tsx`)**:
   - Theme-aligned modal dialog triggered during both update modal edits (`RescheduleModal.tsx`) and calendar Drag-and-Drop releases (`DraggableChip.tsx`).
   - Prompts receptionists to review date/time changes, doctor assignments, and priority impacts before committing slot moves.
2. **Original Schedule Details Log**:
   - Preserves original schedule data (`originalSchedule: { date, startTime, doctorName, rescheduledAt }`) and increments patient reschedule count.
   - Renders an **Original Schedule Details** log box inside `AppointmentDetailModal.tsx`.

---

## 8. Packaged Sessions — Enrollment Lifecycle

### Core Data Model

| Entity | File | Owner |
|---|---|---|
| `Package` (catalog) | `assets/data/packages.json` | Static — read-only |
| `PackageEnrollment` | `assets/data/enrollments.json` | `usePackageStore.ts` |

**`PackageEnrollment` fields**: `enrollmentId`, `patientId`, `patientName`, `packageId`, `packageName`, `totalSessions`, `completedSessions`, `sessionInterval` (days), `sessionIds` (Appointment IDs), `status` (`Active` | `Paused` | `Completed` | `Cancelled`), `enrolledAt`, `therapistId?`, `therapistName?`, `startDate`, `notes?`.

**`Appointment` fields** (extended): `enrollmentId?` links to parent enrollment; `sessionNumber?` (1-based index).

### Enrollment Flow

1. Receptionist selects a package in `CreateAppointmentSheet` → picks interval (7/14/21/30 days) → selects therapist.
2. `enrollPatientInPackage()` in `usePackageStore` creates a `PackageEnrollment` and generates `totalSessions` Appointment records spaced by `sessionInterval` days.
3. `playEnrollmentCreatedSound()` fires haptic + audio feedback.

### Session Lifecycle Actions

| Action | Store Method | Appointment Effect |
|---|---|---|
| Mark Attended | `markSessionCompleted` | Status → `Paid` |
| Cancel Session | `cancelSession(shiftRemaining?)` | Status → `Cancelled`; optional: shift all future sessions forward |
| Reschedule Session | `rescheduleSession(shiftRemaining?)` | `moveAppointment`; optional: shift all future sessions by day delta |
| Pause Enrollment | `pauseEnrollment` | All future sessions → `Pending` |
| Resume Enrollment | `resumeEnrollment(newStartDate)` | Reschedules remaining sessions from newStartDate at original interval |

### Shift Remaining Sessions Option
When cancelling or rescheduling, the receptionist is presented a modal dialog:
- **Keep dates** — only the current session is affected.
- **Shift all remaining** — all subsequent non-cancelled sessions are shifted forward.

### Therapist Assignment
Therapist is assigned **at enrollment level** (`therapistId` / `therapistName` on `PackageEnrollment`), not per individual session appointment.

### Icon Policy
No emojis anywhere in the UI. All icons use `@expo/vector-icons` Ionicons.

### UI Components
- `SessionProgressRing.tsx` — Reanimated SVG circular progress.
- `PackageSessionCard.tsx` — Action card per session (Mark / Reschedule / Cancel).
- `PackageEnrollmentDetailSheet.tsx` — Full bottom sheet with timeline, pause/resume, shift dialog.
- `UpcomingSessionsWidget.tsx` — Dashboard horizontal scrollable widget on `HomeScreen`.
- `PackagesScreen.tsx` — Dual tabs: **Catalog** (static) / **Enrollments** (live).

---

## 9. Centralized Pull-To-Refresh Architecture

1. **Re-hydration Hook (`useRefresh.ts`)**:
   - Centralized hook managing loading state, click sound feedback, and concurrent re-fetch of all Zustand stores (`appointments`, `patients`, `doctors`, `centers`, `packages`).
2. **Theme-Aligned Refresh Component (`AppRefreshControl.tsx`)**:
   - Encapsulates native `RefreshControl` with active theme tokens (`colors.primary` tint, `colors.card` Android background container, `colors.textMuted` title label) integrated across all scrollable screens and lists.

---

## 10. Intelligent Schedule Filtering & Calendar Grouped List Views

1. **HomeScreen Today's Schedule Time-Interval Filter & Scroll Viewport**:
   - **1-Hour Dropdown Filter**: Dynamic 1-hour slot generator derived from the active clinic's `openHours` (`openStart` to `openEnd`), defaulting to `'ALL'`.
   - **Touch-Isolated Modal Picker**: Uses `Modal` + `measureInWindow` + Reanimated for flawless gesture isolation from the parent `ScrollView` with smart above/below screen boundary detection.
   - **Scroll-Capped Viewport**: Constrained to a 4-card viewport (`maxHeight: 340`) with a bottom `LinearGradient` fade and a `+N more · scroll to see all` hint that automatically dismisses when the user scrolls to the bottom.

2. **Calendar List Mode Grouped Hierarchy**:
   - **Day View**: Appointments grouped into **1-hour intervals** (`10:00 AM – 11:00 AM`, etc.) with empty intervals hidden.
   - **Week View**: Appointments grouped **day-wise** across the 7-day week (empty days hidden).
   - **Month View**: Appointments grouped **week-wise** across the 5-week month matrix (e.g. `Week 1 (27 Jul – 02 Aug)`).
   - **Clean Session Count Header**: Header renders total session count only (e.g. `12 sessions`), while each group section features a primary theme accent bar and count badge pill.

