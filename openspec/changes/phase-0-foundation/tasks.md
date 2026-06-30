# Tasks: Phase 0 — Foundation (MVP)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation → PR 2: Components & Hooks → PR 3: Pages |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Project scaffold, types, data, hooks, context | PR 1 | ~200 lines, base = main. Foundation for everything. |
| 2 | Timer hook + all UI components | PR 2 | ~250 lines, depends on PR 1. UI building blocks. |
| 3 | All app pages (list, editor, timer, home) | PR 3 | ~250 lines, depends on PR 2. Wiring everything together. |

## Phase 1: Foundation

- [x] 1.1 Scaffold Next.js project — `create-next-app` with TS + Tailwind v4 + App Router, pin deps in `package.json`
- [x] 1.2 Create `src/types/workout.ts` — `Interval`, `IntervalType`, `Workout`, `Exercise` interfaces; `Date.now().toString(36)` ID scheme
- [x] 1.3 Create `src/data/exercises.ts` — 5 hardcoded exercises (name + description) for Work interval assignment
- [x] 1.4 Create `src/hooks/useLocalStorage.ts` — generic SSR-safe hook with try/catch JSON parse, SSR guard via `typeof window`
- [x] 1.5 Create `src/context/WorkoutContext.tsx` — provider wrapping localStorage CRUD, expose `workouts` + `saveWorkout` + `getWorkout`; no delete in MVP

## Phase 2: Hooks & Components

- [x] 2.1 Create `src/hooks/useTimer.ts` — `setInterval(1000ms)` + `Date.now()` delta correction per tick; expose `{ status, currentIntervalIndex, elapsed, controls: { start, pause, resume, skip, restart } }`
- [x] 2.2 Create timer UI components (≤ 80 lines each): `TimerDisplay.tsx` (large MM:SS monospace) + `ProgressBar.tsx` (% of total) + `TimerControls.tsx` (pause/skip/restart, tap ≥ 44px)
- [x] 2.3 Create editor UI components (≤ 80 lines each): `IntervalRow.tsx` (type badge, duration, move up/down, delete) + `IntervalForm.tsx` (type select, duration clamped [5,600], exercise picker for work only)
- [x] 2.4 Create `src/app/layout.tsx` — root layout with `<WorkoutProvider>`, dark background default, Inter font

## Phase 3: Pages

- [x] 3.1 Create `src/app/page.tsx` — server component redirect to `/workouts`
- [x] 3.2 Create `src/app/workouts/page.tsx` — list saved workouts as cards (title, interval count, total duration); link to new/edit/play; show EmptyState when none
- [x] 3.3 Create `src/app/workouts/new/page.tsx` + `[id]/edit/page.tsx` — editor page with IntervalForm + IntervalRow list; save via WorkoutContext → localStorage → redirect to `/workouts`
- [x] 3.4 Create `src/app/workouts/[id]/play/page.tsx` — timer page with useTimer, TimerDisplay, ProgressBar, TimerControls, current interval info, completion screen with restart option

## Ponytail Constraints Applied

- No UUID lib — `Date.now().toString(36)` for IDs
- No state lib — React Context + useState is enough
- No UI lib — pure Tailwind utility classes
- No timer lib — `setInterval` + `Date.now()` delta
- Each component ≤ 80 lines enforced by Timer/Editor groupings
- YAGNI: no delete UI (MVP spec says MUST NOT), no IndexedDB, no Web Workers
- YAGNI: no test runner configured — deferred to Phase 1
