# PlayWorkoutPage Tests

## Purpose

Verify the workout play page (`src/app/workouts/[id]/play/page.tsx`) orchestrates the idle→active→complete flow, handles skip with partial duration capture, and saves sessions on completion.

## Requirements

### Requirement: PP-1 — Idle phase rendering

The page MUST render workout title, interval count, and a "Start" button when `phase='idle'`.

#### Scenario: Idle shows start screen
- GIVEN a valid workout with 5 intervals
- WHEN the page renders
- THEN it displays the workout title, "5 intervals" summary, and a Start button

### Requirement: PP-2 — Start transitions to active

Clicking Start MUST set phase to `'active'` and initialize the timer.

#### Scenario: Start begins countdown
- GIVEN the idle page for a workout with a 30s Work interval
- WHEN the Start button is clicked
- THEN the timer ring appears showing 00:00:30 and the timer is running

### Requirement: PP-3 — Skip captures partial duration

Calling `handleSkip` MUST compute `actualDuration = plannedDuration - timeLeft` and append a `completed: false` entry.

#### Scenario: Skip after 10s records partial
- GIVEN the page on a 60s interval, timer started and 10s elapsed
- WHEN skip is triggered
- THEN a completed interval is recorded with `actualDuration` ≈ 10 and `completed: false`

### Requirement: PP-4 — Last interval completion saves session

When the last interval reaches 0 naturally, the page MUST save a session via `addSession` and redirect to `/history/[sessionId]`.

#### Scenario: Complete last interval triggers redirect
- GIVEN the page on the last interval with 1s remaining
- WHEN the timer completes naturally
- THEN `addSession` is called with the completed intervals array, and `router.push` is called with `/history/{sessionId}`

### Requirement: PP-5 — Last interval skip saves session

Calling skip on the last interval MUST record partial duration and trigger session save + redirect.

#### Scenario: Skip last interval saves partial session
- GIVEN the page on the last interval at any timeLeft
- WHEN skip is called
- THEN the interval is recorded with `completed: false`, session saved, redirect to `/history/{sessionId}`

### Requirement: PP-6 — Workout not found

The page MUST show "Workout not found" with a back link when `getWorkout` returns null.

#### Scenario: Missing workout shows error
- GIVEN `getWorkout` returns null/undefined
- WHEN the page renders
- THEN "Workout not found" is displayed with a link back to `/workouts`
