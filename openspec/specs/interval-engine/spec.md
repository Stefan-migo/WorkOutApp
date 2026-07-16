# Interval Engine Specification

## Purpose

Pure functions that provide basic interval list operations (flatten identity, sum, locate by time) for timer consumption. The flat model is the canonical storage format — no tree expansion needed.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| IE-1 | `flattenWorkout(workout)` returns `workout.intervals` as identity (passthrough, no transformation) | MUST |
| IE-2 | `totalDuration(workout): number` — sum of all interval durations | MUST |
| IE-3 | `durationAt(workout, elapsed): { interval: Interval; localElapsed: number } \| undefined` — locate active interval at given total elapsed time; `undefined` if beyond total | MUST |
| IE-4 | All functions SHALL be pure — no mutation of input, no side effects, no state | MUST |
| IE-5 | Empty input — flatten returns [], totalDuration returns 0, durationAt returns undefined | MUST |

## Scenarios

### Scenario: Identity passthrough
- GIVEN a workout with 3 flat intervals
- WHEN `flattenWorkout` is called
- THEN the output MUST be the same array reference as `workout.intervals`

### Scenario: Locate returns correct interval
- GIVEN flattened durations [10, 20, 15]
- WHEN `durationAt(workout, 25)` is called
- THEN result is interval at index 1 with `localElapsed=15`

### Scenario: Locate beyond total returns undefined
- GIVEN flattened durations [10, 20]
- WHEN `durationAt(workout, 35)` is called
- THEN result is undefined

### Scenario: Empty workout
- GIVEN a workout with `intervals=[]`
- WHEN `flattenWorkout` is called
- THEN an empty array is returned
