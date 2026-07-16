# Workout Data Migration Specification

## Purpose

Read-time migration that expands old nested-format workouts (with `children`/`cycleCount`/`setCount`) into flat `Interval[]`. Runs in `getWorkout()` — old data is detected and expanded transparently without a separate write migration step.

## Requirements

### Requirement: MG-1 — Old format detection

The system SHALL detect old-format workouts by checking for a non-empty `children` property on any Interval during `getWorkout()`.

#### Scenario: Nested interval detected
- GIVEN a stored workout with an Interval containing `children: [{...}, {...}]`
- WHEN `getWorkout(id)` is called
- THEN the interval is identified as old format

#### Scenario: Flat workout passes through
- GIVEN a stored workout with no Interval containing `children`
- WHEN `getWorkout(id)` is called
- THEN the workout is returned as-is without migration

### Requirement: MG-2 — Cycle expansion on read

The system SHALL expand each old-format parent interval into flat intervals: expand by `cycleCount × setCount`, inserting `restBetweenCycles` rest intervals between cycles. `collapseTrailingRest` SHALL be applied to omit trailing generated rests.

#### Scenario: Simple cycle expands
- GIVEN a parent with 2 children, cycleCount=2, restBetweenCycles=10s
- WHEN expanded
- THEN result is [child1, child2, rest(10s), child1, child2]

#### Scenario: collapseTrailingRest applied
- GIVEN a workout with collapseTrailingRest=true and 2 cycles
- WHEN expanded
- THEN no rest interval follows the final cycle

### Requirement: MG-3 — Stripped output fields

Expanded intervals SHALL NOT carry old-format fields: `children`, `cycleCount`, `setCount`, `restBetweenCycles`, `collapseTrailingRest`, `isGenerated`.

#### Scenario: Clean intervals
- GIVEN any expanded workout
- WHEN any interval is inspected
- THEN `children`, `cycleCount`, `setCount` fields are absent

### Requirement: MG-4 — Graceful fallback

If migration encounters invalid data (malformed children, negative durations), the system SHALL return the original workout unmodified and log a warning to console.

#### Scenario: Malformed data falls back
- GIVEN a stored workout with `children: null` on an Interval
- WHEN `getWorkout(id)` is called
- THEN the original workout is returned as-is
- AND a warning is logged
