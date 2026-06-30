# Phase 0 — Foundation: Delta Specs

## workload-data-model Specification

### Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| DM-1 | Define `Interval { id, type: 'prepare'\|'work'\|'rest'\|'cooldown', durationSeconds, exerciseId?, name?, order }` | MUST |
| DM-2 | Define `Workout { id, name, intervals: Interval[], createdAt, updatedAt }` | MUST |
| DM-3 | Define `Exercise { id, name, description }` | MUST |
| DM-4 | Types are plain `.ts` interfaces — no classes, no framework dependency | MUST |
| DM-5 | Export all types from `src/lib/types.ts` | MUST |

#### Scenario: Create interval for each type
- GIVEN valid parameters for each interval type
- WHEN creating `Interval` objects with `type: 'prepare'`, `'work'`, `'rest'`, and `'cooldown'`
- THEN all four objects are structurally valid

#### Scenario: Exercise assignment on Work intervals
- GIVEN an Interval with `type: 'work'`
- WHEN `exerciseId` is set to a known exercise ID
- THEN the interval references a valid exercise

#### Scenario: Workout with interval list
- GIVEN a Workout object with 4 intervals
- WHEN created with `intervals` array
- THEN intervals maintain their `order` field sequence

## workout-editor Specification

### Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| WE-1 | Display flat list of intervals with type, duration, and assigned exercise | MUST |
| WE-2 | Add interval at any position; default duration 30s for Work, 15s for Rest/Prepare/CoolDown | MUST |
| WE-3 | Remove interval via delete button on each row | MUST |
| WE-4 | Reorder intervals via move up/down buttons | MUST |
| WE-5 | Edit duration (seconds, min 5, max 600) and type via dropdown | MUST |
| WE-6 | Assign exercise to Work intervals only — non-Work intervals MUST NOT show exercise picker | MUST |
| WE-7 | First interval auto-set to `type: 'prepare'` when workout is empty | SHOULD |
| WE-8 | Last interval auto-set to `type: 'cooldown'` when only one interval remains | SHOULD |
| WE-9 | Warn before navigating away with unsaved changes | SHOULD |
| WE-10 | Editor is a single "use client" page component | MUST |

#### Scenario: Build a basic workout
- GIVEN an empty editor
- WHEN user adds 3 Work intervals and assigns exercises
- THEN list shows 4 intervals (Prepare + 3 Work + CoolDown auto-suggested)

#### Scenario: Remove all intervals
- GIVEN a workout with 2 intervals
- WHEN user removes both
- THEN editor shows empty state with "Add interval" prompt

#### Scenario: Assign exercise to Rest interval
- GIVEN a Rest interval
- WHEN user tries to select an exercise
- THEN exercise picker is hidden — Rest intervals have no exercise assignment

#### Scenario: Edit duration out of bounds
- GIVEN a Work interval with default 30s
- WHEN user enters `600` or `3`
- THEN validation clamps to `[5, 600]` range

## active-timer Specification

### Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| AT-1 | Show large countdown (HH:MM:SS) for current interval, monospace font | MUST |
| AT-2 | Show overall progress bar (% of total workout completed) | MUST |
| AT-3 | Pause/resume via single button — freezes countdown, preserves elapsed | MUST |
| AT-4 | Skip to next interval immediately — resets timer to next interval's duration | MUST |
| AT-5 | Restart from first interval — resets all state | MUST |
| AT-6 | Auto-advance on `remaining === 0` — play a brief beep/sound, move to next | MUST |
| AT-7 | Completion state when all intervals done — show "Workout Complete" screen | MUST |
| AT-8 | Correct drift using `Date.now()` delta on each 1s tick | MUST |
| AT-9 | Dark background default with high-contrast numerals | MUST |
| AT-10 | All tap targets ≥ 44px | MUST |
| AT-11 | Timer runs in `"use client"` component — no RSC for interactivity | MUST |
| AT-12 | Single `setInterval` at 1s; no animation frame, no external timer libs | MUST |

#### Scenario: Full workout execution
- GIVEN a workout with Prepare(10s) → Work(30s) → CoolDown(10s)
- WHEN user starts timer
- THEN countdown shows 00:00:10, progress bar at 0%

#### Scenario: Pause and resume
- GIVEN timer is running at 00:00:15 remaining
- WHEN user taps pause, then resume after 5s
- THEN countdown resumes at 00:00:15 (elapsed time NOT lost)

#### Scenario: Skip to next interval
- GIVEN timer is on Prepare interval
- WHEN user taps skip
- THEN timer advances to Work interval at full duration

#### Scenario: Auto-advance at zero
- GIVEN timer at 00:00:01 on Prepare
- WHEN 1 second passes
- THEN Prepare countdown reaches 00:00:00 and auto-advances to next interval

#### Scenario: All intervals complete
- GIVEN timer on last interval (CoolDown) at 00:00:01
- WHEN 1 second passes
- THEN "Workout Complete" screen shown with restart option

#### Scenario: Tab hidden and revisited
- GIVEN timer running
- WHEN user switches tabs for 10s and returns
- THEN displayed time reflects actual elapsed time (drift correction via Date.now)

## local-persistence Specification

### Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| LP-1 | Save workout to `localStorage` under key `workoutapp.workouts` | MUST |
| LP-2 | Load all workouts from `localStorage` on app start (SSR-safe guard) | MUST |
| LP-3 | List saved workouts in editor — show name, interval count, last modified | MUST |
| LP-4 | Handle missing key or corrupt JSON — return empty array without throwing | MUST |
| LP-5 | Persist on every save action (not auto-save on edit — save button only) | MUST |
| LP-6 | Generate unique IDs via `crypto.randomUUID()` or Date-based fallback | MUST |
| LP-7 | Delete not implemented in MVP — no delete UI or logic | MUST NOT |
| LP-8 | `localStorage` calls wrapped in try/catch for SSR and quota errors | SHOULD |

#### Scenario: Save and reload workout
- GIVEN a completed workout in editor
- WHEN user saves, then refreshes the page
- THEN workout appears in saved workouts list

#### Scenario: Corrupt localStorage data
- GIVEN `localStorage.workoutapp.workouts` contains invalid JSON
- WHEN app loads
- THEN saved workouts list is empty, no error thrown

#### Scenario: Empty workouts list
- GIVEN no saved workouts
- WHEN app loads
- THEN editor shows empty state with no saved workouts

#### Scenario: Multiple saves
- GIVEN 3 workouts saved
- WHEN user saves a 4th
- THEN localStorage contains 4 workout entries
