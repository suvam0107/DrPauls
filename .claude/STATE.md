# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-07-30` — Appointment Availability Enforcement, Closing Animations, Modal Isolation & Data Alignment completed by `@Frontend` and `@DataEngineer`.

---

## Current Sprint Focus

### Multi-Center Refinement & UX Adjustments
- **Center & Appointment Data Alignment (`@DataEngineer`)**:
  - `centers.json`: Permanently removed `cc_hash` property from center records.
  - `types/index.ts`: Removed `cc_hash` from `Center` TypeScript interface.
  - `appointments.json`: Comprehensive audit and synchronization of all 30 appointment records across `dayOffset` range (-2 to 10). Realigned center assignments (`CC-001`, `CC-002`, `CC-003`), doctor schedules (`DOC-001`, `DOC-002`, `DOC-003`), center open days, doctor working days, working hours, and therapist specializations.
- **Header & Center Selector Polish (`@Frontend`)**:
  - `Header.tsx`: Removed pill box/background/border. Replaced with clean, larger text, location icon, and chevron-down icon.
  - `CenterSwitchSheet.tsx`: Removed phone number and open timings from center cards in selection sheet.
- **Settings Screen Integration (`@Frontend`)**:
  - `SettingsScreen.tsx`: Added full active center details card (Center Name, Main status, Company Name, Address, State, Pin Code, Phone, Email, Open/Closed Days & Timings) matching `activeCenterId`.
- **Appointment Availability Enforcement (`@Frontend`)**:
  - `useAppointmentStore.ts`: Updated `validateSlot` to strictly validate doctor availability on specific dates and within working hours (`isDoctorAvailableOnDate`).
  - `RescheduleModal.tsx` & `CreateAppointmentSheet.tsx`: Replaced warning boxes with explicit error notices and disabled the submit/save buttons when doctor is unavailable or no valid time slots exist.
  - `DraggableChip.tsx`: Prevents drag-and-drop moves to unavailable slots with error feedback.
- **Closing Animations for Popups (`@Frontend`)**:
  - `QuickAddPopup.tsx`: Implemented `isMounted` state and Reanimated exit transition so the popup animates out smoothly on close.
  - `Select.tsx`: Added Reanimated slide + opacity closing animations for dropdown pickers used inside bottom sheets.
- **Overlapping Modal Isolation (`@Frontend`)**:
  - `AppointmentDetailModal.tsx`: Fixed `RescheduleModal` close callback so closing `RescheduleModal` only closes itself without triggering parent modal closure.
  - `RescheduleModal.tsx`, `CreateAppointmentSheet.tsx` & `Select.tsx`: Isolated backdrop press events and date picker overlays so tapping backdrop closes only the top-most active modal overlay.

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] Multi-Center Global State Architecture (`assets/data/centers.json`, `useCenterStore.ts`, `useUIStore.ts`)
- [x] Strict Doctor Availability Enforcement (disallows scheduling on unavailable days/times)
- [x] Smooth Closing Animations for Popups & Dropdown Pickers (`QuickAddPopup.tsx`, `Select.tsx`)
- [x] Overlapping Modal Stack Isolation (closing edit/reschedule leaves detail modal open)
- [x] `npx tsc --noEmit` — 0 errors

---

## Blockers
_None_

## Notes
- `npx tsc --noEmit`: 0 errors.
