# Delta for Interval Engine

## MODIFIED Requirements

### Requirement: IE-1 — flattenWorkout

`flattenWorkout(workout): Interval[]` — returns a shallow copy of `workout.intervals` (passthrough, no recursion, no cycle/set/rest expansion).
(Previously: DFS flatten expanding cycleCount × setCount, inserting restBetweenCycles between cycles.)

#### Scenario: Flat workout passes through unchanged
- GIVEN a workout with 3 leaf intervals
- WHEN `flattenWorkout` is called
- THEN output is the same 3 intervals in order

#### Scenario: Empty workout
- GIVEN a workout with `intervals=[]`
- WHEN `flattenWorkout` is called
- THEN an empty array is returned

### Requirement: IE-T1 — flattenWorkout correctness

The test file MUST cover `flattenWorkout` with empty input and flat passthrough.
(Previously: also covered cycle expansion, rest insertion, nested DFS depth propagation, and cycleIndex/setIndex/depth fields.)

#### Scenario: empty intervals returns empty array
- GIVEN a workout with `intervals: []`
- WHEN `flattenWorkout(workout)` is called
- THEN the result MUST be an empty array

#### Scenario: flat intervals pass through unchanged
- GIVEN a workout with 3 flat intervals (work, rest, work)
- WHEN `flattenWorkout` is called
- THEN the result MUST have 3 items, same order and types

## REMOVED Requirements

### Flatten Semantics section

(Reason: No cycle/set/rest expansion exists. Functions operate directly on the flat array. The concept of "leaf interval" vs "cycle container" no longer applies.)

### IE-T1 scenarios removed (cycle/set/rest expansion)

(Reason: flattenWorkout is now passthrough — cycle expansion, rest insertion, and DFS depth tests are no longer applicable.)
(Migration: Remove tests for cycle × set expansion, rest between cycles insertion, nested DFS depth propagation, and cycleIndex/setIndex fields.)

#### Scenarios removed:
- Cycle expansion produces children × cycles items per set
- Rest intervals inserted between cycles
- Nested DFS correctly propagates depth
- Flat passthrough with depth 0 and cycleIndex/setIndex undefined (superseded by new flat passthrough above)

## UNCHANGED Requirements

The following requirements are unchanged from the main spec:

- IE-2: `getTotalDuration(workout): number` — sum of all flattened intervals' durations
- IE-3: `locateByElapsed(workout, elapsedSeconds): { interval, localElapsed }` — locate active interval at given elapsed time
- IE-4: All functions SHALL be pure — no mutation, no side effects, no state
- IE-5: Empty input — flatten returns [], totalDuration returns 0, locateByElapsed returns null
- IE-T2: totalDuration correctness (sum of intervals, 0 for empty)
- IE-T3: durationAt correctness (find interval at offset, undefined beyond total)
