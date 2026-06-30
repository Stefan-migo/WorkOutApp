# Session History

**Purpose**: Log and review completed workout/sequence sessions.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| SH-1 | List sessions ordered by startedAt descending | MUST |
| SH-2 | Each entry shows: date, type (workout/sequence), duration, name | MUST |
| SH-3 | Session detail page shows all intervals with planned vs actual duration | MUST |
| SH-4 | "Repeat" button on session detail loads source workouts and starts timer | MUST |
| SH-5 | Repeat re-fetches workouts from localStorage (no snapshot) | MUST |
| SH-6 | Append-only — no delete in MVP | MUST NOT |

## Scenarios

### Scenario: Session logged after single workout
- GIVEN a single workout played standalone
- WHEN timer completes
- THEN a Session with `type: 'workout'`, sequenceId unset, workoutId set, intervals populated

### Scenario: Session logged after sequence
- GIVEN a sequence of 3 workouts completes
- THEN a Session with `type: 'sequence'`, sequenceId set, all intervals from all workouts

### Scenario: Repeat loads current data
- GIVEN a session from yesterday where workout intervals have since been edited
- WHEN user taps "Repeat"
- THEN the player loads the CURRENT version of the workout from localStorage
