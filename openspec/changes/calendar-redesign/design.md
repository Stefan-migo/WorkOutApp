# Design: Calendar Redesign

## Technical Approach

Keep all data access in `src/app/calendar/page.tsx` (hooks unchanged: `useWeekPlans`, `useProgramTemplates`, `useWorkoutContext`, `useSequences`). Add pure helpers to `src/lib/calendar-utils.ts` (strict TDD in `src/lib/__tests__/calendar-utils.test.ts`), then recompose the page into: unified header → week grid (main) + single contextual sidebar (desktop), stacked with collapsible sections (mobile). Reuse existing palette tokens (`bg-surface`, `border-border-soft`, `text-accent`, `glass-card`) — no token changes. The month overview is a new `MonthOverview` component (not an extension of home-page `MiniCalendar`, whose props are week-scoped); it derives density from multiple week plans.

## Architecture Decisions

### Decision: New `MonthOverview` component instead of extending `MiniCalendar`

**Choice**: Create `src/components/MonthOverview.tsx`.
**Alternatives**: Extend `MiniCalendar` (week-scoped props: `monday`, `todayIndex`, `weekPlanDays` — wrong shape for a month matrix with direct-day-assignment handlers); reuse it as a child.
**Rationale**: MiniCalendar's contract is a 7-day strip for the home page (out of scope). Forcing month semantics onto it risks regressing home usage. A sibling component sharing pure helpers from `calendar-utils` avoids coupling.

### Decision: Month density from `weekPlans` array, not extra per-month fetches

**Choice**: Derive density from the `weekPlans` state already loaded by `useWeekPlans()` (it fetches ALL user week plans on mount). Pure helper `buildMonthMatrix(anchorMonday, weekPlans)` maps each grid cell to `{ date, isCurrentMonth, hasAssignment }` by looking up `weekPlans.find(wp => wp.startDate === getMonday(date))`.
**Alternatives**: Call `getWeekPlan()` for each week of the month (auto-creates empty DB rows as a side effect — rejected); add a month-range Supabase query (out of scope: "no hooks changes").
**Rationale**: `useWeekPlans` already loads the full list; density is only a `startDate → days[i] != null` lookup. No writes, no new endpoints. Days in weeks not yet loaded simply show no dot until visited — acceptable per CU-3 (density, not completeness).

### Decision: Pure helper set (all TDD-first)

**Choice**: Add to `calendar-utils.ts`:

```ts
type MonthCell = { date: string; isCurrentMonth: boolean; hasAssignment: boolean }
buildMonthMatrix(anchorMonday: string, weekPlans: WeekPlan[]): MonthCell[][]   // Mon-start weeks, rows cover anchor's month
weekOfDate(date: string): string          // ISO Monday of date (string in/out; wraps getMonday)
type NextUp = { date: string; dayIndex: number; assignment: DayAssignment } | null
deriveNextUp(weekPlan: WeekPlan | undefined, weekStart: string, now: Date): NextUp  // first assignment at/after now within displayed week; null otherwise
```

**Alternatives**: Inline logic in components (untestable, violates CU-3/CU-5 "testable pure function" requirements).
**Rationale**: Each maps 1:1 to a spec scenario (CU-3 density + adjacent-month edge; CP-1 week jump; CU-5 next-up incl. empty state). Existing style followed: pure functions, no date libs, ISO `'YYYY-MM-DD'` strings.

### Decision: Header absorbs templates + today; sidebar reduced

**Choice**: `WeekNav` becomes `CalendarHeader`: row 1 = ◀ week label ▶ + "Today" button; row 2 (actions) = template save input/button + template list dropdown (moved out of `TemplatesPanel`). Sidebar holds only `MonthOverview` (desktop). Mobile: single column — header, week rows, TodaysFocus, collapsed `<details>` for MonthOverview and templates.
**Alternatives**: Keep TemplatesPanel in sidebar (violates CU-1 "template actions in header actions row" per user decision #2); separate Today button floating.
**Rationale**: Matches user decisions obs #1285 and CU-1/CU-2 exactly; two visual zones on desktop.

### Decision: Day cell assignment by date

**Choice**: Modal opens by date, not day index. `MonthOverview` cell click → compute `weekStart = weekOfDate(date)`, ensure that week's plan is loaded (`getWeekPlan(weekStart)`), then open `DayAssignmentModal` for `getDayOfWeek(date)`. If `weekStart !== currentMonday`, also navigate (`setCurrentMonday`) so the user sees the result (CP-1 scenario "Direct day assignment").
**Alternatives**: Block assignment for weeks other than displayed (rejected — spec says any day in displayed month).
**Rationale**: `page.tsx` already owns `currentMonday`/`weekPlan`/`getWeekPlan`; this stays in the page, no hook changes.

## Data Flow

```
useWeekPlans() ──weekPlans[]──┐
useProgramTemplates() ────────┤
useWorkoutContext/useSequences┤
                              ▼
page.tsx ──buildMonthMatrix()──→ MonthOverview ──click day──→ getWeekPlan + setModalDay
        ──weekPlan, today──────→ DayRow (×7)
        ──deriveNextUp()──────→ TodaysFocus (next-up line)
        ──saveTemplate/apply──→ CalendarHeader actions row
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/calendar-utils.ts` | Modify | Add `MonthCell`, `buildMonthMatrix`, `weekOfDate`, `NextUp`, `deriveNextUp` |
| `src/lib/__tests__/calendar-utils.test.ts` | Modify | RED tests for each new helper (first commit of every pair) |
| `src/components/MonthOverview.tsx` | Create | Month grid, density dots, adjacent-month de-emphasis, day/week select |
| `src/components/CalendarHeader.tsx` | Create | Week nav + Today + template actions rows (replaces WeekNav in page) |
| `src/components/WeekNav.tsx` | Delete | Superseded by CalendarHeader |
| `src/components/DayRow.tsx` | Modify | Single card style; today = accent ring (`ring-1 ring-accent`), not accent fill |
| `src/components/TodaysFocus.tsx` | Modify | Compact hero (current week only) + next-up one-liner line |
| `src/components/TemplatesPanel.tsx` | Delete | Folded into CalendarHeader actions row |
| `src/components/UpcomingList.tsx` | Delete | Replaced by next-up one-liner (CU-5) |
| `src/app/calendar/page.tsx` | Modify | New layout composition, month state, date-based modal open |
| `src/components/MiniCalendar.tsx` | None | Untouched (home page usage out of scope) |

## Interfaces / Contracts

New types exported from `calendar-utils.ts` (see Decision 3). `MonthOverviewProps`:

```ts
interface MonthOverviewProps {
  anchorMonday: string   // any Monday within month to display
  currentMonday: string
  matrix: MonthCell[][]
  todayIso: string
  onSelectWeek: (monday: string) => void
  onSelectDay: (dateIso: string) => void
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Vitest) | `buildMonthMatrix` (density, adjacent-month cells, month spanning 5/6 week rows), `weekOfDate`, `deriveNextUp` (future, today-later, wrap-to-next-week-null, empty state) | Strict TDD: failing test → implement → refactor, in `calendar-utils.test.ts` |
| Component | Not covered (no component test infra; project unit-only per config) | Manual verify via dev server |
| E2E | Not configured | N/A |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Single branch; revert restores deleted components from git.

## Open Questions

- [ ] None blocking. (Density shows only for already-loaded weeks — accepted in Decision 2.)
