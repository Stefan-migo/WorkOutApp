# Sequence Editor

**Purpose**: Create sequences by selecting saved workouts.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| ED-1 | Form with title (required), description (optional), repeatCount (1-99) | MUST |
| ED-2 | Picklist of saved workouts; filter by name | MUST |
| ED-3 | Add workouts to sequence; reorder via drag or move up/down | MUST |
| ED-4 | Remove workout from sequence list | MUST |
| ED-5 | Validate: no duplicate workout IDs, at least 1 workout | MUST |
| ED-6 | Save creates `Sequence` with unique ID, timestamps, persists to `workoutapp.sequences` | MUST |
| ED-7 | On save, navigate to `/sequences/[id]/play` | SHOULD |

## Scenarios

### Scenario: Create sequence with 3 workouts, repeat=2
- GIVEN 5 saved workouts
- WHEN user picks 3, sets repeatCount=2, saves
- THEN sequence persists with 3 workoutIds, repeatCount=2, and non-null timestamps

### Scenario: Duplicate workout rejected
- GIVEN 2 saved workouts A and B
- WHEN user adds A, then adds A again
- THEN UI shows validation error, save disabled

### Scenario: Empty sequence rejected
- GIVEN no workouts selected
- WHEN user clicks save
- THEN UI shows "At least 1 workout required", save disabled
