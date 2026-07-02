# Delta — useTimer Tests

## Context

Extends existing `src/hooks/__tests__/useTimer.test.ts` (7 addTime tests). Adds coverage for the full state machine: start/pause/resume/skip/reset, natural completion, onComplete callback, progress, duration=0, and cleanup.

## ADDED Requirements

### Requirement: UT-1 — State machine transitions

The test suite MUST verify all valid transitions: idle→running (start), running→paused (pause), paused→running (resume), any→complete (skip), any→idle (reset). Invalid transitions SHALL be no-ops (e.g., pause while idle).

#### Scenario: Happy path round-trip
- GIVEN a hook with `useTimer(60)`
- WHEN `start()` is called
- THEN status is `"running"` and timeLeft is 60
- WHEN `pause()` is called after 5s (fake timers)
- THEN status is `"paused"` and timeLeft is 55
- WHEN `resume()` is called and 3s elapse
- THEN status is `"running"` and timeLeft is 52

#### Scenario: Skip transitions to complete
- GIVEN a running timer at any timeLeft
- WHEN `skip()` is called
- THEN status is `"complete"`, timeLeft is 0

#### Scenario: Reset returns to idle
- GIVEN a timer in any non-idle state
- WHEN `reset()` is called
- THEN status is `"idle"` and timeLeft resets to duration

#### Scenario: Pause while idle is no-op
- GIVEN an idle timer
- WHEN `pause()` is called
- THEN status remains `"idle"`

### Requirement: UT-2 — Natural completion

The test suite MUST verify that the timer completes when countdown reaches 0.

#### Scenario: Timer reaches zero naturally
- GIVEN `useTimer(3)` with fake timers
- WHEN `start()` is called and 3s elapse
- THEN status transitions to `"complete"` and timeLeft is 0

### Requirement: UT-3 — onComplete callback

The `onComplete` callback MUST be invoked on skip AND natural completion. It MUST be optional.

#### Scenario: onComplete fires on natural completion
- GIVEN `useTimer(2, onComplete)` with a mock callback
- WHEN `start()` is called and 2s elapse
- THEN `onComplete` is called exactly once

#### Scenario: onComplete fires on skip
- GIVEN `useTimer(60, onComplete)` with a mock callback
- WHEN `skip()` is called
- THEN `onComplete` is called exactly once

### Requirement: UT-4 — Progress computation

`progress` MUST range from 0 (at start) to 1 (at complete/in skip). Computed as `1 - timeLeft / duration`.

#### Scenario: Progress at midpoint
- GIVEN `useTimer(60)` with fake timers
- WHEN `start()` is called and 30s elapse
- THEN `progress` is approximately 0.5

### Requirement: UT-5 — Edge cases

Tests MUST verify duration=0 instant-completion and interval cleanup on unmount.

#### Scenario: duration=0 immediately completes
- GIVEN `useTimer(0)`
- WHEN `start()` is called
- THEN status is `"complete"` and timeLeft is 0

#### Scenario: Interval cleared on unmount
- GIVEN a running timer with `useTimer(60)`
- WHEN the component unmounts
- THEN the interval is cleared (no console errors)
