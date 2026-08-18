# 🩺 Dr. Paul's Multispeciality Clinic — Receptionist Console

> **Clinic Context**: Dr. Paul's Multispeciality Clinic (Guwahati, Assam)  
> **Specialities**: Hair, Skin, & Cosmetic Procedures  
> **Target Persona**: Receptionist Console (Anita Roy • Staff ID: REC-2026-04)  
> **Operating Hours**: Mon–Sun 10:00 AM – 7:00 PM (Thursday Closed)

---

## Executive Summary

**Dr. Paul's Multispeciality Clinic Console** is a high-performance, enterprise-grade React Native application built specifically for clinical receptionists to streamline daily operations—including patient appointment scheduling, multi-center calendar management, doctor availability checks, package treatment enrollments, patient reliability tracking, and clinical analytics.

Engineered with **Expo SDK 54**, **TanStack Query v5**, **Zustand v5**, **React Hook Form + Zod**, **Reanimated v4**, and **Skia Graphics**, the console delivers a fluid, 60fps+ native clinical experience. Highlights include a drag-and-drop interactive calendar with VSync auto-scrolling, debounced server-side search, persistent JWT auth token lifecycle, Robinhood OLED dark mode aesthetics, non-interrupting audio/haptic feedback, and a strict TypeScript architecture.

---

## Key Features & Architectural Highlights

### 1. TanStack Query + Zustand Coexistence Data Engine
- **Server State & Caching**: Remote data fetching, background refetching, caching (`staleTime: 2min`, `gcTime: 10min`), and deduplication are managed exclusively by **TanStack Query** (`@tanstack/react-query`).
- **Instant Zero-Flicker Rendering**: List queries (appointments, patients, doctors, centers, packages) utilize `initialData` seeded from the in-memory data store (`dataStore.ts`) for instant zero-flicker UI hydration.
- **Write-Through Optimistic Store State**: Zustand stores (`useAppointmentStore`, `usePatientStore`, `useDoctorStore`, `usePackageStore`, `useCenterStore`, `useUIStore`) own optimistic write-through mutations. Store `fetch*` methods and `loading` flags have been completely removed.
- **Mutation & Cache Invalidation**: Custom mutation hooks under `src/hooks/mutations/` wrap Zustand store write methods and automatically invalidate corresponding TanStack Query caches via `queryClient.invalidateQueries()`.
- **Centralized Query Key Registry**: All query keys are registered in `src/api/queryKeys.ts` with zero magic strings.
- **Centralized Pull-to-Refresh**: Refresh gestures trigger `queryClient.invalidateQueries()` via `src/utils/useRefresh.ts` and `AppRefreshControl.tsx`.

### 2. React Hook Form + Zod Validation Architecture
- **Unified Form Engine**: All 5 form surfaces (`AuthScreen`, `AddPatientSheet`, `AddDoctorSheet`, `CreateAppointmentSheet`, `RescheduleModal`) utilize a standardized **React Hook Form + Zod** architecture with `@hookform/resolvers/zod`.
- **Centralized Domain Schemas**: Maintained under `src/schemas/` (`authSchema.ts`, `patientSchema.ts`, `doctorSchema.ts`, `appointmentSchema.ts`, `rescheduleSchema.ts`).
- **Reusable `FormField` Wrapper**: Typed `FormField.tsx` component handles consistent label formatting, required field asterisks, custom inputs via RHF `<Controller>`, and inline validation error text.
- **Discriminated Union Creation Schema**: `appointmentSchema.ts` uses `z.discriminatedUnion` on `activeTab` to validate Normal vs. Package session bookings independently.

### 3. Debounced Server-Side Search Architecture
- **Controlled Search System**: Search inputs across all screens (`SearchInput`, `PatientSearchInput`, screens for Patients, Appointments, Packages, Enrollments, Past Appointments, Doctors) feature controlled inputs powered by a custom `useDebounce` hook (200ms delay, 1-character threshold).
- **Zero-Delay UI Typing**: Local input state updates immediately on keypress, while debounced queries trigger TanStack Query server-side search hooks starting on the first character.
- **Skeleton Search Indicators**: Displays inline activity spinners and skeleton loading cards during active search fetches.

### 4. Interactive Drag-and-Drop Calendar Engine
- **Triple View Modes**: Instant toggle between **Day**, **Week**, and **Month** grid layouts.
- **Gesture Drag-and-Drop**: Reschedule `Scheduled`, `Confirmed`, and `Rescheduled` appointment chips across timeslots and days via native gesture pan handlers (`PanResponder`) with 0.5 ghosting opacity and red unavailable overlay highlights.
- **Reschedule Confirmation Guard**: Drag releases and edit modals trigger `RescheduleConfirmationModal`, prompting receptionists to verify date/time, doctor assignment, and priority impact before committing.
- **Original Schedule Audit Log**: Preserves historical schedule metadata (`originalSchedule: { date, startTime, doctorName, rescheduledAt }`) rendered in `AppointmentDetailModal`.
- **VSync Auto-Scroll**: Native `requestAnimationFrame` loop tethered to display refresh VSync ticks allows smooth edge scrolling when dragging near top header or bottom navbar bounds.
- **Multi-Doctor Concurrent Layout**: Greedy algorithm renders overlapping appointments side-by-side (50% width for 2, 33.3% for 3 concurrent appointments).
- **Collision & Double-Booking Guards**: Prevents booking overlapping slots for the same doctor or double-booking a patient across different doctors at the same time.

### 5. Packaged Treatment Sessions & Enrollment Lifecycle
- **Package Session Tracking**: Auto-schedules multi-session treatment packages with configurable interval spacing (7, 14, 21, or 30 days) and enrollment-level therapist assignment.
- **Session Action Rules**: Receptionists can mark sessions attended (`Paid`), cancel sessions, or reschedule sessions.
- **Shift Remaining Sessions**: Cancel/reschedule actions present a prompt allowing receptionists to shift all remaining future sessions forward by the date delta.
- **Pause & Resume**: Pause active package enrollments (setting future sessions to `Pending`) or resume with new start dates.
- **Visual Progress & Widgets**: `SessionProgressRing` SVG circular progress indicators and `UpcomingSessionsWidget` on the main dashboard.

### 6. Patient Reliability & Visual Accent Engine
- **Dynamic Reliability Formula**: Evaluated dynamically via `calculatePatientPriority(rescheduleCount)`:
  - `0 reschedules` -> 🟢 **High Reliability** (`#10B981`)
  - `1–2 reschedules` -> 🟡 **Medium Reliability** (`#F59E0B`)
  - `3+ reschedules` -> 🔴 **Low Reliability** (`#EF4444`)
- **Prominent Border Highlights**: Patient cards across `PatientListScreen`, `PatientDetailModal`, `PatientRecordsScreen`, and `AppointmentsScreen` feature 5px left accent borders (`borderLeftWidth: 5`) and 1px outline glows.

### 7. Canonical Status Engine & Directory Filters
- **8 Status Classifications**: `Scheduled`, `Confirmed`, `Paid`, `Pending`, `Rescheduled`, `Overdue`, `Unattended`, `Cancelled`.
- **`StatusChip` Logic**: Evaluates `effectiveStatus` cleanly: active `Pending` items render Amber **Pending**; past `Pending` items render Red **Overdue**; past unfulfilled `Scheduled`/`Confirmed` items render Rose **Unattended**.
- **Directory Global Scanning**: Status filter bar in `AppointmentsScreen` enables global searching across all dates for `Overdue` and `Unattended` items.

### 8. Interactive Skia & Victory Native Clinical Analytics
- **High-Performance Charts**: `ReportsScreen.tsx` utilizes `@shopify/react-native-skia` and `victory-native` for volume, source acquisition, and status distribution charts.
- **Exact Donut/Pie Touch Math**: Canvas touch angle detection (`atan2` / `findSliceFromTouch`) aligned with Skia geometry to trigger `ChartDetailModal` with slice counts, percentages, and clinical insights.
- **45-Degree Tilted Axis Ticks**: `labelRotate: -45` rendering full channel names crisply without truncation.

### 9. Robinhood Dark Theme, Audio & Haptic Engine
- **Robinhood OLED Dark Mode**: Deep pitch-black background (`#000000`), elevated dark cards (`#131722`), crisp typography, and Robinhood electric color tokens (`#3875F6` blue, `#00C805` emerald green, `#FF9500` amber, `#FF3B30` red).
- **Non-Interrupting Audio Mixing**: `expo-audio` system mixing (`setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' })`) enables UI sound effects to play without interrupting background music (Spotify, podcasts).
- **Tactile Haptic Feedback**: Integrated `expo-haptics` vibration responses for button taps, modal triggers, calendar slot snaps, and drag actions.
- **Shimmer Skeleton Engine**: `SkeletonBox.tsx` powers continuous left-to-right gradient shimmer animations using `expo-linear-gradient` and `react-native-reanimated` for smooth loading states.

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
    ├── api/                       # Axios Data Layer & TanStack Query Infrastructure (@DataEngineer)
    │   ├── adapter.ts             # Custom Axios adapter routing spc keys to in-memory handlers
    │   ├── axiosConfig.ts         # Axios instance setup with base URL, headers & interceptors
    │   ├── dataStore.ts           # In-memory session store hydrated from assets/data/*.json
    │   ├── index.ts               # Barrel export for API layer
    │   ├── queryClient.ts         # Singleton QueryClient (staleTime=2min, gcTime=10min)
    │   ├── queryKeys.ts           # Centralized TanStack Query key factory (no magic strings)
    │   ├── types.ts               # ApiFamily, SpcKey, ApiRequest, ApiResponse definitions
    │   ├── handlers/              # Nested & non-nested relational request handlers
    │   └── services/              # Entity API services (appointment, center, doctor, package, patient, staff, therapist)
    ├── schemas/                   # Zod Form Validation Schemas (@DataEngineer & @Frontend)
    │   ├── index.ts               # Barrel export for domain schemas
    │   ├── authSchema.ts          # Sign In form schema & type definitions
    │   ├── patientSchema.ts       # Quick patient registration schema
    │   ├── doctorSchema.ts        # Doctor registration & schedule schema
    │   ├── appointmentSchema.ts   # Discriminated union appointment creation schema (Normal vs Package)
    │   └── rescheduleSchema.ts    # Appointment reschedule & slot change schema
    ├── types/
    │   └── index.ts               # Central TypeScript type definitions & domain interfaces
    ├── components/
    │   ├── Header.tsx             # Top app bar with safe area top inset & center switch toggle
    │   ├── BottomNav.tsx          # 3-tab bottom navigation bar with animated sliding indicator & [+] FAB
    │   ├── SidebarDrawer.tsx      # Reanimated slide-in navigation drawer
    │   ├── SidebarContainer.tsx   # Drawer wrapper container
    │   ├── appointment/
    │   │   ├── AddPatientSheet.tsx       # Quick patient creation bottom sheet
    │   │   ├── CreateAppointmentSheet.tsx # Validated appointment scheduling bottom sheet
    │   │   └── PatientSearchInput.tsx     # Debounced patient search dropdown
    │   ├── calendar/
    │   │   ├── CalendarHeader.tsx # Date navigator, view mode toggle, & status filters
    │   │   ├── CalendarGrid.tsx   # Synchronized time grid container (Day & Week views)
    │   │   ├── DraggableChip.tsx  # rAF auto-scroll Drag-and-Drop chip wrapper
    │   │   ├── AppointmentChip.tsx# Individual appointment card component
    │   │   ├── MonthGrid.tsx      # 7x5 month view matrix component
    │   │   ├── RescheduleModal.tsx# Validated appointment edit modal
    │   │   └── AppointmentDetailModal.tsx # Appointment detail sheet with audit log
    │   ├── doctor/
    │   │   ├── AddDoctorSheet.tsx # Add new doctor sheet
    │   │   └── DoctorDetailModal.tsx # Doctor detail & schedule sheet
    │   ├── package/
    │   │   ├── PackageEnrollmentDetailSheet.tsx # Package timeline & session manager
    │   │   ├── PackageSessionCard.tsx           # Individual session action card
    │   │   ├── SessionProgressRing.tsx          # Reanimated SVG circular progress ring
    │   │   └── UpcomingSessionsWidget.tsx       # Home screen package widget
    │   ├── patient/
    │   │   └── PatientDetailModal.tsx # Patient detail & reliability profile sheet
    │   ├── shared/
    │   │   ├── AppRefreshControl.tsx # Theme-aligned pull-to-refresh control component
    │   │   ├── AppToast.tsx       # Global themed toast notification component
    │   │   ├── BottomSheet.tsx    # Native bottom sheet modal wrapper with safe area insets
    │   │   ├── CenterSwitchSheet.tsx # Clinic center switch bottom sheet
    │   │   ├── ExitConfirmationModal.tsx  # Exit app confirmation modal dialog
    │   │   ├── ForgotPasswordModal.tsx# Password reset contact admin modal dialog
    │   │   ├── FormField.tsx      # Reusable typed form field wrapper with inline errors
    │   │   ├── LogoutConfirmationModal.tsx# Sign out confirmation modal dialog
    │   │   ├── QuickAddPopup.tsx  # Floating action popup above navbar
    │   │   ├── RescheduleConfirmationModal.tsx # D&D reschedule confirmation dialog
    │   │   ├── SearchInput.tsx    # Debounced search bar with clear button
    │   │   ├── Select.tsx         # Custom dropdown selector
    │   │   ├── SkeletonBox.tsx    # Gradient shimmer beam skeleton animation component
    │   │   └── StatusChip.tsx     # Color-coded status badge
    │   └── skeletons/             # 11 Skeleton loading components for instant zero-flicker screens
    ├── constants/
    │   └── index.ts               # Status definitions, slot dimensions, & color tokens
    ├── hooks/                     # Custom TanStack Query Hooks & Utilities (@DataEngineer)
    │   ├── queries/               # Custom useQuery hooks (appointments, patients, doctors, centers, packages, staff)
    │   ├── mutations/             # Custom useMutation hooks (appointment, patient, doctor, package)
    │   └── useScrollNavbar.ts     # Scroll-driven bottom navbar translation animation hook
    ├── screens/
    │   ├── AuthScreen.tsx         # Sign In page with Quick Demo pills & RHF validation
    │   ├── HomeScreen.tsx         # Clinic overview dashboard with stat grid, live status & package widget
    │   ├── CalendarScreen.tsx     # Appointment calendar screen (Day, Week, Month views)
    │   ├── AppointmentsScreen.tsx # Directory with grouping, range filters & status chips
    │   ├── PatientListScreen.tsx  # Patient directory screen with priority accent highlights
    │   ├── PatientRecordsScreen.tsx # Patient past records & interactive timeline
    │   ├── DoctorScreen.tsx       # Doctor & therapist directory screen with direct call launcher
    │   ├── AvailablePackagesScreen.tsx # Treatment packages catalog
    │   ├── PatientEnrollmentsScreen.tsx # Active package enrollments dashboard
    │   ├── ReportsScreen.tsx      # Analytics dashboard with interactive Skia/Victory charts
    │   └── SettingsScreen.tsx     # Staff Profile & Sign Out screen
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

Below is the complete inventory of all **33 packages** configured in `package.json`:

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
| **`zustand`** | `^5.0.14` | Lightweight client/UI state management & optimistic write mutations |
| **`axios`** | `^1.19.0` | HTTP client engine connected to custom in-memory adapter for static seed database |
| **`@react-native-async-storage/async-storage`** | `2.2.0` | Unencrypted persistent key-value storage for JWT auth tokens |

### Form Engine & Validation
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`react-hook-form`** | `^7.85.0` | Performance-focused form state management & controller engine |
| **`zod`** | `^4.4.3` | TypeScript-first schema declaration and validation library |
| **`@hookform/resolvers`** | `^5.9.1` | Zod resolver integration layer for React Hook Form |

### Graphics, Charts & Visual Effects
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`@shopify/react-native-skia`** | `2.2.12` | 2D Skia canvas graphics engine for high-performance chart rendering |
| **`victory-native`** | `^41.26.0` | React Native charts library powered by Skia graphics engine |
| **`expo-linear-gradient`** | `~15.0.8` | Native gradient view container for `SkeletonBox.tsx` shimmer effects |

### Animations, Gestures & Layout Primitives
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`react-native-reanimated`** | `~4.1.1` | 60fps+ native thread animations, shared values, and layout transitions |
| **`react-native-gesture-handler`** | `~2.28.0` | Native touch & gesture handling system for drag-and-drop & pan gestures |
| **`react-native-worklets`** | `0.5.1` | Worklet runtime extension for Reanimated 4 thread execution |
| **`@gorhom/bottom-sheet`** | `^5.2.14` | Performant interactive native bottom sheet modal system |
| **`react-native-safe-area-context`** | `~5.6.0` | Flexible inset handling for device notches, status bars, and home indicators |

### UI Feedback, Styling & Components
| Package | Version | Description / Role |
| :--- | :--- | :--- |
| **`react-native-toast-message`** | `^2.4.0` | Imperative global toast notification system |
| **`react-native-svg`** | `15.12.1` | SVG rendering engine for circular progress rings (`SessionProgressRing.tsx`) |
| **`react-native-keyboard-controller`** | `1.18.5` | Smooth keyboard appearance tracking & bottom sheet avoidance |
| **`nativewind`** | `^4.2.6` | Tailwind CSS utility-first styling adapter for React Native |
| **`tailwindcss`** | `^3.4.19` | Tailwind CSS utility compiler engine |
| **`@expo/vector-icons`** | `^15.0.3` | Expo Ionicons primary vector icon library |

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
Verify that all components, stores, screens, schemas, hooks, and utilities pass strict type checking without errors:

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
