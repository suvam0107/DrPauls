# STATE.md — DrPauls Clinic App

> This file is updated at the end of every prompt/session to reflect current project state.
> Agents MUST read this file before starting any work.

---

## Last Updated
`2026-07-30` — Major Data Layer Migration completed by `@DataEngineer`. All mock data extracted to JSON files under `assets/data/*.json`. Built an elaborate Axios Interceptor API layer (`src/api/`) with custom adapter handling `/nested` and `/nonnested` endpoint families using `spc` identification keys. Zustand stores refactored to use API services. `src/data/mockData.ts` permanently deleted.

---

## Current Sprint Focus

### JSON File-System Data Layer & Axios Interceptor Migration (`@DataEngineer`)
- **JSON Seed Files (`assets/data/`)**:
  - `patients.json`: 7 patient records
  - `doctors.json`: 3 doctor records
  - `therapists.json`: 3 therapist records
  - `packages.json`: 2 package records with dynamic date offset resolution
  - `appointments.json`: 30 appointment records with dynamic date offset resolution
  - `staff.json`: Staff user profile
- **In-Memory Data Store (`src/api/dataStore.ts`)**:
  - Hydrated from `assets/data/*.json` on application startup with relative ISO date offset resolution.
- **Custom Axios Adapter & Interceptors (`src/api/`)**:
  - Custom `customDataStoreAdapter` intercepts all requests to `http://drpauls.local/api/v1`.
  - Endpoint families: `/nonnested` (flat CRUD) and `/nested` (relational queries & stats).
  - Request identification via `spc` (specific) payload keys (`get_all_patients`, `get_appointments_by_date`, `search_patients`, `get_today_stats`, etc.).
  - Request Interceptor attaches `Authorization: Bearer <token>` from AsyncStorage & ISO timestamps.
  - Response Interceptor standardizes unwrapping & error responses.
- **Zustand Store Refactoring (`src/store/`)**:
  - `useAppointmentStore.ts`, `usePatientStore.ts`, `useDoctorStore.ts` refactored to route mutations and queries through `appointmentService`, `patientService`, `doctorService`, `therapistService`.
  - Zero imports from `mockData.ts` remain.
- **Cleanup**: `src/data/mockData.ts` permanently deleted.

---

## Status

### Infrastructure & Dependencies
- [x] Full TypeScript strict mode (`tsconfig.json`, `src/types/index.ts`)
- [x] Expo SDK 54.0.36
- [x] `axios` installed & configured with custom adapter & interceptors
- [x] JSON File-System data source in `assets/data/`
- [x] `/nested` and `/nonnested` endpoint families with `spc` identification keys
- [x] Typed API services (`appointmentService`, `patientService`, `doctorService`, `therapistService`, `packageService`, `staffService`)
- [x] Stores refactored to use API services
- [x] Deleted `src/data/mockData.ts`
- [x] Updated `ARCHITECTURE.md` and `STATE.md`
- [x] `npx tsc --noEmit` — 0 errors

---

## Blockers
_None_

## Notes
- `npx tsc --noEmit`: 0 errors.
