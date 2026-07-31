# Workload Data Model

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| DM-1 | Define `Interval { id, type: IntervalType, title, duration, description?, imageUrl?, reps?, weight?, mode? }` — flat interval model, no nesting fields. `reps` and `mode` added for rep-based workout mode support | MUST |
| DM-2 | Define `Workout { id, title, description?, imageUrl?, intervals: Interval[], createdAt, updatedAt }` | MUST |
| DM-3 | Define `Exercise { id, name, description?, muscleGroups: string[], category: ExerciseCategory, createdAt: string, updatedAt: string }` — `category` uses the `ExerciseCategory` enum, `muscleGroups` is an array (default `[]`), timestamps are ISO strings | MUST |
| DM-4 | Types are plain `.ts` interfaces — no classes, no framework dependency | MUST |
| DM-5 | Export all types from `src/types/workout.ts` | MUST |
| DM-11 | Define `Sequence { id, title, description?, workoutIds[], createdAt, updatedAt }` | MUST |
| DM-12 | Define `Session { id, sequenceId?, workoutId?, startedAt, completedAt?, intervals: CompletedInterval[] }` | MUST |
| DM-13 | Define `CompletedInterval { intervalId, title, type, plannedDuration, actualDuration, completed, plannedReps?, actualReps?, weight? }` — `plannedReps`, `actualReps`, `weight` added for rep-based workout mode | MUST |
| DM-14 | Define `WeekPlan { id, title?, startDate (ISO Monday), days: DayAssignment[7], createdAt, updatedAt }` and `DayAssignment { workoutId?, sequenceId?, notes? }`. At least one of workoutId/sequenceId MAY be null | MUST |
| DM-15 | Define `ProgramTemplate { id, title, description?, days: DayAssignment[7], createdAt, updatedAt }` — reusable snapshot of a week's assignments | MUST |
| DM-16 | Define `ExerciseCategory = 'strength' \| 'cardio' \| 'stretching' \| 'mobility' \| 'other'` | MUST |
| DM-17 | Define `IntervalType = 'prepare' \| 'work' \| 'rest' \| 'rest_between_cycles' \| 'cooldown'` | MUST |
| DM-18 | Define `CycleTemplate { id, title, description?, repeat, workDuration, restDuration, skipLastRest }` — Transient creation-time helper, NOT persisted to localStorage | MUST |
| DM-19 | Define `WorkoutMode = 'timed' | 'reps'`. Workout SHALL have optional `mode?: WorkoutMode`. Absent resolves to `'timed'` at runtime for backward compatibility | MUST |

## Scenarios

### Scenario: Create interval for each type
- GIVEN valid parameters for each interval type
- WHEN creating `Interval` objects with `type: 'prepare'`, `'work'`, `'rest'`, `'rest_between_cycles'`, and `'cooldown'`
- THEN all five objects are structurally valid

### Scenario: imageUrl on interval
- GIVEN an interval with `imageUrl: 'https://example.com/demo.png'`
- WHEN validated
- THEN it is structurally valid

### Scenario: Workout with description and imageUrl
- GIVEN a Workout with description and imageUrl set
- WHEN inspected
- THEN both optional fields are present

### Scenario: Workout with interval list
- GIVEN a Workout object with 4 intervals
- WHEN created with `intervals` array
- THEN intervals maintain their array sequence

### Scenario: CycleTemplate created with defaults
- GIVEN the builder creates a new CycleTemplate
- WHEN inspected
- THEN repeat=4, workDuration=30, restDuration=15, skipLastRest=true

### Scenario: CycleTemplate is NOT persisted
- GIVEN a CycleTemplate used during workout creation
- WHEN the workout is saved
- THEN CycleTemplate is expanded to flat Interval[] and is absent from storage

### Scenario: Create WeekPlan for current week
- GIVEN no WeekPlan exists for the week containing a given date
- WHEN `getWeekPlan(date)` is called
- THEN a new WeekPlan with 7 empty DayAssignments is created and returned

### Scenario: WeekPlan startDate is ISO Monday
- GIVEN any arbitrary date
- WHEN creating a WeekPlan
- THEN `startDate` is midnight UTC of the preceding Monday (ISO 8601 week start)

### Scenario: DayAssignment with only notes
- GIVEN a day with no workoutId and no sequenceId
- WHEN the DayAssignment is created with notes only
- THEN it is valid and does not throw

### Scenario: Exercise with all optional fields
- GIVEN an Exercise object from localStorage before this change
- WHEN `muscleGroups`, `category`, `createdAt`, `updatedAt` are absent
- THEN `muscleGroups` resolves to `[]`, `category` to `'other'`, timestamps to now
- AND type does not throw or crash

### Scenario: Exercise with multiple muscle groups
- GIVEN a strength exercise targeting chest and triceps
- WHEN creating with `muscleGroups: ['Chest', 'Triceps']`
- THEN both groups are stored and rendered in UI

### Scenario: Valid category assignment
- GIVEN any exercise
- WHEN `category` is set to one of the five valid values
- THEN the exercise is structurally valid

### Scenario: Empty template
- GIVEN a template with all 7 days unassigned
- WHEN queried
- THEN `days` is an array of 7 DayAssignments with all optional fields absent

### Scenario: Reps interval is valid
- GIVEN an Interval with `reps: 12`, `type: 'work'`
- WHEN validated
- THEN it is structurally valid

### Scenario: Per-interval mode override
- GIVEN an Interval with `mode: 'reps'` and parent Workout with `mode: 'timed'`
- WHEN used in play
- THEN interval overrides workout mode (mixed cycle)

### Scenario: Rep-mode session saves data
- GIVEN a completed rep interval (plannedReps=12, actualReps=10, weight=20.5)
- WHEN saved to session
- THEN all three fields persist in the Session object

### Scenario: Legacy workout defaults to timed
- GIVEN a Workout without `mode` field
- WHEN accessed
- THEN `mode` resolves to `'timed'` at runtime

### Scenario: Workout set to reps
- GIVEN a Workout with `mode: 'reps'`
- WHEN accessed
- THEN mode is `'reps'`

### Scenario: rest_between_cycles is valid
- GIVEN an Interval with `type: 'rest_between_cycles'`
- WHEN validated
- THEN it is structurally valid
