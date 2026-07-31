# Design: Rep-Based Workout Mode

## Technical Approach

Mode cascade: `interval.mode ?? workout.mode ?? 'timed'`. Types get optional fields (backward compat). Editor adds mode toggle + reps input. Play page bifurcates on per-interval mode — reps work intervals show `RepCounter` + "Complete" → `RepCompleteDialog` → advance; rest/prepare/cooldown + timed work use existing timer. Rest intervals expose +10/+20/+30s via `useTimer.addTime`. Sequences ignore mode (timed-only).

## Architecture Decisions

### Decision: Mode cascade (workout → interval)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Workout-level only | Simple but no mixed cycles | |
| Per-interval only | Repetitive editor UX | |
| **Cascade** | Workout default + per-interval override | ✓ — mixed cycles without boilerplate |

`getEffectiveMode(workout, interval): WorkoutMode` helper in interval-engine.ts.

### Decision: Rep flow = manual advance, no timer

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Timer runs + auto-prompt at end | Confusing — user may finish reps early/late | |
| **Manual "Complete" button** | Explicit user action, dialog saves data | ✓ — matches strength training UX |

Work intervals in reps mode render `RepCounter` + "Complete" button. Timer is `idle` for that interval — no countdown, no beeps, no progress.

### Decision: Rest addTime via existing hook

`useTimer.addTime(delta)` already exists and handles drift correction. TimerControls gets 3 new buttons (+10/+20/+30) during rest intervals. Zero new hook logic.

## Data Flow

```
Editor:
  WorkoutEditor ──mode toggle──→ dispatch({ type: 'CHANGE_MODE', mode })
    IntervalDetailSheet ──reps input──→ dispatch({ type: 'CHANGE_INTERVAL', reps })

Play (per interval):
  current interval
    ├── effective mode === 'reps' AND type === 'work'
    │     → RepCounter (target reps + exercise)
    │     → "Complete" button → RepCompleteDialog (actualReps, weight)
    │     → save CompletedInterval → advance
    │
    ├── type === 'rest' | 'prepare' | 'cooldown'
    │     → TimerRing + TimerControls (with addTime buttons)
    │     → natural/skip → advance
    │
    └── effective mode === 'timed' AND type === 'work'
          → TimerRing + TimerControls (normal flow)
          → natural/skip → capture → advance

Session save writes CompletedInterval with plannedReps, actualReps, weight.
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modify | Add `WorkoutMode`, `mode` on `Workout` + `Interval`, `reps` on `Interval`, `plannedReps`/`actualReps`/`weight` on `CompletedInterval` |
| `src/lib/interval-engine.ts` | Modify | Add `getEffectiveMode(workout, interval): WorkoutMode` |
| `src/components/WorkoutEditor.tsx` | Modify | Mode toggle in header, new `CHANGE_MODE` reducer action, pass mode to IntervalDetailSheet |
| `src/lib/workout-reducer.ts` | Modify | Add `SET_MODE` action type |
| `src/components/IntervalDetailSheet.tsx` | Modify | Show reps input for work intervals when mode='reps', hide duration field for those |
| `src/components/IntervalRow.tsx` | Modify | Show `{reps} reps` badge on intervals with reps value |
| `src/components/WorkoutBuilder.tsx` | Modify | Add `workMode` to `CycleTemplate`, propagate in `expandCycle` to interval `mode` |
| `src/components/RepCounter.tsx` | Create | Display exercise + target reps + "Complete" button for reps work intervals |
| `src/components/RepCompleteDialog.tsx` | Create | Post-completion: `actualReps` (default planned) + optional `weight` input |
| `src/app/workouts/[id]/play/page.tsx` | Modify | Per-interval mode bifurcation: timer vs rep flow, rest addTime buttons |
| `src/components/TimerControls.tsx` | Modify | Add `onAddTime` prop, render +10/+20/+30 buttons during rest |
| `src/components/TimerRing.tsx` | Modify | Hide when mode=reps+type=work (RepCounter renders instead) |

## Interfaces / Contracts

```typescript
// — src/types/workout.ts —
export type WorkoutMode = 'timed' | 'reps'

export interface Workout {
  // ...existing fields
  mode?: WorkoutMode  // defaults to 'timed'
}

export interface Interval {
  // ...existing fields
  reps?: number        // target reps (work intervals in reps mode)
  mode?: WorkoutMode   // per-interval override
}

export interface CompletedInterval {
  // ...existing fields
  plannedReps?: number
  actualReps?: number
  weight?: number
}

export interface CycleTemplate {
  // ...existing fields
  workMode?: WorkoutMode  // mode for work intervals in cycle
}

// — src/lib/interval-engine.ts —
export function getEffectiveMode(
  workout: Workout,
  interval: Interval
): WorkoutMode {
  return interval.mode ?? workout.mode ?? 'timed'
}
```

## Testing Strategy

### Existing tests requiring update

| Test file | What | Impact |
|-----------|------|--------|
| `src/types/workout.test.ts` (would need new) | Type shapes, defaults | Verify WorkoutMode, optional fields backward compat |
| `src/components/__tests__/WorkoutEditor.test.tsx` | Mode toggle, reps in sheet | Add mode toggle renders, reps field conditional |
| `src/components/__tests__/IntervalDetailSheet.test.tsx` | Reps input | Verify reps field appears when mode=reps |
| `src/components/__tests__/WorkoutBuilder.test.tsx` | CycleTemplate workMode | Verify expandCycle propagates workMode |
| `src/components/__tests__/TimerControls.test.tsx` | AddTime buttons | Verify +10/+20/+30 render during rest |
| `src/app/workouts/[id]/play/__tests__/page.test.tsx` | Rep flow | New describe block for reps-mode tests |
| `src/lib/__tests__/interval-engine.test.ts` | getEffectiveMode | Test cascade logic |

### New tests

| Layer | What | Approach |
|-------|------|----------|
| Unit | `getEffectiveMode` | 4 cases: no mode, workout mode, interval override, mixed |
| Unit | `RepCounter` | Renders target reps, exercise name, Complete button |
| Unit | `RepCompleteDialog` | Default = planned reps, weight optional, cancel skips |
| Integration | Play page reps flow | Complete → dialog → save → advance, verify `CompletedInterval` shape |
| Integration | Mixed cycle play | Timed work fires timer, reps work shows Complete, rest shows addTime |
| Integration | Legacy backward compat | Workout without mode plays full timed flow unchanged |

## Migration / Rollout

No migration required. `mode` is optional, defaults to `'timed'`. Existing workouts load without changes. Supabase JSONB columns accept new optional keys without schema migration.

## Open Questions

- [x] Sequences: remain timed-only per proposal scope. Rep-mode workouts inside sequences play as timed.
- [x] Weight field: optional, not required. User can skip.
- [ ] History UI: display rep/weight columns — **deferred** to a follow-up (not covered in this change).
