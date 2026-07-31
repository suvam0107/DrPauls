# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-07-31` — Major Design & UX Enhancements completed by `@Frontend` & `@UXEngineer`.

---

## Current Sprint Focus

### Major Design & UX Overhaul (`@Frontend` & `@UXEngineer`)
- **Sound/Haptic Feedback Audit (`@UXEngineer`)**:
  - Verified and added click audio/haptic responses for day chip toggles in `AddDoctorSheet`, action buttons in `PatientDetailModal` & `AppointmentDetailModal`, and floating options in `QuickAddPopup`.
- **Calendar Drag & Drop Safeguards (`@Frontend`)**:
  - `DraggableChip.tsx`: Blocked drag-and-drop rescheduling for past appointments by enforcing `isPastSlot()` date/time validation in chip drag eligibility checks.
- **Switch Track Color Visibility (`@Frontend`)**:
  - `SettingsScreen.tsx` & `CreateAppointmentSheet.tsx`: Configured explicit `trackColor={{ false: colors.border, true: colors.primary }}` on `<Switch>` components for high-contrast visibility in light and dark modes.
- **Calendar Disabled Timeslot Contrast (`@UXEngineer`)**:
  - `CalendarGrid.tsx`: Adjusted disabled/past slot background overlays to `rgba(255,255,255,0.08)` in dark mode (lighter) and `rgba(0,0,0,0.08)` in light mode (darker) for distinct theme visibility across week and day views.
- **Keyboard Handling for Forms (`@Frontend`)**:
  - `App.tsx`: Wrapped root with `<KeyboardProvider>` from `react-native-keyboard-controller`.
  - `BottomSheet.tsx`: Configured `keyboardBehavior="interactive"` and `keyboardBlurBehavior="none"` on `@gorhom/bottom-sheet` for seamless keyboard-sync height translation.
  - All form components (`CreateAppointmentSheet`, `AddPatientSheet`, `AddDoctorSheet`, `DoctorDetailModal`, `PatientDetailModal`, `RescheduleModal`, `AuthScreen`): Swapped standard `ScrollView` with `KeyboardAwareScrollView` with `bottomOffset={30}` and `extraKeyboardSpace={20}` for precise field auto-scrolling on focus.
- **Bottom Sheet Library Migration (`@Frontend`)** *(v2 — bug fixes)*:
  - `App.tsx`: Removed `BottomSheetModalProvider` (no longer needed). `GestureHandlerRootView` at root handles app gestures.
  - `BottomSheet.tsx`: Replaced `BottomSheetModal`+provider approach with `BottomSheet`+`Modal` pattern. Each open mounts a fresh `InnerSheet` (keyed) inside a React Native `Modal`, which owns its own `GestureHandlerRootView` (required — Modal creates a new native view tree). Fixes: reopen-after-close bug, inconsistent open failures, theming (full `colors.card` control), swipe-to-close sensitivity (`overDragResistanceFactor=10`).
- **Long-Press Clipboard Copy (`@Frontend` & `@UXEngineer`)**:
  - Created `src/utils/clipboardUtils.ts` wrapping `expo-clipboard` with haptic feedback and toast notification.
  - Enabled long-press copy on phone, address, and email fields in `DoctorScreen`, `PatientListScreen`, `SettingsScreen`, `DoctorDetailModal`, and `PatientDetailModal`.

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `@gorhom/bottom-sheet`, `react-native-keyboard-controller`, `expo-clipboard` installed
- [x] Multi-Center Global State Architecture (`assets/data/centers.json`, `useCenterStore.ts`, `useUIStore.ts`)
- [x] Native Gesture Bottom Sheet Modal System (`BottomSheet.tsx` via `@gorhom/bottom-sheet`)
- [x] Form Keyboard Scroll Inset Engine (`react-native-keyboard-controller`)
- [x] Long-Press Clipboard Copy (`clipboardUtils.ts` via `expo-clipboard`)
- [x] Calendar Past-Appointment Drag-Drop Guard (`DraggableChip.tsx`)
- [x] Calendar Disabled Slot High-Contrast Styling (`CalendarGrid.tsx`)
- [x] Switch Track Visibility Fix in Light Mode (`SettingsScreen.tsx`, `CreateAppointmentSheet.tsx`)
- [x] Sound & Haptic Feedback Audit (`feedback.ts`, `AddDoctorSheet.tsx`, `PatientDetailModal.tsx`)
- [x] `npx tsc --noEmit` — 0 errors

---

## Blockers
_None_

## Notes
- `npx tsc --noEmit`: 0 errors.
