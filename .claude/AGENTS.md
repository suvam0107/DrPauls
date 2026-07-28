# AGENTS.md — DrPauls Clinic App Agent Roster

> Agent definitions for the DrPauls React Native project.
> Agents collaborate on the same codebase. Each agent owns a clearly bounded responsibility.
> All agents follow the canonical schema defined in `ARCHITECTURE.md` and the data contracts in `src/data/mockData.js`.

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
- Do NOT modify `src/data/mockData.js` schema — coordinate with @DataEngineer
- Do NOT bypass the global stylesheet — always use `src/theme/globalStyles.js` tokens
- All colors must reference `colors.js` tokens (never hardcode hex values in components)
- Animations must use Reanimated v4 APIs (`useAnimatedStyle`, `useSharedValue`, `withTiming`, `withSpring`)
- Use `Animated.View` from Reanimated — never from `react-native` — for animated elements

**Style Rules**:
- Theme: Light mode default, Dark mode support via `useTheme()`
- Primary color: Blue (`#2563EB` light / `#3B82F6` dark)
- Background: White/Black per theme
- Typography: System font, scale from `globalStyles`
- Corners: `rounded-xl` for cards/modals, `rounded-full` for chips/pills
- Shadows: `shadow-sm` on cards, none on flat surfaces
- Animation duration: Transitions 100–150ms, Springs for modals/sheets

---

## @DataEngineer

**Role**: Data Architecture & State Management Engineer

**Responsibilities**:
- Define and maintain the canonical data schema (`src/data/schema.ts` — comment-based types)
- Seed and maintain `src/data/mockData.js` with realistic, clinic-accurate mock data
- Implement and maintain Zustand stores (`src/store/`)
  - `useAppointmentStore.js` — CRUD for appointments, calendar slot lookup, drag-drop updates
  - `usePatientStore.js` — patient CRUD, regex search logic
  - `useDoctorStore.js` — doctor list, availability checks
  - `useUIStore.js` — global UI state: active modal, theme preference, loading flags
- Implement `src/utils/searchUtils.js` — regex patient search (by name / patientId / mobile)
- Implement `src/utils/dateUtils.js` — slot generation, time formatting, conflict detection
- Define API service interfaces (even while using mock data) so the swap to real backend is a 1-file change

**Stack Owned**:
- `src/data/` — all data files
- `src/store/` — all Zustand store files
- `src/utils/searchUtils.js`
- `src/utils/dateUtils.js`

**Constraints**:
- All mock data MUST conform to the schema defined in `ARCHITECTURE.md §7`
- ID convention: `PAT-###`, `DOC-###`, `APT-###`, `PKG-###`, `THR-###`
- Date format: ISO `YYYY-MM-DD`
- Time format: 24h `HH:mm`
- Zustand stores must expose clean selector hooks — no raw state access in components
- Conflict detection for slot overlap must be O(1) using a slot-map (keyed by `"date:time"`)
- When a real API is introduced, only the store actions need updating — selectors remain the same

**Data Seeding Requirements**:
- Min 5 patients (varied demographics, with complete mock profiles)
- Min 3 doctors (different specialties: Hair, Skin, Cosmetic)
- Min 3 therapists
- Min 10 appointments (mix of statuses: Scheduled, Confirmed, Paid, Pending, Cancelled)
- Min 2 packages (one active, one completed)
- Appointments spread across current week (for calendar testing)

---

## Shared Rules (All Agents)

1. **Read `ARCHITECTURE.md` before making changes** — it is the single source of truth
2. **Read `STATE.md`** — it reflects the current state of the codebase before each work session
3. **Update `STATE.md`** at the end of each session with what was completed, what is in progress, and any blockers
4. **Schema compliance**: Never introduce a new data field without updating `ARCHITECTURE.md §7` and `src/data/schema.ts`
5. **File ownership**: Respect agent boundaries. Cross-cutting changes require explicit handoff noted in `STATE.md`
6. **No magic strings**: All status values, types, enums must be imported from a shared constants file
7. **SDK constraint**: Target Expo SDK 54. Do not add packages without verifying SDK 54 compatibility via `npx expo install`
