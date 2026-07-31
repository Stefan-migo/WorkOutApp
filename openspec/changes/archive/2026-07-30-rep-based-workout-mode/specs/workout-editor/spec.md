# Delta for Workout Editor

## ADDED Requirements

### Requirement: WE-26 — Mode toggle in header

Editor header SHALL render a `timed`/`reps` toggle. Switching to `reps` mode SHALL replace the duration badge with "N exercises · M total reps". Non-work intervals retain duration input.

#### Scenario: Toggle to reps mode
- GIVEN a workout with 3 work intervals in the editor
- WHEN user toggles mode to `'reps'`
- THEN header shows "3 exercises · 0 total reps"
- THEN work interval rows show reps input (span 1-999) instead of MM:SS duration
- THEN rest/prepare/cooldown rows keep duration input

#### Scenario: Toggle back to timed
- GIVEN a reps-mode workout with reps values set
- WHEN user toggles to `'timed'`
- THEN all intervals revert to duration display
- THEN reps values are preserved in the interval but hidden

### Requirement: WE-27 — Reps/weight in IntervalDetailSheet

IntervalDetailSheet SHALL show "Reps" (number 1-999) and optional "Weight (kg)" fields for work intervals when workout mode is `reps`. Non-work intervals SHALL NOT show these fields regardless of mode.

#### Scenario: Work interval sheet in reps mode
- GIVEN a work interval in a reps-mode workout
- WHEN IntervalDetailSheet opens
- THEN "Reps" input appears with value from interval.reps (default empty)
- THEN "Weight (kg)" optional input appears
- THEN saving writes reps and weight to the interval

### Requirement: WE-28 — Mode column in WorkoutBuilder CycleTemplate

CycleTemplate SHALL add optional `mode?: 'timed' | 'reps'`. Builder SHALL show a mode toggle per cycle for mixed-mode cycles.

#### Scenario: Mixed-mode cycle in builder
- GIVEN a CycleTemplate in the builder
- WHEN user sets mode to `'reps'`
- THEN the expanded intervals from the cycle inherit that mode

## MODIFIED Requirements

### Requirement: IR-1 — IntervalRow reps display

(Previously: shows MM:SS duration input for all intervals)
Updated: IntervalRow SHALL conditionally replace duration input with reps input (number, min 1, font-data-lg bold primary color) for work intervals when workout mode is `reps`.

#### Scenario: Reps input on work row
- GIVEN a work interval with `reps: 12` in reps-mode workout
- WHEN IntervalRow renders
- THEN duration field is replaced by "12" reps input, centered, bold, primary color

#### Scenario: Timed mode unchanged
- GIVEN a work interval in timed-mode workout
- WHEN IntervalRow renders
- THEN MM:SS duration input shows unchanged
