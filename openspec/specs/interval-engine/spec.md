# Interval Engine Specification

## Purpose

Pure functions that transform nested interval trees into flat linear sequences for timer and editor consumption. Foundation for circuit/superset workflows.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| IE-1 | `flattenWorkout(workout): Interval[]` — DFS flatten expanding `cycleCount × setCount`, inserting `restBetweenCycles` rest between cycles | MUST |
| IE-2 | `getTotalDuration(workout): number` — sum of all flattened intervals' durations | MUST |
| IE-3 | `locateByElapsed(workout, elapsedSeconds): { interval, localElapsed }` — locate active interval at given total elapsed time; null if beyond total | MUST |
| IE-4 | All functions SHALL be pure — no mutation of input, no side effects, no state | MUST |
| IE-5 | Empty input — flatten returns [], totalDuration returns 0, locateByElapsed returns null | MUST |

## Flatten Semantics

A leaf interval (no `children`) is emitted as-is. A parent with `children` is a cycle container — the parent itself is NOT emitted, only its children expanded by `cycleCount × setCount`. After each cycle except the last, if `restBetweenCycles > 0`, a synthetic rest interval of that duration is inserted.

## Scenarios

### Scenario: Flat workout passes through
- GIVEN a workout with 3 leaf intervals
- WHEN `flattenWorkout` is called
- THEN output is the same 3 intervals in order

### Scenario: Cycle with sets expands correctly
- GIVEN a parent with 2 children, `cycleCount=2`, `setCount=3`
- WHEN `flattenWorkout` is called
- THEN output length is 2 × 3 × 2 = 12 intervals

### Scenario: Rest inserted between cycles
- GIVEN parent with 1 child (30s), `cycleCount=2`, `restBetweenCycles=10`
- WHEN `flattenWorkout` is called
- THEN output is [child(30s), rest(10s), child(30s)]

### Scenario: Locate returns correct interval
- GIVEN flattened durations [10, 20, 15]
- WHEN `locateByElapsed(workout, 25)` is called
- THEN result is interval at index 1 with `localElapsed=15`

### Scenario: Locate beyond total returns null
- GIVEN flattened durations [10, 20]
- WHEN `locateByElapsed(workout, 35)` is called
- THEN result is null

### Scenario: Empty workout
- GIVEN a workout with `intervals=[]`
- WHEN `flattenWorkout` is called
- THEN an empty array is returned

## Testing Requirements (Phase 4 — Test Migration)

Testing requirements migrated from inline `runEngineTests()` asserts to proper Vitest `describe`/`it`/`expect`.

### Requirement: IE-T1 — flattenWorkout correctness

The test file MUST cover `flattenWorkout` with empty input, flat passthrough, cycle expansion (2 children × 2 cycles), set + cycle expansion (2×2×2), rest insertion between cycles, nested DFS (depth propagation), and mixed flat + cycle workouts.

#### Scenario: empty intervals list returns empty array
- GIVEN a workout with `intervals: []`
- WHEN `flattenWorkout(workout)` is called
- THEN the result MUST be an empty array

#### Scenario: flat intervals pass through at depth 0 with no cycle/set indices
- GIVEN a workout with 3 flat intervals (work, rest, work)
- WHEN `flattenWorkout` is called
- THEN the result MUST have 3 items, all at `depth: 0`, with `cycleIndex` and `setIndex` undefined

#### Scenario: cycle expansion produces children × cycles items per set
- GIVEN a parent interval with 2 children, `cycleCount: 2`, `setCount: 1`
- WHEN `flattenWorkout` is called
- THEN the result MUST have 4 items, all at `depth: 1`, with correct `cycleIndex`/`setIndex` values

#### Scenario: rest intervals inserted between cycles
- GIVEN a parent with `restBetweenCycles: 10`, 1 child, `cycleCount: 2`
- WHEN `flattenWorkout` is called
- THEN the result MUST have 3 items, the middle item MUST be `isGenerated: true`, `type: 'rest'`, `duration: 10`

#### Scenario: nested DFS correctly propagates depth
- GIVEN a parent → child → 2 leaf intervals with `cycleCount: 1`, `setCount: 1`
- WHEN `flattenWorkout` is called
- THEN the result MUST have 2 items at `depth: 2`

### Requirement: IE-T2 — totalDuration correctness

`totalDuration` MUST sum all flattened interval durations.

#### Scenario: totalDuration returns sum of all intervals
- GIVEN a workout with intervals [10, 20, 15]
- WHEN `totalDuration(workout)` is called
- THEN the result MUST be 45

#### Scenario: totalDuration returns 0 for empty workout
- GIVEN a workout with `intervals: []`
- WHEN `totalDuration(workout)` is called
- THEN the result MUST be 0

### Requirement: IE-T3 — durationAt correctness

`durationAt` MUST return the interval at the given elapsed time with correct `localElapsed`.

#### Scenario: durationAt finds interval at given elapsed offset
- GIVEN a workout with intervals [10, 20, 15]
- WHEN `durationAt(workout, 25)` is called
- THEN the result MUST have `interval.id === 'b'` and `localElapsed === 15`

#### Scenario: durationAt returns undefined for elapsed beyond total
- GIVEN a workout with total duration of 45
- WHEN `durationAt(workout, 100)` is called
- THEN the result MUST be `undefined`
