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
- **Keyboard Handling & Form Scroll Enhancements (`@Frontend` & `@UXEngineer`)**:
  - `AuthScreen.tsx`: Replaced `KeyboardAwareScrollView` with `KeyboardAvoidingView` + `ScrollView` (`behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`). When the keyboard opens, the container lifts the entire Sign In card above the keyboard as a single unified layout translation. Switching focus between Email and Password fields (or pressing enter/tick to navigate between inputs) inside the card produces zero scroll offset recalculations, completely eliminating field-switching jitter whether the status error banner is visible or hidden.
  - `BottomSheet.tsx`: Refactored `BottomSheet` component lifecycle to mount `InnerSheet` with `index={0}` inside `Modal` when `visible === true`, removing `openKey` state re-mounting that was resetting bottom sheet animation frames.
  - `CenterSwitchSheet.tsx` & `AppointmentDetailModal.tsx`: Migrated internal content scrollables from standard React Native `<ScrollView>` to `@gorhom/bottom-sheet` `<BottomSheetScrollView>`. Standard React Native `ScrollView` inside a Gorhom BottomSheet collapses or fails to layout content height; migrating to `BottomSheetScrollView` fixes content rendering and gesture scroll calculations across Center Switch dropdown and Appointment Details modals across all screens.
  - All 8 Bottom Sheet Modals (`AddPatientSheet`, `AddDoctorSheet`, `CreateAppointmentSheet`, `CenterSwitchSheet`, `PatientDetailModal`, `DoctorDetailModal`, `RescheduleModal`, `AppointmentDetailModal`): Confirmed all 8 modals consume `BottomSheetScrollView` with proper safe-area bottom padding (`paddingBottom: 220px-240px`).
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
