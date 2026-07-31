# Session History

**Purpose**: Log and review completed workout/sequence sessions.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| SH-1 | List sessions ordered by startedAt descending | MUST |
| SH-2 | Each entry shows: date, type (workout/sequence), duration, name | MUST |
| SH-3 | Session detail page shows all intervals with planned vs actual duration. For intervals with `plannedReps`, SHALL additionally show rep and weight information | MUST |
| SH-7 | Session detail SHALL display plannedReps, actualReps, and weight columns for intervals that have `plannedReps` set. Display format: "X / Y reps" + "Z kg" when both planned and actual exist; "X planned reps" when only planned exists. No rep/weight for timed-only intervals | MUST |
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

### Scenario: Rep interval with actual data
- GIVEN a session with a rep interval (plannedReps=12, actualReps=10, weight=20.5)
- WHEN session detail renders
- THEN row shows "10 / 12 reps" and "20.5 kg"

### Scenario: Rep interval only planned
- GIVEN a session with a rep interval (plannedReps=12, no actualReps)
- WHEN session detail renders
- THEN row shows "12 planned reps"
- THEN weight column is absent

### Scenario: Timed interval hides rep columns
- GIVEN a session with timed intervals only (no reps)
- WHEN session detail renders
- THEN no rep/weight data appears for those intervals

### Scenario: Mixed session detail
- GIVEN a session with both timed intervals and a rep interval
- WHEN session detail renders
- THEN timed intervals show planned vs actual duration only
- THEN rep interval shows duration AND rep/weight data

### Scenario: Repeat loads current data
