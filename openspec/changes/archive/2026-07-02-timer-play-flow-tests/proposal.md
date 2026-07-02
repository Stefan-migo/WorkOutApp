# Proposal: Timer Play Flow Tests

## Intent

Cover the timer play flow — the app's critical user path — with unit and
integration tests. Currently only `addTime` tests exist for `useTimer`. Zero
coverage on `useBeep`, `TimerControls`, and the workout play page. This change
fills those gaps to prevent regressions on state transitions, skip/reset,
completion callback, beep audio, button wiring, and end-to-end page flow.

## Scope

### In Scope
- **useTimer unit tests**: start/pause/resume/skip/reset state machine, natural
  completion, progress clamp, duration=0, cleanup on unmount, onComplete contract
- **useBeep unit tests**: AudioContext creation, graceful fallback when unavailable
- **TimerControls component tests**: conditional pause/play icon rendering, handler wiring
- **Play page integration test**: idle→start→timer running, skip captures partial
  duration, last interval triggers redirect

### Out of Scope
- Sequence play page tests (deferred)
- E2E or visual/rendering-only tests
- Production code changes (strict_tdd)

## Capabilities

### New Capabilities
None — test-only change adds no new user-facing capabilities.

### Modified Capabilities
None — no spec-level behavior changes.

## Approach

Four test files mirroring source layout, one per priority tier. Existing stack:
Vitest + Testing Library + jsdom. Fake timers for time-dependent assertions.
Mock AudioContext for `useBeep`. Stub router/context for the page integration test.

| File | Location | Tests |
|------|----------|-------|
| useTimer.test.ts (extend) | src/hooks/__tests__/ | ~15 new cases |
| useBeep.test.ts | src/hooks/__tests__/ | ~4 cases |
| TimerControls.test.tsx | src/components/__tests__/ | ~5 cases |
| PlayWorkoutPage test | src/app/workouts/[id]/play/__tests__/ | ~3 cases |

### Test structure per file
- **useTimer**: `describe` blocks per action (start, pause, resume, skip, reset)
  + edge cases + cleanup. `vi.useFakeTimers` for tick-dependent assertions.
- **useBeep**: spy on `window.AudioContext` constructor; delete it or throw to
  test fallback. No DOM needed.
- **TimerControls**: render with different `status` values, assert icon (pause
  vs play_arrow) and button visibility. Fire `onPause`/`onResume`/`onSkip` to
  verify wiring.
- **Play page**: mock `useWorkoutContext`, `useSessions`, `useTimer`,
  `useParams`, `useRouter`. Render page in idle state → click Start → assert
  timer starts. Advance to skip → assert partial duration captured. Complete
  last interval → assert redirect. One test per flow path.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| src/hooks/__tests__/useTimer.test.ts | Modified | Add ~15 test cases |
| src/hooks/__tests__/useBeep.test.ts | New | Create test file |
| src/components/__tests__/TimerControls.test.tsx | New | Create test file |
| src/app/workouts/[id]/play/__tests__/page.test.tsx | New | Create test file |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| useTimer flakiness with real timers | Low | Fake timers + afterEach cleanup |
| AudioContext mock breaks in CI | Low | Guard with try-catch, test fallback |
| Play page requires heavy mocking | Med | Test as integration (module mocks) |

## Rollback Plan

Revert only test files — no production code touched, so rollback is zero-risk.
`git checkout` on the 4 test files/directories.

## Dependencies

- Vitest + @testing-library/react (already installed)
- jsdom environment (already configured)

## Success Criteria

- [ ] All new tests pass (`npx vitest run` succeeds)
- [ ] useTimer validates all state transitions: idle→running→paused→running→complete
- [ ] useBeep creates AudioContext and handles missing AudioContext gracefully
- [ ] TimerControls renders pause icon when running, play icon when paused, hides buttons in idle/complete
- [ ] Play page test covers idle→start→skip→complete redirect flow
- [ ] No production files modified (git diff shows only test files)
