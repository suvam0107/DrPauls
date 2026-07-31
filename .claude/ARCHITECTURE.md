# Dr. Paul's Multispeciality Clinic — Application Architecture

> **Clinic Context**: Dr. Paul's Multispeciality Clinic  
> Specialities: Hair, Skin, Cosmetic procedures  
> Target Persona: Receptionist Console (Anita Roy • Staff ID: REC-2026-04)  
> Hours: Mon–Sun 10:00 AM – 7:00 PM (Thursday Closed)

---

## 1. Design Philosophy & Guidelines

- **Clean & Professional aesthetic**: Premium medical UI matching receptionist clinical workflow.
- **Micro-interactions**: Smooth 90ms–140ms `withTiming` Easing transitions; bouncy spring animations avoided.
- **Safe Area Inset Management & Keyboard Control**: Managed via `react-native-safe-area-context` (`SafeAreaProvider`, `useSafeAreaInsets`) and `KeyboardAvoidingView` / `react-native-keyboard-controller`. Top insets applied to Header; bottom insets applied to BottomNav, BottomSheet, and Toast offset. Auth form utilizes `KeyboardAvoidingView` container lifting to elevate the card as a single layout unit, eliminating field-switching scroll jitter when navigating between Email and Password fields.
- **Native Gesture Bottom Sheets & Safe Area Constraints**: Built with `@gorhom/bottom-sheet` (`GorhomBottomSheet`) inside React Native `Modal` wrappers with `GestureHandlerRootView`. Configured with `keyboardBehavior="extend"` and hard-capped at an 85% safe-area height ceiling (`maxPct` derived from `insets.top`) so modals rest safely below the status bar. Features 2-stage downward drag snapping (`enableOverDrag={false}`) where swiping down from index 1 snaps to index 0 first before closing. Quick Patient Registration utilizes `keyboardBlurBehavior="restore"` to minimize back to initial snap height on keyboard dismiss, while Add Doctor, Create Appointment, and update modals utilize `keyboardBlurBehavior="none"` to stay maximized at max peek even when the keyboard is closed.
- **Back Navigation & Exit Policy**: Full Android hardware back button & gesture navigation stack (`router.back()`). Home screen back press presents a theme-aligned exit app confirmation modal (`ExitConfirmationModal`).
- **Full TypeScript Security**: Strict TypeScript configuration (`"strict": true`, `"noImplicitAny": true`) with central domain interfaces in `src/types/index.ts`.
- **JSON File-System Data Layer & Axios Interceptor Engine**: All domain records originate from static JSON files (`assets/data/*.json`). Data access is routed through an elaborate Axios interceptor layer (`src/api/`) with custom in-memory adapter routing requests to `/nested` and `/nonnested` endpoint families keyed by `spc`.
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
│       ├── appointments.json      # 30 appointment seed records (with centerId)
│       ├── centers.json           # Clinic centers seed data (Guwahati Main, Dispur, Silchar)
│       ├── doctors.json           # Doctor records with phone, maxPatientsPerDay, centerSchedule
│       ├── packages.json          # 2 package records
│       ├── patients.json          # 7 patient records
│       ├── staff.json             # 1 staff user record
│       └── therapists.json        # 3 therapist records
└── src/
    ├── api/                       # Axios Interceptor & Data Access Layer (@DataEngineer)
    │   ├── adapter.ts             # Custom Axios adapter routing spc keys to in-memory handlers
    │   ├── axiosConfig.ts         # Axios instance setup with base URL, headers & interceptors
    │   ├── dataStore.ts           # In-memory session store hydrated from assets/data/*.json
    │   ├── index.ts               # Barrel export for API layer
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
    │       ├── packageService.ts    # Package API operations
    │       ├── patientService.ts    # Patient API operations
    │       ├── staffService.ts      # Staff API operations
    │       └── therapistService.ts  # Therapist API operations
    ├── types/
    │   └── index.ts               # Central TypeScript type definitions & interfaces (Center, Doctor, Appointment)
    ├── components/
    │   ├── Header.tsx             # Top app bar with center toggle badge & theme toggle
    │   ├── BottomNav.tsx          # 3-tab bottom navigation bar with center + QuickAdd trigger
    │   ├── SidebarDrawer.tsx      # Reanimated slide-in/out navigation drawer
    │   ├── appointment/
    │   │   ├── AddPatientSheet.tsx       # Quick patient creation bottom sheet
    │   │   ├── CreateAppointmentSheet.tsx # Validated appointment creation bottom sheet with date picker & slots
    │   │   └── PatientSearchInput.tsx     # Search dropdown component
    │   ├── calendar/
    │   │   ├── CalendarHeader.tsx # Date navigator, view mode, list/grid toggle & status filters
    │   │   ├── CalendarGrid.tsx   # Time grid (Day & Week views) with red unavailable slot overlays during drag
    │   │   ├── DraggableChip.tsx  # Drag-and-Drop rescheduling wrapper with PanResponder
    │   │   ├── AppointmentChip.tsx# Individual appointment card component
    │   │   ├── MonthGrid.tsx      # 7x5 month view matrix with out-of-month navigation
    │   │   ├── RescheduleModal.tsx# Validated appointment edit modal (date, doctor, slot)
    │   │   └── AppointmentDetailModal.tsx # Appointment detail sheet with Edit action button
    │   └── shared/
    │       ├── BottomSheet.tsx    # @gorhom/bottom-sheet wrapper with dual snap points & backdrop
    │       ├── CenterSwitchSheet.tsx # Bottom sheet for switching clinic center
    │       ├── QuickAddPopup.tsx  # Floating popup above navbar with New Appt & New Patient options
    │       ├── ExitConfirmationModal.tsx  # Theme-aligned exit confirmation modal dialog
    │       ├── LogoutConfirmationModal.tsx# Theme-aligned sign out confirmation modal dialog
    │       ├── SearchInput.tsx    # Debounced search bar with clear button
    │       ├── Select.tsx         # Custom dropdown selector
    │       └── StatusChip.tsx     # Color-coded status badge
    ├── constants/
    │   └── index.ts               # Status definitions & status color tokens
    ├── screens/
    │   ├── AuthScreen.tsx         # Dedicated Sign In page with Quick Demo pills
    │   ├── HomeScreen.tsx         # Main clinic overview dashboard with 2x2 stat grid & today's schedule
    │   ├── CalendarScreen.tsx     # Appointment calendar screen (grid & list display modes)
    │   ├── PatientListScreen.tsx  # Patient directory screen
    │   ├── DoctorScreen.tsx       # Doctor schedule screen with phone & direct system dialer call icon
    │   ├── ReportsScreen.tsx      # Reports & analytics screen
    │   └── SettingsScreen.tsx     # Settings screen with Staff Profile & Sign Out
    ├── store/
    │   ├── useAuthStore.ts        # Persistent AsyncStorage Auth Token Engine & 24-hour mock JWT issuance
    │   ├── useAppointmentStore.ts# State management routed through appointmentService
    │   ├── useCenterStore.ts      # Clinic center state management routed through centerService
    │   ├── usePatientStore.ts     # Patient directory state routed through patientService
    │   ├── useDoctorStore.ts      # Doctor schedule state routed through doctorService & therapistService
    │   └── useUIStore.ts          # UI theme, layout & activeCenterId state
    ├── theme/
    │   ├── colors.ts              # Dark & light color tokens
    │   └── ThemeContext.tsx       # Theme context provider & hook
    └── utils/
        ├── authUtils.ts          # Base64 mock JWT generator, parsing, expiration & refresh helpers
        ├── clipboardUtils.ts     # Centralized expo-clipboard long-press copy helper with toast & haptics
        ├── dateUtils.ts          # ISO date formatting, slot calculators & doctor availability helpers
        ├── feedback.ts           # Centralized audio & haptic feedback controller
        └── searchUtils.ts        # Patient search & ID generation logic
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
    │   ├── PatientListScreen
    │   ├── DoctorScreen
    │   ├── ReportsScreen
    │   └── SettingsScreen
    └── Bottom Nav Bar (Home | Quick Add [+] | Settings)
```

### Back Button Policy:
1. Exit Modal open → Dismiss exit modal.
2. Center Switch Sheet open → Dismiss sheet.
3. Quick Add Popup open → Dismiss popup.
4. Add Patient Sheet open → Dismiss sheet.
5. Create Appointment Sheet open → Dismiss sheet.
6. Sidebar Drawer open → Close drawer.
7. Screen History length > 1 → Pop top screen (`router.back()`).
8. On `HomeScreen` → Show `ExitConfirmationModal`.
