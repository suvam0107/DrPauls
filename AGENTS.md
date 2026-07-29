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
- Implement and maintain Zustand stores (`src/store/`)
  - `useAppointmentStore.ts` — CRUD for appointments, calendar slot lookup, drag-drop updates
  - `usePatientStore.ts` — patient CRUD, regex search logic
  - `useDoctorStore.ts` — doctor list, availability checks
  - `useUIStore.ts` — global UI state: active modal, theme preference, loading flags
- Implement `src/utils/searchUtils.ts` — regex patient search (by name / patientId / mobile)
- Implement `src/utils/dateUtils.ts` — slot generation, time formatting, conflict detection
- Define API service interfaces (even while using mock data) so the swap to real backend is a 1-file change

**Stack Owned**:
- `src/data/` — all data files
- `src/store/` — all Zustand store files
- `src/utils/searchUtils.ts`
- `src/utils/dateUtils.ts`

---

## Shared Rules (All Agents)

1. **Read `ARCHITECTURE.md` before making changes** — it is the single source of truth
2. **Read `STATE.md`** — it reflects the current state of the codebase before each work session
3. **Update `STATE.md`** at the end of each session with what was completed, what is in progress, and any blockers
4. **Schema compliance**: Never introduce a new data field without updating `ARCHITECTURE.md` and `src/types/index.ts`
5. **File ownership**: Respect agent boundaries. Cross-cutting changes require explicit handoff noted in `STATE.md`
6. **No magic strings**: All status values, types, enums must be imported from a shared constants file
7. **SDK constraint**: Target Expo SDK 54. Do not add packages without verifying SDK 54 compatibility via `npx expo install`
