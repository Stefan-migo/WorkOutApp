# Tasks: Phase 1 — Interval Engine

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 380–440 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

```
Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
```

## Phase 1: Foundation — Data Model + Engine

- [x] **1.1 Extend Interval type + silent migration**
  - `src/types/workout.ts`: Add `children?`, `cycleCount?`, `setCount?`, `restBetweenCycles?` to `Interval`
  - `src/hooks/useWorkouts.ts`: In `getWorkout`, spread defaults (`children: undefined`, `cycleCount: 1`, `setCount: 1`) over each interval on read
  - **Test**: Seed a legacy workout (no new fields), call (simulated) `getWorkout`, assert defaults present; verify existing fields unchanged
  - *ponytail: optional fields, omit union type — single interface keeps backward compat*

- [x] **1.2 Interval engine (`src/lib/interval-engine.ts`)**
  - Export `FlattenedInterval` (extends `Interval` with `cycleIndex?`, `setIndex?`, `depth`)
  - `flattenWorkout(workout)`: DFS recursion — leaf emitted as-is; parent with `children` expands by `cycleCount` × `setCount`, inserts `restBetweenCycles` synth rest (`isGenerated=true`) between cycles
  - `totalDuration(workout)`: sum of flattened durations, or recursive if input unflattened
  - `durationAt(workout, elapsed)`: walk flattened durations, return `FlattenedInterval` + local offset or `undefined`
  - **Test**: flat passthrough, cycle expansion (2 children × 3 cycles = 6), set expansion (×2 sets = 12), nested DFS, rest insertion, empty → `[]`
  - *ponytail: DFS walker ~35 lines; synthetic rest has `isGenerated=true` tag, no extra type*

## Phase 2: Components — Timeline + Sheet

- [x] **2.1 TimelineStrip component (`src/components/TimelineStrip.tsx`)**
  - Props: `intervals: FlattenedInterval[]`, `currentIndex?: number`, `onIntervalClick?: (idx: number) => void`
  - Horizontal flex row; each block width proportional to `duration / totalDuration`
  - Color per `interval.type` via Tailwind classes; child intervals indented with `ml-{depth}` or left border offset
  - Highlighted border/opacity for `currentIndex`
  - Empty state renders nothing
  - **Test**: 3 flat intervals render 3 blocks totaling 100% width; 10 intervals with varying durations fit without overflow; `currentIndex` highlights correct block
  - *ponytail: pure `<div>` flex, no SVG/canvas; no resize observer — blocks fill container on render*

- [x] **2.2 IntervalDetailSheet component (`src/components/IntervalDetailSheet.tsx`)**
  - Native `<dialog>` with CSS slide-up animation (`@keyframes slideUp` + `transform: translateY`)
  - Props: `interval`, `onSave(updated: Interval)`, `onClose()`, `exercises: Exercise[]`
  - Fields: title, duration (number), description, exerciseId (select, only if `type='work'`)
  - Nesting controls: cycleCount (+/-), setCount (+/-), restBetweenCycles (number) — shown only when interval has children or user opts to make it a group
  - Save persists changes; Cancel calls `onClose()`; Escape key handled natively by `<dialog>`
  - **Test**: `showModal()` opens dialog; save returns updated interval data; cancel returns original; cycleCount input increments/decrements correctly
  - *ponytail: native `<dialog>` replaces any modal library; CSS `@keyframes slideUp` only (~15 lines)*

## Phase 3: Integration — Editor + Timer

- [x] **3.1 Integrate Timeline + Sheet into editor pages**
  - `src/app/workouts/new/page.tsx` & `src/app/workouts/[id]/edit/page.tsx`: Import `TimelineStrip` and `IntervalDetailSheet`
  - Render `<TimelineStrip>` above the interval list, passing `flattenWorkout()` of current intervals
  - Click on any `IntervalRow` → open `IntervalDetailSheet` with that interval's data; on save, update the interval state
  - Replace `totalDuration` reduce with `totalDuration()` from engine
  - **Test**: add interval → timeline updates; click interval → sheet opens; save → interval values change in list; cancel → no change
  - *ponytail: flatten called inline on render — not memoized until perf measured*

- [x] **3.2 Update timer with cycle/set indicators**
  - `src/app/workouts/[id]/play/page.tsx`: Call `flattenWorkout(workout)` once on mount (store in state with `useState`)
  - Derive `currentInterval` from flattened array; `currentIdx` advances through flat array, not original
  - Display "Cycle N/M" and "Set N/M" badges above `TimerDisplay` when `cycleIndex`/`setIndex` are defined
  - `ProgressBar` uses `flat.length` for denominator
  - `useTimer` stays unchanged — still receives `flat[currentIdx].duration`
  - **Test**: flat workout → no cycle/set indicators; cycle workout → "Cycle 2/3" shown at correct position; progress bar covers all 15 intervals after expansion
  - *ponytail: `useMemo` for flatten, no effects beyond mount; cycle/set derived from FlattenedInterval metadata, not recomputed per tick*
