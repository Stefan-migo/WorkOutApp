# Tasks: Phase 5 — Workout Statistics

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

## Phase 1: Hook — useStats (TDD)

- [x] **1.1 RED** Create `src/hooks/useStats.test.ts` — failing tests for: streak edge cases (gap resets, single day, consecutive, today UTC), weekly volume grouping (multiple weeks, empty weeks), total aggregation, sessionsThisWeek, recentSessions limit of 10 (per spec scenarios)
- [x] **1.2 GREEN** Create `src/hooks/useStats.ts` — `useStats(sessions)` returning `StatsData` with all computations via `useMemo`. Implement `getISOWeek()` pure function. Streak algorithm per design (sort desc, group by UTC date, count consecutive from today, break on gap)
- [x] **1.3 REFACTOR** Verify all tests pass (`npx vitest run`). Clean up any duplication in streak/week grouping logic

## Phase 2: Components — StatsDashboard (TDD)

- [x] **2.1 RED** Create `src/components/StatsDashboard.test.tsx` — failing render tests for: summary cards show correct values, CSS bar chart renders proportional heights, recent sessions list shows last 10, empty state shows "Complete your first workout" with link to `/workouts`
- [x] **2.2 GREEN** Create `src/components/StatsDashboard.tsx` — `'use client'` component: 4 summary cards (total workouts, total time in hours, current streak, sessions this week), CSS bar chart (flex row of `<div>` bars with height proportional to max, 12 weeks max, ISO week labels), recent sessions list (date, name, duration, type), empty state per ST-5
- [x] **2.3 REFACTOR** Verify all tests pass. Extract `formatHours()`, `shortWeekLabel()` pure helpers if duplicated

## Phase 3: Page + Nav — Integration

- [x] **3.1** Create `src/app/stats/page.tsx` — RSC shell (no `'use client'`), imports and renders `<StatsDashboard />`
- [x] **3.2** Create `src/app/nav.tsx` — bottom nav bar with links to `/workouts`, `/stats`, `/calendar`, `/history` (or integrate stats link into existing nav if found; ponytail: minimal nav, just what exists)

## Phase 4: Verify Build + Tests

- [x] **4.1** Run `npx vitest run` — all tests green
- [x] **4.2** Run `next build` — zero compilation errors
