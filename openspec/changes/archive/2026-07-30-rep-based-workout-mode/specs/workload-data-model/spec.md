# Delta for Workload Data Model

## ADDED Requirements

### Requirement: DM-19 — WorkoutMode type

Add type `WorkoutMode = 'timed' | 'reps'`. Workout gets optional `mode?: WorkoutMode`. Absent resolves to `'timed'`.

#### Scenario: Legacy workout defaults to timed
- GIVEN a Workout without `mode` field
- WHEN accessed
- THEN `mode` resolves to `'timed'` at runtime

#### Scenario: Workout set to reps
- GIVEN a Workout with `mode: 'reps'`
- WHEN accessed
- THEN mode is `'reps'`

## MODIFIED Requirements

### Requirement: DM-1 — Interval fields

```
Interval { id, type, title, duration, description?, imageUrl?, exerciseId?,
           reps?, weight?, mode?, cycleIndex?, cycleId?, cycleTitle? }
```
(Previously: no reps, weight, mode fields)

#### Scenario: Reps interval is valid
- GIVEN an Interval with `reps: 12`, `type: 'work'`
- WHEN validated
- THEN it is structurally valid

#### Scenario: Per-interval mode override
- GIVEN an Interval with `mode: 'reps'` and parent Workout with `mode: 'timed'`
- WHEN used in play
- THEN interval overrides workout mode (mixed cycle)

### Requirement: DM-13 — CompletedInterval fields

```
CompletedInterval { intervalId, title, type, plannedDuration, actualDuration,
                    completed, notes?, plannedReps?, actualReps?, weight? }
```
(Previously: no rep/weight fields)

#### Scenario: Rep-mode session saves data
- GIVEN a completed rep interval (plannedReps=12, actualReps=10, weight=20.5)
- WHEN saved to session
- THEN all three fields persist in the Session object

## REMOVED Requirements

None.

## RENAMED Requirements

None.
