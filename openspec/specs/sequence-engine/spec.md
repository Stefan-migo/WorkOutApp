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
