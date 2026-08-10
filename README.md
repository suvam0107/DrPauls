# 🩺 Dr. Paul's Multispeciality Clinic — Receptionist Console

> **Clinic Context**: Dr. Paul's Multispeciality Clinic (Guwahati, Assam)  
> **Specialities**: Hair, Skin, & Cosmetic Procedures  
> **Target Persona**: Receptionist Console  
> **Operating Hours**: Mon–Sun 10:00 AM – 7:00 PM (Thursday Closed)

---

## Executive Summary

**Dr. Paul's Multispeciality Clinic Console** is a high-performance, enterprise-grade React Native mobile & web application built specifically for clinical receptionists to manage patient appointments, doctor schedules, package session enrollments, patient records, and clinic analytics.

Powered by **Expo SDK 54**, **TanStack Query v5**, **Zustand v5**, and **Reanimated v4**, the app delivers a fluid clinical workflow experience—featuring an advanced drag-and-drop calendar engine, multi-doctor concurrent slot positioning, persistent JWT authentication, dynamic safe-area insets, and theme-aligned toast notifications.

---

## Key Features & Highlights

### 1. TanStack Query + Zustand Data Layer Architecture
- **Server State Caching**: Remote data fetching, background refetching, caching (`staleTime: 2min`, `gcTime: 10min`), and deduplication are managed exclusively by **TanStack Query** (`@tanstack/react-query`).
- **Instant Zero-Flicker Rendering**: List queries (appointments, patients, doctors, centers, packages) utilize `initialData` seeded from the local data layer for instant rendering without blank loading screens.
- **Write-Through Optimistic Store State**: Zustand stores (`useAppointmentStore`, `usePatientStore`, `useDoctorStore`, `usePackageStore`) own optimistic write mutations.
- **Mutation & Cache Invalidation**: Custom mutation hooks in `src/hooks/mutations/` wrap Zustand store write actions and automatically invalidate corresponding TanStack Query caches via `queryClient.invalidateQueries()`.
- **Centralized Query Key Registry**: Query keys are managed through `src/api/queryKeys.ts` with zero magic strings.

### 2. Advanced Interactive Calendar & Rescheduling Engine
- **Triple View Modes**: Seamless toggle between **Day**, **Week**, and **Month** grid layouts.
- **Drag-and-Drop Rescheduling**: Reschedule `Scheduled`, `Confirmed`, and `Rescheduled` appointment chips across timeslots and days via gesture pan handlers (`PanResponder`).
- **VSync Auto-Scroll**: Uses a native `requestAnimationFrame` loop tethered directly to display refresh VSync ticks. Dragging chips near the top header or bottom navbar auto-scrolls the grid with zero jitter and zero frame drops.
- **Multi-Doctor Concurrent Split Layout**: Employs a greedy layout algorithm to render overlapping appointments for different doctors side-by-side (50% width for 2 concurrent, 33.3% for 3), ensuring 100% visibility.
- **Collision & Double-Booking Prevention**:
  - **Doctor Collision Check**: Prevents scheduling or moving two appointments for the same doctor in overlapping time intervals.
  - **Patient Double-Booking Check**: Prevents a patient from having two concurrent appointments across different doctors at the same time.
- **Past Timeslot Protection**: Past timeslots are visually dimmed (`rgba(0,0,0,0.2)`) and touch-disabled (`isPastSlot`), preventing invalid historical appointments.

### 3. Packaged Treatment Sessions & Enrollment Lifecycle
- **Package Session Tracking**: Auto-schedules multi-session package enrollments with configurable intervals (7, 14, 21, or 30 days).
- **Session Attendance & Shifting**: Receptionists can mark sessions attended, cancel sessions, or reschedule sessions with an option to automatically shift remaining future sessions forward.
- **Enrollment Pause & Resume**: Pause active package enrollments or resume paused programs with new start dates.

### 4. Persistent JWT Authentication Lifecycle
- **Disk Token Persistence**: Auth tokens stored securely in `@react-native-async-storage/async-storage` (`@drpauls_jwt_token`).
- **Direct Startup Gate**: On launch, `checkAndVerifyAuth()` validates the stored token. If valid, the receptionist lands directly on the **Home Dashboard** without encountering the login screen.
- **24-Hour Issuance & Auto-Refresh**: Tokens auto-refresh seamlessly during active use.

### 5. Theme Engine & Clinical Design System
- **Robinhood-Style OLED Dark & Light Modes**: Deep pitch-black background (`#000000`), elevated dark card surfaces (`#131722`), crisp typography, and Robinhood electric accent tokens (`#3875F6` blue, `#00C805` emerald green, `#FF9500` amber, `#FF3B30` red).
- **Global Theme-Bound AppToast**: Custom toast notifications (`AppToast.tsx`) automatically aligned with the active theme and elevated above bottom navigation.
- **Android Hardware Back Button Handler**: Intercepts native hardware back presses to manage drawer toggles, bottom sheet dismissals, navigation history, and home exit modals (`ExitConfirmationModal`).

---

## Project Directory Architecture

```
DrPauls/
├── App.tsx                        # Root entrypoint + QueryClientProvider + Auth Gate + SafeAreaProvider + Toast
├── index.ts                       # Expo application registry entrypoint
├── tsconfig.json                  # Strict TypeScript compiler configuration
├── metro.config.js                # Metro bundler configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── package.json                   # Project dependencies & scripts
└── src/
    ├── api/                       # Axios Data Access Layer & TanStack Query Config (@DataEngineer)
    │   ├── adapter.ts             # Custom Axios adapter routing spc keys to in-memory handlers
    │   ├── axiosConfig.ts         # Axios instance setup with base URL, headers & interceptors
    │   ├── dataStore.ts           # In-memory session store hydrated from assets/data/*.json
    │   ├── index.ts               # Barrel export for API layer
    │   ├── queryClient.ts         # Singleton QueryClient (staleTime=2min, gcTime=10min)
    │   ├── queryKeys.ts           # Centralized TanStack Query key factory (no magic strings)
    │   ├── types.ts               # ApiFamily, SpcKey, ApiRequest, ApiResponse definitions
    │   ├── handlers/              # Nested & nonnested relational request handlers
    │   └── services/              # Entity API services (appointment, center, doctor, patient, etc.)
    ├── components/
    │   ├── Header.tsx             # Top app bar with safe area top inset & center switch toggle
    │   ├── BottomNav.tsx          # 3-tab bottom navigation bar with safe area bottom inset
    │   ├── SidebarDrawer.tsx      # Reanimated slide-in navigation drawer
    │   ├── appointment/
    │   │   ├── AddPatientSheet.tsx       # Quick patient creation bottom sheet
    │   │   ├── CreateAppointmentSheet.tsx # Bottom sheet modal to schedule appointments
    │   │   └── PatientSearchInput.tsx     # Patient search dropdown
    │   ├── calendar/
    │   │   ├── CalendarHeader.tsx # Date navigator, view mode toggle, & status filters
    │   │   ├── CalendarGrid.tsx   # Synchronized time grid container (Day & Week views)
    │   │   ├── DraggableChip.tsx  # rAF auto-scroll Drag-and-Drop chip wrapper
    │   │   ├── AppointmentChip.tsx# Individual appointment card component
    │   │   ├── MonthGrid.tsx      # 7x5 month view matrix component
    │   │   └── AppointmentDetailModal.tsx # Appointment detail bottom sheet
    │   ├── doctor/
    │   │   ├── AddDoctorSheet.tsx # Add new doctor sheet
    │   │   └── DoctorDetailModal.tsx # Doctor detail & edit modal
    │   ├── package/
    │   │   ├── PackageEnrollmentDetailSheet.tsx # Package timeline & session manager
    │   │   ├── PackageSessionCard.tsx           # Individual session action card
    │   │   ├── SessionProgressRing.tsx          # Reanimated SVG circular progress ring
    │   │   └── UpcomingSessionsWidget.tsx       # Home screen package widget
    │   ├── patient/
    │   │   └── PatientDetailModal.tsx # Patient detail & priority profile modal
    │   └── shared/
    │       ├── AppToast.tsx       # Global themed toast notification component
    │       ├── BottomSheet.tsx    # Translucent Modal portal with safe area insets
    │       ├── CenterSwitchSheet.tsx # Clinic center switch sheet
    │       ├── ExitConfirmationModal.tsx  # Exit app confirmation modal dialog
    │       ├── LogoutConfirmationModal.tsx# Sign out confirmation modal dialog
    │       ├── RescheduleConfirmationModal.tsx # D&D reschedule confirmation dialog
    │       ├── SearchInput.tsx    # Debounced search bar with clear button
    │       ├── Select.tsx         # Custom dropdown selector
    │       └── StatusChip.tsx     # Color-coded status badge with overdue highlight
    ├── constants/
    │   └── index.ts               # Status definitions, slot dimensions, & color tokens
    ├── hooks/                     # Custom TanStack Query Hooks (@DataEngineer)
    │   ├── queries/               # useQuery hooks (useAppointmentsQuery, usePatientsQuery, etc.)
    │   └── mutations/             # useMutation hooks (useAppointmentMutations, etc.)
    ├── screens/
    │   ├── AuthScreen.tsx         # Sign In page with Quick Demo pills
    │   ├── HomeScreen.tsx         # Clinic overview dashboard with 2x2 stat grid & package widget
    │   ├── CalendarScreen.tsx     # Appointment calendar screen
    │   ├── AppointmentsScreen.tsx # Appointments directory with grouping & filters
    │   ├── PatientListScreen.tsx  # Patient directory screen with priority highlights
    │   ├── PatientRecordsScreen.tsx # Patient past records & interactive timeline
    │   ├── DoctorScreen.tsx       # Doctor & therapist directory screen
    │   ├── AvailablePackagesScreen.tsx # Treatment packages catalog
    │   ├── PatientEnrollmentsScreen.tsx # Active package enrollments dashboard
    │   ├── ReportsScreen.tsx      # Analytics & operational data reports dashboard
    │   ├── SettingsScreen.tsx     # Staff Profile & Sign Out
    │   └── PastAppointmentsScreen.tsx # Preceding appointment log screen
    ├── store/
    │   ├── useAuthStore.ts        # Persistent AsyncStorage Auth Token engine
    │   ├── useAppointmentStore.ts # Appointment write-through mutations & collision validation
    │   ├── usePatientStore.ts     # Patient directory mutations & priority calculation
    │   ├── useDoctorStore.ts      # Doctor schedule & availability mutations
    │   ├── usePackageStore.ts     # Package enrollment lifecycle mutations
    │   ├── useCenterStore.ts      # Clinic center selectors
    │   └── useUIStore.ts          # UI theme, layout, & activeCenterId state
    ├── theme/
    │   ├── colors.ts              # OLED Dark & Light color tokens
    │   └── ThemeContext.tsx       # Theme context provider & hook
    └── utils/
        ├── authUtils.ts          # Base64 mock JWT generator, parser & refresh helpers
        ├── clipboardUtils.ts     # Centralized copy helper with toast & haptics
        ├── dateUtils.ts          # ISO date formatting, slot calculators & layout cluster math
        ├── feedback.ts           # Centralized audio & haptic feedback controller
        ├── searchUtils.ts        # Patient search & ID generation logic
        ├── shareUtils.ts         # System share sheet utility
        └── useRefresh.ts         # Pull-to-refresh via queryClient.invalidateQueries()
```

---

## Packages & Dependencies Reference

Below is the comprehensive inventory of all **35 packages** used in the application:

### Core Framework & Runtime
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`react`** | `19.1.0` | Core UI library for component state, hooks, and virtual DOM rendering |
| **`react-native`** | `0.81.5` | Native mobile cross-platform UI framework |
| **`expo`** | `~54.0.36` | Managed React Native development platform & native SDK 54 ecosystem |
| **`typescript`** | `^5.9.3` | Strict type checking compiler & static analysis |

### Data Fetching, State Management & Caching
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`@tanstack/react-query`** | `^5.101.4` | Server state management, background refetching, query caching & invalidation |
| **`zustand`** | `^5.0.14` | Lightweight, unopinionated client/UI state management & optimistic write mutations |
| **`axios`** | `^1.19.0` | HTTP client engine connected to custom in-memory adapter for static seed database |
| **`@react-native-async-storage/async-storage`** | `2.2.0` | Unencrypted, asynchronous, persistent key-value storage for JWT auth tokens |

### Navigation & Screen Management
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`@react-navigation/native`** | `^7.3.14` | Central navigation container & routing context provider |
| **`@react-navigation/native-stack`** | `^7.18.6` | Native stack navigator for screen transitions |
| **`@react-navigation/bottom-tabs`** | `^7.18.14` | Tab-based navigation bar engine |
| **`react-native-screens`** | `~4.16.0` | Native view primitives for optimal screen navigation performance |
| **`react-native-safe-area-context`** | `~5.6.0` | Flexible inset handling for device notches, status bars, and home indicators |

### Animations, Gestures & Layout Primitives
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`react-native-reanimated`** | `~4.1.1` | 60fps+ native thread animations, shared values, and layout transitions |
| **`react-native-gesture-handler`** | `~2.28.0` | Native touch & gesture handling system for drag-and-drop & pan gestures |
| **`react-native-worklets`** | `0.5.1` | Worklet runtime extension for Reanimated 4 thread execution |
| **`@gorhom/bottom-sheet`** | `^5.2.14` | Highly performant interactive native bottom sheet modal system |
| **`moti`** | `^0.30.0` | Universal motion package built on top of Reanimated |

### UI Feedback, Styling & Components
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`react-native-toast-message`** | `^2.4.0` | Imperative global toast notification system |
| **`react-native-svg`** | `15.12.1` | SVG rendering engine for circular progress rings (`SessionProgressRing.tsx`) |
| **`react-native-keyboard-controller`** | `1.18.5` | Smooth keyboard appearance tracking & bottom sheet avoidance |
| **`nativewind`** | `^4.2.6` | Tailwind CSS utility-first styling adapter for React Native |
| **`tailwindcss`** | `^3.4.19` | Tailwind CSS utility compiler engine |
| **`lucide-react-native`** | `^1.27.0` | Modern vector icon set |
| **`@expo/vector-icons`** | *(bundled)* | Ionicons primary vector icon library |

### Expo Native Modules
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`expo-audio`** | `~1.1.1` | Audio playback module for button clicks, slot drops, & action sound effects |
| **`expo-haptics`** | `~15.0.8` | Tactile vibration feedback engine for touch interactions & drag events |
| **`expo-clipboard`** | `~8.0.8` | Device clipboard copy helper with toast feedback |
| **`expo-sharing`** | `~14.0.8` | System share sheet integration for appointment & clinic details |
| **`expo-status-bar`** | `~3.0.9` | Dynamic theme-aware status bar controller |
| **`expo-asset`** | `~12.0.13` | Asset loader for bundled `.wav` sound files & images |
| **`expo-file-system`** | `~19.0.23` | File system access utilities |
| **`expo-location`** | `~19.0.8` | Geolocation & address lookup utilities |
| **`expo-contacts`** | `~15.0.11` | System contacts integration |
| **`expo-linear-gradient`** | `~15.0.8` | Native gradient view container |

### Development Dependencies
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`@types/react`** | `~19.1.10` | TypeScript definitions for React 19 |

---

## Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **yarn**
- **Expo Go App** (on physical iOS/Android device) OR an Android Emulator / iOS Simulator

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/suvam0107/DrPauls.git
cd DrPauls
npm install
```

### 3. Running the Application
Start the Metro bundler server with cache cleared:

```bash
npx expo start -c
```

- Press `a` to open on an connected **Android Emulator**.
- Press `i` to open on an **iOS Simulator**.
- Press `w` to open in the **Web Browser**.
- Scan the QR code using the **Expo Go** app on your physical mobile device.

---

## Quality & Verification Commands

### TypeScript Strict Mode Check
Verify that all components, stores, screens, hooks, and utilities pass strict type checking without errors:

```bash
npx tsc --noEmit
```

### Expo Project Health Check
Verify project dependencies, SDK compatibility, and configuration health:

```bash
npx expo-doctor
```

---

## Demo Receptionist Credentials

For testing and demonstration, use the quick credentials on the login screen (`AuthScreen`):

- **Staff ID**: `REC-2026-04`
- **Name**: `Anita Roy`
- **Role**: `Receptionist`
- **Clinic Branch**: `Zoo Tiniali, Guwahati, Assam`

---

## License

This project is proprietary software developed for **Dr. Paul's Multispeciality Clinic** by **Iconwizard Technologies Pvt. Ltd.**. All rights reserved.
