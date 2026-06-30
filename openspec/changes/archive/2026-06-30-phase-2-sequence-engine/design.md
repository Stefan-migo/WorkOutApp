# Design: Phase 2 — Sequence Engine

## Technical Approach

Add `Sequence` + `Session` types, localStorage-backed hooks, pure sequence navigation functions, and four new page groups (sequence list/editor/player, session history/detail). Modify existing play page to log sessions on completion. Zero new dependencies. No context changes — page-specific hooks, no global scope pollution.

## Architecture Decisions

### Decision: No context provider for sequences/sessions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Extend WorkoutContext with sequence+session state | Re-renders every page on any sequence/session change | ✗ |
| Standalone hooks used directly in pages | Isolated reactivity, no global coupling | ✓ |

**Rationale**: Only 4 pages need sequences, 2 need sessions. YAGNI until cross-page reactivity is required.

### Decision: Sequence type includes `repeatCount`

Per spec ED-1/SE-1: totalRounds = workoutIds.length × repeatCount. The editor UI must expose repeatCount (1–99). This was in the proposal but omitted in the initial type sketch — corrected here.

### Decision: Session type uses explicit `type` discriminator

`type: 'workout' | 'sequence'` rather than inferring from optional fields. Simplifies history list rendering and prevents ambiguity. Matches spec scenarios (SH-1/SH-2).

### Decision: `crypto.randomUUID()` for IDs

The existing code uses a counter hack (`Date.now()` + increment). For persisted data (sequences, sessions) that may be read later or referenced by other systems, proper UUIDs prevent collision. `crypto.randomUUID()` is available in all modern browsers and Node 19+ — zero dependencies.

### Decision: Track per-interval actual duration by capturing `timeLeft`

Spec SH-3 requires planned vs actual comparison. The timer hook exposes `timeLeft`; capture it at skip/complete boundaries via a ref. No extra timer, no mutation of the flattened interval array.

## Data Flow

```
Editor ──→ useSequences.saveSequence() ──→ localStorage[workoutapp.sequences]

Player ──→ getWorkout(id) per round (fresh from localStorage)
       ──→ useTimer + TimerDisplay/ProgressBar/TimerControls (reused)
       ──→ complete → useSessions.addSession() → localStorage[workoutapp.sessions]

Play (existing) ──→ (same timer logic) + save Session on complete

History ──→ useSessions() → localStorage[workoutapp.sessions] → reverse chrono
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modify | Add `Sequence`, `Session`, `CompletedInterval` |
| `src/hooks/useSequences.ts` | Create | CRUD over `workoutapp.sequences` via useLocalStorage |
| `src/hooks/useSessions.ts` | Create | Append-only over `workoutapp.sessions` via useLocalStorage |
| `src/lib/sequence-engine.ts` | Create | Pure functions: getTotalRounds, getRoundAt, getNextWorkoutId, isComplete, getProgress, resolveWorkouts |
| `src/app/sequences/page.tsx` | Create | Cards with title, description, workout count, duration; New/Play/Edit/Delete |
| `src/app/sequences/new/page.tsx` | Create | Title + description + repeatCount + workout picker with add/reorder |
| `src/app/sequences/[id]/play/page.tsx` | Create | Iterates workouts; auto-advance with 5s countdown; saves Session at end |
| `src/app/history/page.tsx` | Create | Reverse-chronological session list |
| `src/app/history/[id]/page.tsx` | Create | Intervals table (name, type, planned, actual, completed); Repeat button |
| `src/app/workouts/[id]/play/page.tsx` | Modify | Save Session on workout complete (type: 'workout') |

## Interfaces / Contracts

### Added to `src/types/workout.ts`

```typescript
export interface Sequence {
  id: string
  title: string
  description?: string
  workoutIds: string[]
  repeatCount: number
  createdAt: number
  updatedAt: number
}

export interface Session {
  id: string
  type: 'workout' | 'sequence'
  sequenceId?: string
  workoutId?: string
  startedAt: number
  completedAt?: number
  intervals: CompletedInterval[]
}

export interface CompletedInterval {
  intervalId: string
  title: string
  type: IntervalType
  plannedDuration: number
  actualDuration: number
  completed: boolean
}
```

### Engine functions (`src/lib/sequence-engine.ts`)

```typescript
getTotalRounds(seq: Sequence): number             // workoutIds.length × repeatCount
getRoundAt(seq, idx): { workoutId, ... } | undefined  // resolve ID at position
getNextWorkoutId(seq, idx): string | null             // next; null if done
isComplete(seq, idx): boolean                         // idx >= totalRounds
getProgress(seq, idx): { current, total, percent }
resolveWorkouts(seq, workouts): Workout[]             // filter missing IDs
```

### Hook signatures

```typescript
useSequences(): { sequences, saveSequence, deleteSequence, getSequence }
useSessions(): { sessions, addSession }
```

Both backed by `useLocalStorage<T>()` with keys `workoutapp.sequences` and `workoutapp.sessions`.

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | sequence-engine.ts | Inline assert-based self-check (same ponytail pattern as interval-engine.ts) |
| Manual | Sequence CRUD | Create → verify list → edit → delete |
| Manual | Sequence player | Create sequence → play → verify all rounds iterate → verify Session logged |
| Manual | History | Complete workout (standalone) → verify history entry → verify detail with intervals |
| Manual | Edge cases | Empty list, missing workout in sequence, single-workout sequence, repeat=1 vs repeat>1 |

## Migration / Rollout

No migration. New localStorage keys created lazily on first write. Existing play page gains session logging without breaking current behavior — old `workoutapp.workouts` key unchanged. Rollback: revert types, delete new files, storage orphans itself.

## Open Questions

- [x] Sequence player auto-advance: 5s countdown per spec SP-4.
- [x] repeatCount field in editor: included per spec ED-1.
- [x] Session type discriminator: added per spec scenarios.
