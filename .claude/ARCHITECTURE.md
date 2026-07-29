# Dr. Paul's Multispeciality Clinic — Application Architecture

> **Clinic Context**: Dr. Paul's Multispeciality Clinic (Guwahati)  
> Specialities: Hair, Skin, Cosmetic procedures  
> Target Persona: Receptionist Console (Anita Roy • Staff ID: REC-2026-04)  
> Hours: Mon–Sun 10:00 AM – 7:00 PM (Thursday Closed)

---

## 1. Design Philosophy & Guidelines

- **Clean & Professional aesthetic**: Premium medical UI matching receptionist clinical workflow.
- **Micro-interactions**: Smooth 90ms–140ms `withTiming` Easing transitions; bouncy spring animations avoided.
- **Safe Area Inset Management**: Managed via `react-native-safe-area-context` (`SafeAreaProvider`, `useSafeAreaInsets`). Top insets applied to Header; bottom insets applied to BottomNav, BottomSheet, and Toast offset.
- **Back Navigation & Exit Policy**: Full Android hardware back button & gesture navigation stack (`router.back()`). Home screen back press presents a theme-aligned exit app confirmation modal (`ExitConfirmationModal`).
- **Full TypeScript Security**: Strict TypeScript configuration (`"strict": true`, `"noImplicitAny": true`) with central domain interfaces in `src/types/index.ts`.

---

## 2. Directory Structure

```
DrPauls/
├── App.tsx                        # Root entrypoint + Auth Token Gate + SafeAreaProvider + BackHandler + Toast
├── index.ts
├── tsconfig.json                  # TypeScript compiler configuration (strict mode)
├── metro.config.js                # Metro bundler config
├── tailwind.config.js             # Tailwind CSS config
├── package.json
└── src/
    ├── types/
    │   └── index.ts               # Central TypeScript type definitions & interfaces
    ├── components/
    │   ├── Header.tsx             # Top app bar with safe area top inset & drawer toggle
    │   ├── BottomNav.tsx          # 3-tab bottom navigation bar with safe area bottom inset
    │   ├── SidebarDrawer.tsx      # Reanimated slide-in/out navigation drawer (5 menu links)
    │   ├── appointment/
    │   │   ├── AddPatientSheet.tsx       # Quick patient creation bottom sheet
    │   │   ├── CreateAppointmentSheet.tsx # Bottom sheet modal to add appointments
    │   │   └── PatientSearchInput.tsx     # Search dropdown component
    │   ├── calendar/
    │   │   ├── CalendarHeader.tsx # Date navigator, view mode toggle, & status filters
    │   │   ├── CalendarGrid.tsx   # Time grid container (Day & Week views) with auto-scroll
    │   │   ├── DraggableChip.tsx  # Drag-and-Drop rescheduling wrapper with PanResponder
    │   │   ├── AppointmentChip.tsx# Individual appointment card component
    │   │   ├── MonthGrid.tsx      # 7x5 month view matrix component
    │   │   └── AppointmentDetailModal.tsx # Appointment detail bottom sheet
    │   └── shared/
    │       ├── BottomSheet.tsx    # Translucent Modal portal + safe area insets + drag-to-maximize & scroll expansion
    │       ├── ExitConfirmationModal.tsx  # Theme-aligned exit confirmation modal dialog
    │       ├── LogoutConfirmationModal.tsx# Theme-aligned sign out confirmation modal dialog
    │       ├── SearchInput.tsx    # Debounced search bar with clear button
    │       ├── Select.tsx         # Custom dropdown selector
    │       └── StatusChip.tsx     # Color-coded status badge
    ├── constants/
    │   └── index.ts               # Status definitions & status color tokens
    ├── data/
    │   └── mockData.ts            # Seed dataset with 30 comprehensive appointment records
    ├── screens/
    │   ├── AuthScreen.tsx         # Dedicated Sign In page with Quick Demo pills
    │   ├── HomeScreen.tsx         # Main clinic overview dashboard with 2x2 stat grid
    │   ├── CalendarScreen.tsx     # Appointment calendar screen
    │   ├── PatientListScreen.tsx  # Patient directory screen
    │   ├── DoctorScreen.tsx       # Doctor schedule screen
    │   ├── ReportsScreen.tsx      # Reports & analytics screen
    │   └── SettingsScreen.tsx     # Settings screen with Staff Profile (Mobile + ID) & Sign Out at bottom
    ├── store/
    │   ├── useAuthStore.ts        # Persistent AsyncStorage Auth Token Engine, 24-hour mock JWT issuance & token verification gate
    │   ├── useAppointmentStore.ts# Permanent appointment state & in-memory seed sync
    │   ├── usePatientStore.ts     # Patient directory state management
    │   ├── useDoctorStore.ts      # Doctor schedule & availability state
    │   └── useUIStore.ts          # UI theme & layout state
    ├── theme/
    │   ├── colors.ts              # Dark & light color tokens
    │   └── ThemeContext.tsx       # Theme context provider & hook
    └── utils/
        ├── authUtils.ts          # Base64 mock JWT generator, parsing, expiration (24h) & refresh helpers
        ├── dateUtils.ts          # Local timezone ISO date formatting & time slot calculators
        └── searchUtils.ts        # Patient search & ID generation logic
```

---

## 3. Persistent AsyncStorage JWT Token Lifecycle & Startup Flow

1. **App Startup Verification**:
   - On application launch, `checkAndVerifyAuth()` inspects `@react-native-async-storage/async-storage` for `@drpauls_jwt_token`.
   - **If a valid token exists**: The user is **directly routed to the Home Page** without encountering the login page.
   - **If no token exists OR token is invalid/expired**: The user is presented with the **Login Page (`AuthScreen`)**.
2. **Token Persistence**:
   - As long as the user DOES NOT sign out, the token **persists permanently in AsyncStorage** across app restarts and auto-refreshes every 24 hours.
3. **Sign Out & Disk Token Deletion**:
   - When the user taps Sign Out on the Settings page and confirms via `LogoutConfirmationModal`, `AsyncStorage.removeItem('@drpauls_jwt_token')` **permanently deletes the token from device storage**.
   - Subsequent app opens find no token in disk storage and present the Login Page until a user signs in again.

---

## 4. Navigation Hierarchy & Hardware Back Button Policy

```
App Root (SafeAreaProvider)
├── AuthScreen (If isAuthenticated = false / Token is null)
└── MainApp Component (If isAuthenticated = true / Valid Token verified)
    ├── Top Header (Logo + Drawer Toggle + Theme Toggle) [Top Safe Area Inset]
    ├── Active Screen Container (History Stack)
    │   ├── HomeScreen
    │   ├── CalendarScreen
    │   ├── PatientListScreen
    │   ├── DoctorScreen
    │   ├── ReportsScreen
    │   └── SettingsScreen
    └── Bottom Nav Bar (3 Tabs: Home, New Appt, Settings) [Bottom Safe Area Inset]
```

### Back Button Flow:
1. Exit Modal open → Dismiss exit modal.
2. Active Create Appointment Sheet open → Dismiss sheet.
3. Active Sidebar Drawer open → Close drawer.
4. Screen History length > 1 → Pop top screen and return to previous route (`router.back()`).
5. On `HomeScreen` → Show theme-aligned `ExitConfirmationModal`.
