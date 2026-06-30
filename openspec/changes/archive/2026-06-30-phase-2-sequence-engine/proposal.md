# Proposal: Phase 2 — Sequence Engine

## Intent

Users can only play one workout at a time — no way to chain workouts into a sequence or track completed sessions. This change adds the data model, engine, pages, and persistence for workout sequences and execution history. Foundation for calendar scheduling in later phases.

## Scope

### In Scope
- Data model: `Sequence` type, `Session` type
- Sequence engine: pure functions for sequence iteration (next workout, repeat tracking, progress)
- Sequence pages: list (`/sequences`), editor (`/sequences/new`), player (`/sequences/[id]/play`)
- History pages: session list (`/history`), session detail (`/history/[id]`)
- Persistence: sequences + sessions via localStorage (new keys)

### Out of Scope
- Edit existing sequence (create-only for MVP — defer to later phase)
- Delete sequence or session (defer to later phase)
- Calendar scheduling, auto-routine, or AI-suggested sequences
- Import/export
- Server sync or backend

## Capabilities

### New Capabilities
- `sequence-engine`: pure functions for sequence navigation (next/prev workout, repeat tracking, progress) — consumed by the sequence player
- `sequence-editor`: pick workouts + set repeat count for a sequence
- `sequence-player`: iterates workouts with auto-reload from localStorage between rounds
- `session-history`: log completed workout/sequence sessions with date, duration, intervals played

### Modified Capabilities
- `local-persistence`: two new storage keys (`workoutapp.sequences`, `workoutapp.sessions`) with same try/catch SSR-safe pattern
- `workload-data-model`: adds `Sequence` and `Session` interfaces

## Approach

Add `Sequence { id, name, workoutIds[], repeatCount, createdAt, updatedAt }` and `Session { id, type, workoutId?, sequenceId?, date, duration, intervalsCompleted, status }` types. Pure functions in `src/lib/sequence-engine.ts`: `getTotalWorkouts(sequence, workoutCount)`, `currentRound(idx, workoutCount)`, etc. Sequence editor: simple form to name + pick workouts from saved list + set repeats. Sequence player: runs each workout's timer, on completion advances to next workout or round — re-fetches workout from localStorage on each round start (no snapshot). History: localStorage append-only log, list with date/duration, detail shows intervals.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modified | Adds `Sequence`, `Session` interfaces |
| `src/lib/sequence-engine.ts` | New | Pure sequence navigation functions |
| `src/hooks/useSequences.ts` | New | localStorage CRUD for sequences |
| `src/hooks/useSessions.ts` | New | localStorage append-only for sessions |
| `src/context/WorkoutContext.tsx` | Modified | Optional: add sequence/session to context |
| `src/app/sequences/page.tsx` | New | Sequence list page |
| `src/app/sequences/new/page.tsx` | New | Sequence create page |
| `src/app/sequences/[id]/play/page.tsx` | New | Sequence player (iterates workouts) |
| `src/app/history/page.tsx` | New | Session list |
| `src/app/history/[id]/page.tsx` | New | Session detail |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Sequence player re-fetches workout mid-play — localStorage read is sync, fast | Low | In-memory cached copy per round; re-fetch only at round boundary |
| Session log grows unbounded | Low | MVP-only; pagination/cap defer to later phase |
| New localStorage keys collide with existing patterns | Low | Match `workoutapp.` prefix convention exactly |

## Rollback Plan

Revert `src/types/workout.ts` (remove types). Delete new files. Old localStorage keys untouched — sequences/sessions keys simply won't exist.

## Dependencies

None. Zero new dependencies. Pure TypeScript. Reuses existing `useTimer`, `flattenWorkout`, `useLocalStorage`.

## Success Criteria

- [ ] Create a sequence with 3 workouts and repeat=2 — player iterates all 6 rounds correctly
- [ ] Workout data refreshes at each round boundary (re-fetches from localStorage)
- [ ] Session logged on completion with correct date, duration, intervals
- [ ] History page lists all sessions chronologically
- [ ] Sequence list shows created sequences with workout count + total duration
