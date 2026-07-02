# Design: Timer Play Flow Tests

## Technical Approach

Test-only change. Four test files following existing project patterns: Vitest + Testing Library + jsdom. Fake timers for time-dependent hook tests, pure render-based prop assertions for components, and module-level mocking for the page integration test.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|----------|--------|-------------|-----------|
| TimerControls approach | Pure render tests, no fake timers | advanceTimersByTime | Component is purely presentational — renders different markup per `status` prop. No timer logic to advance. |
| Play page useTimer | Module mock capturing `onComplete` | Real useTimer with fake timers | Page logic is about orchestrating timer events (save session, redirect) — we control the hook output and trigger `onComplete` directly. Avoids fighting interval complexity in an integration test. |
| AudioContext mock | Spy on window.AudioContext constructor | Full mock class | Simpler, tests the actual try-catch in useBeep. Delete/restore the global to test fallback paths. |
| Page test imports | Dynamic `await import()` | Static import | Matches existing page test pattern (ExercisesPage, NewWorkoutPage) — avoids module hoisting surprises with `vi.mock`. |

## Mocking Strategy

| Production Module | What to Mock | How |
|---|---|---|
| `next/navigation` | `useRouter`, `useParams` | `vi.mock('next/navigation', ...)` — `useRouter` returns `{ push: vi.fn() }`, `useParams` returns `{ id: 'w1' }` |
| `@/context/WorkoutContext` | `useWorkoutContext` | Return `{ getWorkout: vi.fn(), ... }` via `vi.mock` |
| `@/hooks/useSessions` | `addSession` | Return `{ addSession: vi.fn() }` |
| `@/hooks/useTimer` | Full hook return value | Controlled mock. Module-level variable captures the `onComplete` callback so tests can trigger natural completion. Return spies for `start/pause/resume/skip/addTime/reset`. |
| `@/hooks/useBeep` | No-op | `vi.mock('@/hooks/useBeep', () => ({ useBeep: () => ({ beep: vi.fn() }) }))` |
| `@/hooks/useIntervalNotification` | No-op | `vi.mock` returning `{ notify: vi.fn() }` |
| `@/hooks/useExercises` | `getExercise` | Return mock exercise data |
| `window.AudioContext` (useBeep only) | Constructor spy | `vi.spyOn(window, 'AudioContext')` — `mockImplementation` returning mocked oscillator/gain. For fallback tests, `delete (window as any).AudioContext` before test, restore in `afterEach`. |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/__tests__/useTimer.test.ts` | Modify | Add ~15 test cases: state machine (start→pause→resume→skip→reset), natural completion, onComplete callback, progress, duration=0, unmount cleanup |
| `src/hooks/__tests__/useBeep.test.ts` | Create | ~4 test cases: AudioContext creation, graceful fallback (missing/throws), webkitAudioContext, idempotent calls |
| `src/components/__tests__/TimerControls.test.tsx` | Create | ~5 test cases: pause/play icon, button visibility per status, handler wiring, conditional rewind |
| `src/app/workouts/\[id\]/play/__tests__/page.test.tsx` | Create | ~3 test cases: idle render → start, skip captures partial duration, last interval completion/redirect |

## Data Flow (Play Page Test)

```
Test → vi.mock() modules → render(<Page/>)
  ↓ idle state
screen.getByText('Start') → fireEvent.click
  ↓ handleStart() calls setPhase('active')
  ↓ useEffect triggers timer.start()
  ↓ mock timer.status === 'running'
  → assert TimerRing visible, timer display renders

Test → trigger mock skip()
  ↓ handleSkip() captures elapsed, calls timer.skip()
  → assert completedIntervals updated with actualDuration

Test → trigger onComplete (last interval)
  ↓ page sets phase='complete', sessionSavedRef gate
  → assert addSession called, router.push('/history/...')
```

## Existing Patterns (for consistency)

- Hook imports: `import { describe, it, expect, vi, afterEach } from 'vitest'` + `import { renderHook, act } from '@testing-library/react'`
- Component imports: same + `import { render, screen, cleanup, fireEvent } from '@testing-library/react'` + `import '@testing-library/jest-dom/vitest'`
- Cleanup: `afterEach(cleanup)` for component tests, `afterEach(() => vi.useRealTimers())` for hook tests with fake timers
- Module mock pattern: declare mocks at top level with `vi.mock()`, use `vi.mocked()` for per-test return values
- Page test imports: dynamic `await import('../page')` inside each test
- Fake timers: `vi.useFakeTimers()` in test body, `vi.advanceTimersByTime(ms)` for progression, `vi.useRealTimers()` in `afterEach`
- No snapshot tests in existing patterns — assertions are explicit with `toBeInTheDocument()` / `toHaveTextContent()`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Hook unit (useTimer) | State machine, completion, callbacks, edge cases | `renderHook` + `act` + `vi.useFakeTimers`. Assert status/timeLeft/progress after transitions. |
| Hook unit (useBeep) | AudioContext creation, error fallback | Spy on globals, call `beep()`, assert no throw. Delete AudioContext to test fallback. |
| Component unit (TimerControls) | Conditional render, handler wiring | Render with different `status` prop values, assert icon/text visibility, `fireEvent.click` and assert handler called. |
| Page integration (PlayWorkoutPage) | Idle→start→skip→complete flow | Module mocks, render page, simulate user clicks, trigger callbacks, verify session saving and redirect. |

## Migration / Rollout

No migration required. Tests run independently via `npx vitest run`.

## Open Questions

None.
