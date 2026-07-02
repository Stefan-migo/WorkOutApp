# Tasks: Timer Play Flow Tests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 380–440 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (test-only, 4 files) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium
```

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Extend useTimer.test.ts | PR 1 | ~180 lines, state machine + edge + progress + cleanup |
| 2 | Create useBeep.test.ts | PR 1 | ~50 lines, AudioContext mock + fallback |
| 3 | Create TimerControls.test.tsx | PR 1 | ~70 lines, conditional icon render + handler wiring |
| 4 | Create play page integration tests | PR 1 | ~120 lines, module mocks + idle→active→complete flow |

## Phase 1: Hook Unit Tests

- [x] 1.1 Extend `src/hooks/__tests__/useTimer.test.ts` — add `start()` sets `running` status and `timeLeft = duration`
- [x] 1.2 Add pause/resume round-trip with fake timers — assert `paused→running` with correct drift
- [x] 1.3 Add guard clause test — `pause()` when idle is a no-op
- [x] 1.4 Add `skip()` transitions to `complete`, `timeLeft = 0`, calls `onComplete`
- [x] 1.5 Add `reset()` returns to `idle`, restores `timeLeft` to duration
- [x] 1.6 Add natural completion — fake timer advancement to 0 triggers `complete` status
- [x] 1.7 Add `onComplete` called exactly once on both skip and natural completion
- [x] 1.8 Add `progress` ranges 0→1 over duration (assert at midpoint)
- [x] 1.9 Add `duration=0` edge case — instant `complete`
- [x] 1.10 Add cleanup on unmount — interval cleared, no console errors
- [x] 1.11 Create `src/hooks/__tests__/useBeep.test.ts` — AudioContext creation with oscillator + gain wiring
- [x] 1.12 Add graceful fallback when AudioContext constructor throws or is undefined
- [x] 1.13 Add `webkitAudioContext` prefix fallback test
- [x] 1.14 Add idempotent multiple `beep()` calls — no throw, single context

## Phase 2: Component Unit Tests

- [x] 2.1 Create `src/components/__tests__/TimerControls.test.tsx` — pause icon when `status='running'` (aria-label + icon class)
- [x] 2.2 Add play icon when `status='paused'`
- [x] 2.3 Add nothing rendered when `status='idle'` or `'complete'`
- [x] 2.4 Add click fires correct handler: `onPause` / `onResume` / `onSkip`
- [x] 2.5 Add rewind button renders only when `onRewind` prop provided

## Phase 3: Page Integration Tests

- [x] 3.1 Create `src/app/workouts/[id]/play/__tests__/page.test.tsx` — module mock setup: `next/navigation`, `useTimer`, `useBeep`, `useExercises`, `useSessions`, `WorkoutContext`, `useIntervalNotification`
- [x] 3.2 Add idle phase renders workout title, interval count, Start button
- [x] 3.3 Add Start click transitions to active — timer ring + controls visible
- [x] 3.4 Add skip captures partial `actualDuration` with `completed: false`
- [x] 3.5 Add last interval completion saves session via `addSession` + redirects to `/history/[id]`
- [x] 3.6 Add last interval skip also saves partial session + redirects
- [x] 3.7 Add workout not found renders error message + back link

## Phase 4: Verification

- [x] 4.1 Run `npx vitest run` — all 4 test files pass with no flakiness
- [x] 4.2 Confirm `git diff --stat` shows only test files (no production code)

## Dependencies & Constraints

- `ponytail:` existing shortcuts (interval drift via Date.now, single-thread addTime) are covered by tests — do NOT refactor production code
- All work units in one PR — single-pr strategy with size-exception (test-only change)
- Existing vitest config, jsdom environment, `@testing-library/jest-dom/vitest` — no new dependencies
