# Spec: Phase 4 — Test Migration

Tests-only phase. Production code is read-only. Migrate inline `assert()` self-checks to proper Vitest `describe`/`it`/`expect` and add missing coverage.

Persistence is `hybrid` — this file is the OpenSpec artifact; a copy persists to Engram.

---

## Domain: interval-engine tests (NEW)

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

---

## Domain: sequence-engine tests (NEW)

### Requirement: SE-T1 — getTotalRounds correctness

`getTotalRounds` MUST return `workoutIds.length × repeatCount`.

#### Scenario: basic multiplication

- GIVEN a sequence with `workoutIds: ['a','b','c']` and `repeatCount: 2`
- WHEN `getTotalRounds(seq)` is called
- THEN the result MUST be 6

#### Scenario: single workout single repeat

- GIVEN a sequence with `workoutIds: ['a']` and `repeatCount: 1`
- WHEN `getTotalRounds(seq)` is called
- THEN the result MUST be 1

### Requirement: SE-T2 — getRoundAt correctness

`getRoundAt` MUST map an index to a `{ workoutId, round }` pair and return `undefined` for out-of-range indices.

#### Scenario: returns correct workoutId and round for valid indices

- GIVEN a sequence `{ workoutIds: ['a','b','c'], repeatCount: 2 }`
- WHEN `getRoundAt(seq, 0)` is called
- THEN the result MUST be `{ workoutId: 'a', round: 1 }`
- WHEN `getRoundAt(seq, 2)` is called
- THEN the result MUST be `{ workoutId: 'c', round: 1 }`
- WHEN `getRoundAt(seq, 3)` is called
- THEN the result MUST be `{ workoutId: 'a', round: 2 }`

#### Scenario: returns undefined for negative or out-of-range index

- GIVEN the same sequence
- WHEN `getRoundAt(seq, -1)` or `getRoundAt(seq, 6)` is called
- THEN the result MUST be `undefined`

### Requirement: SE-T3 — getProgress correctness

`getProgress` MUST cap at total, return 0% at start, and 100% when at or past total.

#### Scenario: progress at halfway

- GIVEN sequence with `getTotalRounds() === 6`
- WHEN `getProgress(seq, 3)` is called
- THEN the result MUST be `{ current: 3, total: 6, percent: 50 }`

#### Scenario: progress at start and completion

- WHEN `getProgress(seq, 0)` is called
- THEN `percent` MUST be 0
- WHEN `getProgress(seq, 6)` or `getProgress(seq, 99)` is called
- THEN `current` MUST be capped at `total` and `percent` MUST be 100

### Requirement: SE-T4 — resolveWorkouts filters missing IDs

`resolveWorkouts` MUST return only workouts whose IDs match the sequence's `workoutIds`, preserving order, and silently dropping unmatched IDs.

#### Scenario: filters missing workout IDs

- GIVEN `workoutIds: ['a', 'b', 'missing']` and workouts list containing `a` and `b`
- WHEN `resolveWorkouts(seq, workouts)` is called
- THEN the result MUST have length 2 with `resolved[0].id === 'a'` and `resolved[1].id === 'b'`

---

## Domain: calendar-utils tests (NEW)

### Requirement: CU-T1 — getMonday returns correct Monday ISO date

`getMonday` MUST return the ISO YYYY-MM-DD of the Monday of the week containing the given date, regardless of input day.

#### Scenario: Monday input returns itself

- GIVEN a Monday date `2026-06-29T12:00:00`
- WHEN `getMonday(date)` is called
- THEN the result MUST be `'2026-06-29'`

#### Scenario: Wednesday returns previous Monday

- GIVEN a Wednesday `2026-07-01T12:00:00`
- WHEN `getMonday(date)` is called
- THEN the result MUST be `'2026-06-29'`

#### Scenario: Sunday returns previous Monday

- GIVEN a Sunday `2026-07-05T12:00:00`
- WHEN `getMonday(date)` is called
- THEN the result MUST be `'2026-06-29'`

### Requirement: CU-T2 — formatWeekRange returns human-readable range

`formatWeekRange` MUST format a start Monday into a human range like `"Jun 29 - Jul 5, 2026"`.

#### Scenario: same-month range contains start day, end day, and year

- GIVEN startDate `'2026-06-29'`
- WHEN `formatWeekRange(startDate)` is called
- THEN the result MUST include `'Jun 29'`, `'Jul 5'`, and `'2026'`

### Requirement: CU-T3 — previousWeek and nextWeek shift by 7 days

#### Scenario: nextWeek adds 7 days

- GIVEN `'2026-06-29'`
- WHEN `nextWeek(startDate)` is called
- THEN the result MUST be `'2026-07-06'`

#### Scenario: previousWeek subtracts 7 days

- GIVEN `'2026-06-29'`
- WHEN `previousWeek(startDate)` is called
- THEN the result MUST be `'2026-06-22'`

### Requirement: CU-T4 — getDayOfWeek returns Mon=0 .. Sun=6

#### Scenario: Monday returns 0, Tuesday returns 1, Sunday returns 6

- GIVEN `2026-06-29` (Monday)
- WHEN `getDayOfWeek(date)` is called
- THEN result MUST be 0
- GIVEN `2026-07-05` (Sunday)
- WHEN `getDayOfWeek(date)` is called
- THEN result MUST be 6
