# Tasks: Calendar Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (utils+tests) → PR 2 (MonthOverview+header) → PR 3 (page rewire+deletes) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Pure helpers + tests | PR 1 | `npx vitest run src/lib/__tests__/calendar-utils.test.ts` | N/A — pure logic, unit tests prove | `src/lib/calendar-utils.ts` + test file only |
| 2 | MonthOverview + CalendarHeader components | PR 2 | `npx vitest run` (no regressions) | `npm run dev` → /calendar renders header + month grid (unused yet) | New components only; page untouched |
| 3 | Page recomposition + DayRow/TodaysFocus restyle + deletions | PR 3 | `npx vitest run` | `npm run dev` → /calendar full manual walkthrough vs CU-1..CU-5 | Whole page layout; git revert restores deleted components |

## Phase 1: Pure Helpers — Strict TDD (PR 1)

- [x] 1.1 RED: add failing tests in `src/lib/__tests__/calendar-utils.test.ts` for `weekOfDate` (mid-week, already-Monday, ISO string in/out)
- [x] 1.2 GREEN: implement `weekOfDate` in `src/lib/calendar-utils.ts` wrapping `getMonday`; refactor
- [x] 1.3 RED: failing tests for `buildMonthMatrix` — density via `weekPlans.find(startDate)`, `isCurrentMonth` flags, 5- and 6-row months, adjacent-month cells (CU-3 scenarios)
- [x] 1.4 GREEN: implement `MonthCell` type + `buildMonthMatrix`; refactor
- [x] 1.5 RED: failing tests for `deriveNextUp` — future assignment, later-today, wrap-past-week → null, empty weekPlan → null (CU-5 scenarios)
- [x] 1.6 GREEN: implement `NextUp` type + `deriveNextUp`; refactor; full suite green

## Phase 2: Components (PR 2)

- [x] 2.1 Create `src/components/CalendarHeader.tsx`: row 1 ◀ / `formatWeekRange` label / ▶ + Today; row 2 template save input + template dropdown (props from page, CU-1)
- [x] 2.2 Create `src/components/MonthOverview.tsx` per `MonthOverviewProps` (design Interfaces): Mon-start grid, density dots, adjacent-month de-emphasis, `onSelectWeek`/`onSelectDay` (CU-3)
- [x] 2.3 Verify via dev server in isolation (storybook-less: temp render check), then remove temp render

## Phase 3: Page Recomposition (PR 3)

- [x] 3.1 Restyle `src/components/DayRow.tsx`: single card style, today accent ring (`ring-1 ring-accent`) not fill (CU-4)
- [x] 3.2 Rework `src/components/TodaysFocus.tsx`: compact hero shown only on current week + `deriveNextUp` one-liner incl. empty/rest state (CU-5)
- [x] 3.3 Rewire `src/app/calendar/page.tsx`: CalendarHeader replaces WeekNav; desktop main+sidebar (MonthOverview); mobile stack with collapsed `<details>` for month/templates (CU-2); keep all hooks unchanged
- [x] 3.4 Add date-based modal open: `onSelectDay` → `weekOfDate` + `getWeekPlan` + `setCurrentMonday` if other week + open DayAssignmentModal via `getDayOfWeek` (CP-1 "Direct day assignment")
- [x] 3.5 Delete `src/components/WeekNav.tsx`, `TemplatesPanel.tsx`, `UpcomingList.tsx` and remove imports/exports

## Phase 4: Verification

- [x] 4.1 `npx vitest run` — full suite green, zero regressions (746/746 passed, exit 0; `npx tsc --noEmit` clean; `npx next build` succeeded)
- [ ] 4.2 Manual dev-server walkthrough: CU-1 desktop 2-zone, CU-2 mobile stacking/collapse, CU-3 density+direct assign, CU-4 today ring, CU-5 next-up; CP-1 nav/rest/duration/month-jump scenarios
