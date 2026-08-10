# AGENTS.md — DrPauls Clinic App Agent Roster

> Agent definitions for the DrPauls React Native project.
> Agents collaborate on the same codebase. Each agent owns a clearly bounded responsibility.
> All agents follow the canonical schema defined in `ARCHITECTURE.md` and the data contracts in `src/data/mockData.ts`.

---

## @Frontend

**Role**: UI/UX Engineer — React Native Developer

**Responsibilities**:
- Build and maintain all screens listed in `ARCHITECTURE.md §4`
- Implement the NativeWind + global StyleSheet theming system (`src/theme/`)
- Implement all Reanimated animations: calendar chip drag-drop, bottom sheet spring, filter chip transitions
- Build reusable shared components under `src/components/shared/`
- Implement the Calendar grid (`CalendarGrid`, `AppointmentChip`, `CalendarHeader`, `AppointmentDetailModal`)
- Implement the Create Appointment bottom sheet (`CreateAppointmentSheet`, `PatientSearchInput`, `AddPatientSheet`)
- Ensure mobile-first layout, clean minimal design, and fast interactions
- Use `@expo/vector-icons` (Ionicons primary) for all icons
- Maintain the 3-tab Bottom Navigator (Home | New Appointment [+] | Settings)
- Implement the Drawer Navigator for secondary navigation
- Migrate all screens and components to consume TanStack Query hooks (`useQuery`, `useMutation`) instead of Zustand `loading` flags and direct `fetch*` store calls

**Stack Owned**:
- `src/screens/` — all screen files
- `src/components/` — all component files
- `src/navigation/` — all navigation files
- `src/theme/` — colors, globalStyles, ThemeContext

**Constraints**:
- Do NOT modify `src/data/mockData.ts` schema — coordinate with @DataEngineer
- Do NOT bypass the global stylesheet — always use `src/theme/colors.ts` tokens
- All colors must reference `colors.ts` tokens (never hardcode hex values in components)
- Animations must use Reanimated APIs (`useAnimatedStyle`, `useSharedValue`, `withTiming`, `withSpring`)
- Do NOT call store `fetch*` methods directly — use the custom query hooks from `src/hooks/queries/`
- Do NOT use store `loading` flags — use `isLoading` / `isPending` from TanStack Query hooks

---

## @UXEngineer

**Role**: User Experience & Interaction Specialist

**Responsibilities**:
- Continuously enhance user experience (UX), usability, and accessibility across all screens and components in the application
- Integrate audio sound assets (`expo-audio` / `expo-asset`) and haptic vibration feedback for tactile and auditory interaction responses (e.g. drag start/release, rescheduling success, collision alerts, button presses, modal popups)
- Audit and refine interactive micro-interactions, gesture feedback, loading states, and haptic/visual feedback
- Optimize calendar drag-and-drop interactions, auto-scrolling responsiveness, and slot snapping for receptionist workflows
- Enhance visual hierarchy, readability, color contrast, and spacing across Light and Dark themes
- Streamline modal transitions, bottom sheet gestures, toast positioning, and navigation flows for maximum receptionist productivity
- Ensure clean error feedback, intuitive empty states, and frictionless patient and appointment scheduling forms
- After TanStack Query migration: audit all loading states to ensure skeleton loaders render for queries without `initialData` (e.g. `useStaffQuery`, `useEnrollmentsByPatientQuery`) and `isPending` states on mutation submit buttons are correctly reflected in the UI

**Stack Owned**:
- `src/components/` — UI components, micro-interactions, accessibility & gesture refinements
- `src/screens/` — Screen layouts, visual hierarchy, user journey & workflow enhancements
- `src/theme/` — Theme design system polish, contrast, & visual token optimization
- `assets/audio/` & audio/haptic feedback utilities — sound assets and vibration feedback logic

**Constraints**:
- Must preserve full TypeScript type safety and existing component props
- Must maintain strict SDK 54 compatibility
- All animation enhancements must target 60fps+ native performance
- Maintain medical UI design guidelines defined in `ARCHITECTURE.md`

---

## @DataEngineer

**Role**: Data Architecture & State Management Engineer

**Responsibilities**:
- Define and maintain the canonical data schema (`src/types/index.ts`)
- Seed and maintain `src/data/mockData.ts` with realistic, clinic-accurate mock data
- Implement and maintain Zustand stores (`src/store/`) — stores own **write-through mutations only**; read/fetch logic has been moved to TanStack Query
  - `useAppointmentStore.ts` — CRUD mutations for appointments, calendar slot lookup, drag-drop updates
  - `usePatientStore.ts` — patient CRUD mutations, regex search logic
  - `useDoctorStore.ts` — doctor list, availability checks, add/update mutations
  - `usePackageStore.ts` — package enrollment lifecycle (enroll, mark, cancel, reschedule, pause, resume)
  - `useUIStore.ts` — global UI state: active modal, theme preference, activeCenterId
- Own and maintain the TanStack Query infrastructure:
  - `src/api/queryClient.ts` — singleton QueryClient (staleTime=2min, gcTime=10min)
  - `src/api/queryKeys.ts` — centralized query key factory (no magic strings)
  - `src/hooks/queries/` — all custom `useQuery` hooks per entity
  - `src/hooks/mutations/` — all custom `useMutation` hooks per entity
- Implement `src/utils/useRefresh.ts` — pull-to-refresh via `queryClient.invalidateQueries()`
- Implement `src/utils/searchUtils.ts` — regex patient search (by name / patientId / mobile)
- Implement `src/utils/dateUtils.ts` — slot generation, time formatting, conflict detection
- Define API service interfaces (even while using mock data) so the swap to real backend is a 1-file change
- Run `npx tsc --noEmit` after completing any work session and fix all TypeScript errors before handoff

**Stack Owned**:
- `src/data/` — all data files
- `src/store/` — all Zustand store files
- `src/api/queryClient.ts` — QueryClient singleton
- `src/api/queryKeys.ts` — query key registry
- `src/hooks/queries/` — all custom query hooks
- `src/hooks/mutations/` — all custom mutation hooks
- `src/utils/useRefresh.ts`
- `src/utils/searchUtils.ts`
- `src/utils/dateUtils.ts`

---

## Shared Rules (All Agents)

1. **Read `ARCHITECTURE.md` before making changes** — it is the single source of truth
2. **Read `STATE.md`** — it reflects the current state of the codebase before each work session
3. **Update `STATE.md`** at the end of each session with what was completed, what is in progress, and any blockers
4. **Schema compliance**: Never introduce a new data field without updating `ARCHITECTURE.md` and `src/types/index.ts`
5. **File ownership**: Respect agent boundaries. Cross-cutting changes require explicit handoff noted in `STATE.md`
6. **No magic strings**: All status values, types, enums must be imported from a shared constants file; all query keys must be imported from `src/api/queryKeys.ts`
7. **SDK constraint**: Target Expo SDK 54. Do not add packages without verifying SDK 54 compatibility via `npx expo install`
8. **TypeScript gate**: Run `npx tsc --noEmit` after every work session. Zero errors are required before marking any task complete or handing off to another agent.
9. **TanStack Query rule**: Never call store `fetch*` methods from screens or components. Use the custom query hooks from `src/hooks/queries/`. Never read store `loading` flags in UI — use `isLoading`/`isPending` from TanStack Query hooks.
