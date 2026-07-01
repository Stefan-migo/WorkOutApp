# Sequence Engine

**Purpose**: Pure functions that compute sequence navigation state — consumed by the sequence player, no side effects.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| SE-1 | Compute total rounds = workoutIds.length × repeatCount | MUST |
| SE-2 | Return workout ID + round number for a given index | MUST |
| SE-3 | Return next workout ID given current index; null if done | MUST |
| SE-4 | Detect if sequence is complete (index >= totalRounds) | MUST |
| SE-5 | Return progress as `{ current, total, percent }` | MUST |

## Scenarios

### Scenario: 3 workouts × 2 repeats yields 6 rounds
- GIVEN `{ workoutIds: [a,b,c], repeatCount: 2 }`
- WHEN `getTotalRounds(seq)` is called
- THEN result is 6

### Scenario: Progress at round 3 of 6
- GIVEN a sequence with totalRounds=6, currentIndex=3
- WHEN `getProgress(seq, 3)` is called
- THEN `{ current: 3, total: 6, percent: 50 }` (engine returns 0-based index; display layer adds +1 for 1-based user-facing output)

## Testing Requirements (Phase 4 — Test Migration)

Testing requirements migrated from inline `runEngineTests()` asserts to proper Vitest `describe`/`it`/`expect`.

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
