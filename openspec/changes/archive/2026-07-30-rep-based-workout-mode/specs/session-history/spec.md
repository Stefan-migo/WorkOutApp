# Delta for Session History

## ADDED Requirements

### Requirement: SH-7 — Rep/weight display in session detail

Session detail SHALL display plannedReps, actualReps, and weight columns for intervals that have `plannedReps` set. Display format: "X / Y reps" and "Z kg" when both planned and actual exist. "X planned reps" when only planned exists. No rep/weight section for timed-only intervals.

#### Scenario: Rep interval with actual data
- GIVEN a session with a rep interval (plannedReps=12, actualReps=10, weight=20.5)
- WHEN session detail renders
- THEN row shows "10 / 12 reps" and "20.5 kg"

#### Scenario: Rep interval only planned
- GIVEN a session with a rep interval (plannedReps=12, no actualReps)
- WHEN session detail renders
- THEN row shows "12 planned reps"
- THEN weight column is absent

#### Scenario: Timed interval hides rep columns
- GIVEN a session with timed intervals only (no reps)
- WHEN session detail renders
- THEN no rep/weight data appears for those intervals

## MODIFIED Requirements

### Requirement: SH-3 — Session detail with rep data

(Previously: shows planned vs actual duration for all intervals)
Updated: Session detail SHALL show all intervals with planned vs actual duration. For intervals with `plannedReps`, SHALL additionally show rep and weight information.

#### Scenario: Mixed session detail
- GIVEN a session with both timed intervals and a rep interval
- WHEN session detail renders
- THEN timed intervals show planned vs actual duration only
- THEN rep interval shows duration AND rep/weight data
