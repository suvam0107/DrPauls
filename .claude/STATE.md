# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-07-28` — Persistent disk storage integration (`@react-native-async-storage/async-storage`) for JWT session token management and complete token deletion on logout.

## Current Sprint Focus
- **Persistent AsyncStorage Token Engine (`@Frontend` & `@DataEngineer`)**:
  - Installed `@react-native-async-storage/async-storage` and integrated into [`useAuthStore.js`](file:///d:/IconWizard/DrPauls/src/store/useAuthStore.js).
  - **App Startup Flow**: `checkAndVerifyAuth()` reads `@drpauls_jwt_token` from persistent device storage.
    - If a valid token exists, the user is **directly routed to the Home Page** without seeing the login page.
    - If token is missing, expired, or deleted, the user is presented with the **Login Page (`AuthScreen.js`)**.
  - **Token Persistence**: Un-signed-out user sessions persist permanently across app restarts/reopens with 24h token auto-refresh.
  - **Disk Token Deletion on Logout**: Clicking Sign Out in `SettingsScreen.js` and confirming in `LogoutConfirmationModal.js` calls `AsyncStorage.removeItem('@drpauls_jwt_token')`, permanently deleting the token from the device so logged-out users can never be auto-logged back in.

## Status

### Infrastructure & Dependencies
- [x] Expo SDK 54.0.36
- [x] `@react-native-async-storage/async-storage` installed & integrated
- [x] Mock JWT 24-hour token issuance & auto-refresh
- [x] Persistent disk storage token verification on app launch (`checkAndVerifyAuth`)
- [x] Direct Home Page entry for active token sessions
- [x] Permanent disk token deletion on Sign Out (`AsyncStorage.removeItem`)
- [x] `react-native-safe-area-context` integrated across screens and modals
- [x] `react-native-toast-message` bottom offset configured
- [x] Zustand state management & seed persistence
- [x] NativeWind + Tailwind CSS v3
- [x] Reanimated v4 setup
- [x] `expo-doctor` — 18/18 checks pass

### Components & Screens (@Frontend & @DataEngineer)
- [x] `useAuthStore.js` — AsyncStorage persistent token engine & token deletion on logout.
- [x] `App.js` — Startup token check & direct Home Page entry flow.
- [x] `AuthScreen.js` — Dedicated Sign In page with Quick Demo pills.
- [x] `SettingsScreen.js` — Profile Card with Receptionist ID & mobile number; Sign Out button at very bottom calling disk token removal.
- [x] `LogoutConfirmationModal.js` & `ExitConfirmationModal.js`.
- [x] `SidebarDrawer.js`, `Header.js`, `BottomNav.js`.

---

## Blockers
_None_

## Notes
- All 18 expo-doctor checks pass cleanly.
