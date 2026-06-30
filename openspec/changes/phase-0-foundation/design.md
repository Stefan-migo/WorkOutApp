# Design: Phase 0 — Foundation (MVP)

## Technical Approach

Greenfield Next.js 14+ App Router scaffold. Four capabilities delivered as isolated modules: data model (types), editor (client page + form components), timer (client page + hook), persistence (hook). All data lives in React state backed by localStorage. No server, no DB, no state library.

Architecture: RSC for shell pages (list, redirect), `"use client"` only where interactivity is required. Timer uses `setInterval` with `Date.now()` delta correction per tick.

## Architecture Decisions

### Decision: ID scheme

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `crypto.randomUUID()` | True UUID, unique but more chars | **Rejected** — overkill for local-only data |
| `Date.now()` + counter | Simple, unique enough for 1 user | **Accepted** — `workout.id = Date.now().toString(36)`; interval index is its key within parent |
| Auto-increment | Requires global counter state | Rejected — unnecessary complexity |

### Decision: Timer implementation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `setInterval` naive | Drifts under load | **Rejected** |
| `setInterval` + `Date.now()` delta | Corrects drift each tick | **Accepted** — store `startedAt`, compute elapsed from `Date.now() - startedAt` |
| `requestAnimationFrame` | Pauses when tab hidden | Rejected — timer must continue in background |
| Web Worker | Background precision | Rejected — YAGNI for MVP, add when tab-visible pauses are reported |

### Decision: Persistence

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `localStorage.getItem/setItem` directly | Works, but repeated JSON.parse calls | **Rejected** — wrapping is one line per hook |
| Custom `useLocalStorage<T>` hook | Single source, sync, handles SSR | **Accepted** — `useLocalStorage<T>(key, initial)` returns `[value, setValue]` |
| IndexedDB via idb library | Async, structured storage | Rejected — YAGNI for MVP, upgrade path when quota or query needs grow |

### Decision: State sharing between pages

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Prop drilling from page layout | Simple but no cross-page sharing | **Rejected** — workout list must persist across navigations |
| React Context (WorkoutContext) | Shares state across pages without libs | **Accepted** — wrap `layout.tsx` with `WorkoutProvider`, reads from localStorage on mount |
| Zustand / Jotai | Adds dependency | Rejected — one context is enough for 4 screens |

### Decision: Component granularity

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Monolithic page component | Fewer files, harder to test/reuse | **Rejected** — drag-and-drop in editor needs `IntervalRow` |
| Separated `IntervalRow`, `IntervalForm`, `TimerDisplay`, `ProgressBar`, `TimerControls` | More files but clearer responsibilities | **Accepted** — each component ≤ 80 lines, replaceable individually |

## Data Flow

```
User → WorkoutList (RSC)
         ├── Load from localStorage via WorkoutContext (client mount)
         ├── Navigate to /workouts/new → Editor (client)
         │       ├── Form state (local useState)
         │       ├── Save → WorkoutContext.setWorkouts → localStorage
         │       └── Redirect → /workouts
         └── Navigate to /workouts/[id]/play → Timer (client)
                 ├── Read workout from WorkoutContext (by id)
                 ├── useTimer(intervals) → currentInterval, elapsed, status
                 ├── TimerDisplay, ProgressBar re-render on tick
                 └── Complete → show finish state, option to restart
```

Interval flow inside the timer:

```
useTimer hook
  │  setInterval(1000ms)
  │    computeElapsed = Date.now() - startedAt
  │    findCurrentInterval(elapsed, intervals[])
  │    setState({ status, currentIndex, elapsed })
  │  → re-render TimerDisplay + ProgressBar
  │  onComplete → setStatus('complete')
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Create | `Workout`, `Interval`, `ExerciseType` types |
| `src/hooks/useLocalStorage.ts` | Create | Generic `useLocalStorage<T>(key, initialValue)` |
| `src/hooks/useTimer.ts` | Create | `useTimer(intervals, onComplete)` — delta-corrected countdown |
| `src/context/WorkoutContext.tsx` | Create | React context + provider for workout CRUD |
| `src/components/IntervalRow.tsx` | Create | Single interval row (type badge, duration, title, drag handle) |
| `src/components/IntervalForm.tsx` | Create | Add/edit interval form (type select, duration, title) |
| `src/components/TimerDisplay.tsx` | Create | MM:SS countdown, monospace, large |
| `src/components/ProgressBar.tsx` | Create | Progress bar (current interval / total duration) |
| `src/components/TimerControls.tsx` | Create | Pause, Skip, Restart buttons |
| `src/components/EmptyState.tsx` | Create | Shown when no workouts exist |
| `src/data/exercises.ts` | Create | 5 hardcoded exercises (name, description) |
| `src/app/layout.tsx` | Create | Root layout with WorkoutProvider |
| `src/app/page.tsx` | Create | Redirect → `/workouts` |
| `src/app/workouts/page.tsx` | Create | Workout list (RSC shell calls client data) |
| `src/app/workouts/new/page.tsx` | Create | Workout editor for creation |
| `src/app/workouts/[id]/edit/page.tsx` | Create | Workout editor for editing |
| `src/app/workouts/[id]/play/page.tsx` | Create | Active timer page |
| `package.json` | Modify | Next.js, TypeScript, Tailwind CSS v4 deps |

## Interfaces / Contracts

```typescript
// src/types/workout.ts

export type IntervalType = 'prepare' | 'work' | 'rest' | 'cooldown';

export interface Interval {
  id: string;           // `${workoutId}-${index}`, or short nanoid
  type: IntervalType;
  title: string;
  duration: number;     // seconds
  exerciseId?: string;  // references Exercise.id, only for 'work' type
}

export interface Workout {
  id: string;           // Date.now().toString(36)
  title: string;
  intervals: Interval[];
  createdAt: number;    // timestamp
  updatedAt: number;    // timestamp
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
}
```

```typescript
// src/hooks/useTimer.ts — return type
interface UseTimerReturn {
  status: 'idle' | 'running' | 'paused' | 'complete';
  currentIntervalIndex: number;
  elapsed: number;           // ms elapsed in current interval
  currentInterval: Interval;
  totalElapsed: number;      // ms total elapsed across all intervals
  controls: {
    start: () => void;
    pause: () => void;
    resume: () => void;
    skip: () => void;
    restart: () => void;
  };
}
```

```typescript
// src/context/WorkoutContext.tsx — contract
interface WorkoutContextValue {
  workouts: Workout[];
  getWorkout: (id: string) => Workout | undefined;
  saveWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useTimer` hook | Manual `console.log` assertions for MVP (no test runner configured yet). Add Vitest in Phase 1. |
| Unit | `useLocalStorage` hook | Same — manual verification in browser |
| Integration | Editor → save → list → play flow | Manual dogfooding via the 5 success criteria |
| E2E | Full workout creation → execution | Manual until Playwright in Phase 3+ |

Testing config in `openspec/config.yaml` has `runner: null` — intentional ponytail deferral. No test infrastructure for Phase 0.

## Migration / Rollout

No migration required. Greenfield project — all new files. `package.json` modified to add dependencies.

## Open Questions

- [ ] Confirm Tailwind v4 exact version to pin (currently `^4.0.0`?)
- [ ] Confirm color palette for interval types (proposal doesn't specify — fallback: indigo/green/amber/red/purple from screen spec)
- [ ] Should TimerDisplay include a flash/beep at 3-2-1 countdown before interval ends? (Proposal silent — defer to implementation if not requested)
