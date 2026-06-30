# Tasks: Phase 2 — Sequence Engine

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~620-720 (new) + ~15 (modified) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Editor) → PR 3 (Player) → PR 4 (History) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

```
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

## Phase 1: Foundation (PR 1 — ~110 lines)

- [x] **1.1** `src/types/workout.ts` — add `Sequence`, `Session`, `CompletedInterval` interfaces (per DM-11/12/13)
- [x] **1.2** `src/hooks/useSequences.ts` — CRUD over `workoutapp.sequences` via `useLocalStorage`; follows `useWorkouts` pattern
- [x] **1.3** `src/hooks/useSessions.ts` — append-only over `workoutapp.sessions` via `useLocalStorage`
- [x] **1.4** `src/lib/sequence-engine.ts` — pure functions: `getTotalRounds`, `getRoundAt`, `getNextWorkoutId`, `isComplete`, `getProgress`, `resolveWorkouts`; include inline assert self-check (ponytail: match `interval-engine.ts` pattern)

## Phase 2: Sequence Editor (PR 2 — ~200 lines)

- [x] **2.1** `src/app/sequences/new/page.tsx` — form: title (req), description (opt), repeatCount (1-99, default 1); workout picker from `useWorkoutContext.workouts` with search filter; add/remove/reorder ▲/▼; validate: ≥1 workout, no dupes; save via `useSequences().saveSequence` with `crypto.randomUUID()`; navigate to `/sequences`
- [x] **2.2** `src/app/sequences/page.tsx` — list sequences as cards (title, description, workout count, total duration based on first resolve); empty state; New/Play/Delete buttons; filter broken sequences (missing workouts) gracefully

## Phase 3: Sequence Player (PR 3 — ~170 lines)

- [x] **3.1** `src/app/sequences/[id]/play/page.tsx` — load sequence + fresh workouts per round (SP-8); iterate through `workoutIds` × `repeatCount` rounds; reuse `useTimer`/`TimerDisplay`/`ProgressBar`/`TimerControls` per workout; on workout complete → show brief summary + 5s auto-advance countdown (SP-4); skip-to-next button (SP-5); display "Workout N of M" + progress (SP-7); on all rounds complete → `useSessions().addSession` with `type: 'sequence'`, all intervals captured (SP-6); capture `timeLeft` at each interval boundary via ref for actualDuration

## Phase 4: Session History + Single Workout Save (PR 4 — ~155 lines)

- [x] **4.1** `src/app/history/page.tsx` — reverse-chronological session list from `useSessions().sessions`; each row: date, type badge (workout/sequence), name, duration, interval count
- [x] **4.2** `src/app/history/[id]/page.tsx` — session detail: intervals table showing name, type, planned vs actual duration, completed status; "Repeat" button loads current workout(s) from localStorage (SH-5) → navigates to `/workouts/[id]/play` (single) or `/sequences/[id]/play` (sequence)
- [x] **4.3** `src/app/workouts/[id]/play/page.tsx` — on workout complete phase, call `useSessions().addSession` with `type: 'workout'`, intervals captured; ponytail: minimal diff, ~45 lines added

## Risks

- Orphaned workout IDs in sequences (deleted workout) — player should show warning + skip
- Session intervals array grows with total rounds × intervals per round — fine for localStorage at this scale
- Sequence editor is the largest UI task (~200 lines) — if too big, split picker (2.1a) from reorder/validation (2.1b)
