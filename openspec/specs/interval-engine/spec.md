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
