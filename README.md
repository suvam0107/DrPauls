# 🩺 Dr. Paul's Multispeciality Clinic — Receptionist Console

> **Clinic Context**: Dr. Paul's Multispeciality Clinic (Guwahati, Assam)  
> **Specialities**: Hair, Skin, & Cosmetic Procedures  
> **Target Persona**: Receptionist Console  
> **Operating Hours**: Mon–Sun 10:00 AM – 7:00 PM (Thursday Closed)

---

## Executive Summary

**Dr. Paul's Multispeciality Clinic Console** is a high-performance, enterprise-grade React Native mobile & web application built specifically for clinical receptionists to manage patient appointments, doctor schedules, patient records, and clinic analytics.

Powered by **Expo SDK 54**, **Zustand**, and **Reanimated**, the app delivers a fluid clinical workflow experience—featuring an advanced drag-and-drop calendar engine, multi-doctor concurrent slot positioning, persistent JWT authentication, dynamic safe-area insets, and theme-aligned toast notifications.

---

## Key Features & Highlights

### 1. Advanced Interactive Calendar & Rescheduling Engine
- **Triple View Modes**: Seamless toggle between **Day**, **Week**, and **Month** grid layouts.
- **Drag-and-Drop Rescheduling**: Reschedule `Scheduled`, `Confirmed`, and `Rescheduled` appointment chips across timeslots and days via intuitive gesture pan handlers (`PanResponder`).
- **VSync Auto-Scroll**: Uses a native `requestAnimationFrame` loop tethered directly to display refresh VSync ticks. Dragging chips near the top header or bottom navbar auto-scrolls the grid with zero jitter and zero frame drops, keeping the chip anchored under the finger in lockstep.
- **Multi-Doctor Concurrent Split Layout**: Employs a greedy graph-coloring algorithm (`computeAppointmentLayouts`) to render overlapping appointments for different doctors side-by-side (50% width for 2 concurrent, 33.3% for 3), ensuring 100% visibility.
- **Strict Collision & Double-Booking Prevention**:
  - **Doctor Collision Check**: Prevents scheduling or moving two appointments for the same doctor in overlapping time intervals.
  - **Patient Double-Booking Check**: Prevents a patient from having two concurrent appointments across different doctors at the same time.
- **Past Timeslot Protection**: Tapping on any past timeslot is visually dimmed (`rgba(0,0,0,0.2)`) and touch-disabled (`isPastSlot`), preventing invalid historical appointments.
- **Week Date Header Touch Navigation**: Tapping any date cell in the Week View header row updates `selectedDate` and directly opens that day in **Day View**.

### 2. Persistent JWT Authentication Lifecycle
- **Disk Token Persistence**: Auth tokens stored securely in `@react-native-async-storage/async-storage` (`@drpauls_jwt_token`).
- **Direct Startup Gate**: On app launch, `checkAndVerifyAuth()` validates the stored token. If valid, the receptionist lands directly on the **Home Dashboard** without encountering the login screen.
- **24-Hour Issuance & Auto-Refresh**: Tokens auto-refresh seamlessly during active use.
- **Permanent Purge on Sign Out**: Confirming sign out permanently removes the token from disk storage, re-enforcing login security.

### 3. Theme Engine & Clinical Design System
- **Light / Dark Mode**: Full dynamic theme provider (`ThemeContext`) with curated medical color palettes.
- **Global Theme-Bound AppToast**: Custom toast notifications (`AppToast.tsx`) automatically aligned with the active theme and elevated above the bottom navigation bar (`BottomNav`) with safe-area offset protection.
- **Micro-Interactions**: Smooth 90ms–140ms `withTiming` Easing transitions; avoids distracting spring animations.
- **Android Back Button Policy**: Intercepts native hardware back presses to manage drawer toggles, bottom sheet dismissals, navigation history, and home exit modals (`ExitConfirmationModal`).

### 4. Comprehensive Clinical Management Modules
- **Clinic Overview Dashboard**: Real-time 2x2 stat grid (Today's Total, Confirmed, Pending, Rescheduled counts) with quick action shortcuts.
- **Patient Directory**: Debounced search, patient profile cards, medical history, and therapist assignment details.
- **Doctor Schedule Manager**: Availability toggles, consultation fee structures, and working hours display.
- **Reports & Analytics Console**: Comprehensive breakdown of clinic revenue, package sales, and patient volume.
- **Receptionist Settings**: Staff profile information (`DRP-R-0042`), theme preferences, and secure logout confirmation dialogs.

---

## Project Directory Architecture

```
DrPauls/
├── App.tsx                        # Root entrypoint + Auth Token Gate + SafeAreaProvider + BackHandler + Toast
├── index.ts                       # Expo application registry entrypoint
├── tsconfig.json                  # Strict TypeScript compiler configuration
├── metro.config.js                # Metro bundler configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── package.json                   # Project dependencies & scripts
└── src/
    ├── types/
    │   └── index.ts               # Central domain TypeScript interfaces & types
    ├── components/
    │   ├── Header.tsx             # Top app bar with safe area top inset & drawer toggle
    │   ├── BottomNav.tsx          # 3-tab bottom navigation bar with safe area bottom inset
    │   ├── SidebarDrawer.tsx      # Reanimated slide-in navigation drawer
    │   ├── appointment/
    │   │   ├── AddPatientSheet.tsx       # Quick patient creation bottom sheet
    │   │   ├── CreateAppointmentSheet.tsx # Bottom sheet modal to schedule appointments
    │   │   └── PatientSearchInput.tsx     # Debounced patient search dropdown
    │   ├── calendar/
    │   │   ├── CalendarHeader.tsx # Date navigator, view mode toggle, & status filters
    │   │   ├── CalendarGrid.tsx   # Synchronized time grid container (Day & Week views)
    │   │   ├── DraggableChip.tsx  # rAF auto-scroll Drag-and-Drop chip wrapper
    │   │   ├── AppointmentChip.tsx# Individual appointment card component
    │   │   ├── MonthGrid.tsx      # 7x5 month view matrix component
    │   │   └── AppointmentDetailModal.tsx # Appointment detail bottom sheet
    │   └── shared/
    │       ├── AppToast.tsx       # Global themed toast notification component
    │       ├── BottomSheet.tsx    # Translucent Modal portal with safe area insets
    │       ├── ExitConfirmationModal.tsx  # Exit app confirmation modal dialog
    │       ├── LogoutConfirmationModal.tsx# Sign out confirmation modal dialog
    │       ├── SearchInput.tsx    # Debounced search bar with clear button
    │       ├── Select.tsx         # Custom dropdown selector
    │       └── StatusChip.tsx     # Color-coded status badge
    ├── constants/
    │   └── index.ts               # Status definitions & color tokens
    ├── data/
    │   └── mockData.ts            # Seed dataset with 30 comprehensive appointment records
    ├── screens/
    │   ├── AuthScreen.tsx         # Sign In page with Quick Demo pills
    │   ├── HomeScreen.tsx         # Clinic overview dashboard with 2x2 stat grid
    │   ├── CalendarScreen.tsx     # Appointment calendar screen
    │   ├── PatientListScreen.tsx  # Patient directory screen
    │   ├── DoctorScreen.tsx       # Doctor schedule screen
    │   ├── ReportsScreen.tsx      # Reports & analytics screen
    │   └── SettingsScreen.tsx     # Settings screen with Staff Profile & Sign Out
    ├── store/
    │   ├── useAuthStore.ts        # Persistent AsyncStorage Auth Token engine
    │   ├── useAppointmentStore.ts # Appointment state, validateSlot & mock sync
    │   ├── usePatientStore.ts     # Patient directory state management
    │   ├── useDoctorStore.ts      # Doctor schedule & availability state
    │   └── useUIStore.ts          # UI theme & layout state
    ├── theme/
    │   ├── colors.ts              # Dark & light color tokens
    │   └── ThemeContext.tsx       # Theme context provider & hook
    └── utils/
        ├── authUtils.ts          # Base64 mock JWT generator, parser & refresh helpers
        ├── dateUtils.ts          # ISO date formatting, slot calculators & layout cluster math
        └── searchUtils.ts        # Patient search & ID generation logic
```

---

## Technology Stack & Libraries

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) / [Expo SDK 54](https://docs.expo.dev/) | Cross-platform runtime & native components |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) | Complete end-to-end type safety & Intellisense |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight, unopinionated global state stores |
| **Persistence** | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) | Persistent JWT token storage across restarts |
| **Animations** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | 60fps native thread drawer & modal transitions |
| **Safe Area Insets** | [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) | Top/bottom notch & navigation bar padding |
| **Toasts** | [react-native-toast-message](https://github.com/calintamas/react-native-toast-message) | Elevated global toast engine |
| **Icons** | [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons) | Vector iconography |

---

## Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **Expo Go App** (on iOS/Android device) OR an Android Emulator / iOS Simulator

### 2. Installation
Clone the repository and install project dependencies:

```bash
git clone https://github.com/suvam0107/DrPauls.git
cd DrPauls
npm install
```

### 3. Running the Application
Start the Metro bundler server:

```bash
npx expo start --clear
```

- Press `a` to open on an connected **Android Emulator**.
- Press `i` to open on an **iOS Simulator**.
- Press `w` to open in the **Web Browser**.
- Scan the QR code using the **Expo Go** app on your physical mobile device.

---

## Quality & Verification Commands

### TypeScript Strict Mode Check
Verify that all components, stores, screens, and utilities pass strict type checking without errors:

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
