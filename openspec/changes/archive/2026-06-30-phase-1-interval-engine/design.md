# Design: Phase 1 — Interval Engine

## Technical Approach

Extend `Interval` type with optional nesting fields. Pure-function interval engine (DFS flatten, total duration, locate-by-elapsed) in `src/lib/interval-engine.ts`. Editor gains native `<dialog>` bottom-sheet for detail editing and a horizontal timeline strip. Timer page calls `flattenWorkout()` once on mount — `useTimer` hook stays unchanged (still scalar `duration`). Migration in `useWorkouts` defaults absent fields on read.

## Architecture Decisions

### Decision: Interval type extension

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `NestedInterval` subtype | Clearer but duplicates interface | **Rejected** — single `Interval` with optionals keeps backward compat |
| Optional fields on existing `Interval` | Backward-compatible, less code | **Accepted** — `children?`, `cycleCount?`, `setCount?`, `restBetweenCycles?` |

### Decision: Flatten strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| BFS expand per level | Different order than user expects | **Rejected** — DFS gives "do all cycles of block, then next" |
| DFS recursion | Natural, ≤ 30 lines | **Accepted** — expand cycles by `cycleCount`, repeat by `setCount`, insert `restBetweenCycles` |

### Decision: Timer integration with existing `useTimer`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Modify `useTimer` to accept array | Changes hook API, touches more files | **Rejected** — hook is clean, single-responsibility |
| `flattenWorkout()` in play page, hook unchanged | Zero hook changes | **Accepted** — `const flat = flattenWorkout(workout)` on mount, `currentIdx` advances, `useTimer(flat[currentIdx].duration)` |

### Decision: Editor editing UX

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline editing in IntervalRow | No modal but cramped nesting controls | **Rejected** — cycleCount/setCount need space |
| Native `<dialog>` bottom-sheet | Zero deps, CSS slide-up, browser focus trap | **Accepted** — `IntervalDetailSheet` opens on click, includes nesting form |

### Decision: Migration approach

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Migration script on load | Runs once, needs version tracking | **Rejected** — overkill for optional fields |
| Defaults on read in getter | Always fills, no-op when present | **Accepted** — `{ children: undefined, cycleCount: 1, setCount: 1 }` spread |

### Decision: Total duration calculation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline `reduce` (flat) | Ignores nesting, undercounts | **Rejected** — wrong for nested workouts |
| `totalDuration()` from engine | Single source of truth | **Accepted** — recursive over flattened durations |

## Data Flow

```
Editor Page                      Timer Page
    │                               │
    │  flattenWorkout()             │  flattenWorkout()
    │  (for timeline + total)       │  (once on mount)
    │                               │
    ▼                               ▼
TimelineStrip ◄── flat[]      flat[] ──► currentIdx advances
    │                                      │
    ▼                                      ▼
IntervalDetailSheet                useTimer(flat[currentIdx].duration)
(native <dialog>)                        │
    │                                     ▼
form: title, duration,             TimerDisplay
description, exercise,             ProgressBar (flat.length)
cycleCount, setCount,              badges: "Cycle 3/5", "Set 2/4"
restBetweenCycles                        │
    │                                     ▼
    ▼                               Complete → next index
Editor saves updated
Interval[]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modify | Add `children?`, `cycleCount?`, `setCount?`, `restBetweenCycles?` to `Interval` |
| `src/lib/interval-engine.ts` | Create | `flattenWorkout()`, `totalDuration()`, `durationAt()`, `FlattenedInterval` type |
| `src/components/IntervalDetailSheet.tsx` | Create | Native `<dialog>` bottom-sheet modal for interval editing |
| `src/components/TimelineStrip.tsx` | Create | Horizontal scrollable timeline, proportional widths per duration, type colors |
| `src/hooks/useWorkouts.ts` | Modify | Migration: default absent nesting fields in `getWorkout` |
| `src/app/workouts/new/page.tsx` | Modify | Add `<TimelineStrip>`, open `<IntervalDetailSheet>` on IntervalRow click |
| `src/app/workouts/[id]/edit/page.tsx` | Modify | Same as new page |
| `src/app/workouts/[id]/play/page.tsx` | Modify | Call `flattenWorkout()`, show cycle/set badges, progress bar over flat length |

Note: `src/hooks/useTimer.ts` is NOT modified — the existing hook accepts a scalar duration, and the play page manages index advancement over the flattened array.

## Interfaces / Contracts

```typescript
// src/types/workout.ts — additions to Interval
export interface Interval {
  id: string
  type: IntervalType
  title: string
  duration: number
  description?: string
  exerciseId?: string
  // Phase 1
  children?: Interval[]
  cycleCount?: number       // repeats children this many times
  setCount?: number         // repeats entire block this many times
  restBetweenCycles?: number // rest seconds inserted between cycles
}

// src/lib/interval-engine.ts
export interface FlattenedInterval extends Interval {
  cycleIndex?: number  // 1-based: "Cycle 3/5"
  setIndex?: number    // 1-based: "Set 2/4"
  depth: number        // 0=top-level, 1=inside cycle, 2=inside nested cycle
}

export function flattenWorkout(workout: Workout): FlattenedInterval[]
export function totalDuration(workout: Workout): number
export function durationAt(workout: Workout, elapsed: number): FlattenedInterval | undefined
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `flattenWorkout()` | Pure function — flat passthrough, cycle expansion, nested DFS, rest insertion, empty input |
| Unit | `totalDuration()` | Match sum of flattened durations for each test case |
| Manual | Bottom-sheet open/close | Native `<dialog>` showModal/close, CSS slide-up animation |
| Manual | Timeline rendering | 1–50 intervals, scroll, color-coded blocks, proportional widths |
| Manual | Old workout loading | Load Phase 0 data, verify defaults applied silently, timer runs unchanged |

## Migration / Rollout

Silent on-read migration in `useWorkouts`:

```typescript
const getWorkout = useCallback((id: string): Workout | undefined => {
  const w = workouts.find((w) => w.id === id)
  if (!w) return undefined
  return {
    ...w,
    intervals: w.intervals.map((i) => ({
      children: undefined,
      cycleCount: 1,
      setCount: 1,
      ...i,
    })),
  }
}, [workouts])
```

No destructive migration. Old localStorage data is untouched. Rollback: revert types, delete new files.

## Open Questions

- None — all decisions resolved by reading codebase and proposal. Spec phase did not run (parallel), but the proposal scope is well-defined enough for design.
