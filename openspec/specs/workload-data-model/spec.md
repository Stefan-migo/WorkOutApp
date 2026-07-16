# Workload Data Model

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| DM-1 | Define `Interval { id, type: IntervalType, title, duration, description?, imageUrl? }` — flat interval model, no nesting fields | MUST |
| DM-2 | Define `Workout { id, title, description?, imageUrl?, intervals: Interval[], createdAt, updatedAt }` | MUST |
| DM-3 | Define `Exercise { id, name, description?, muscleGroups: string[], category: ExerciseCategory, createdAt: string, updatedAt: string }` — `category` uses the `ExerciseCategory` enum, `muscleGroups` is an array (default `[]`), timestamps are ISO strings | MUST |
| DM-4 | Types are plain `.ts` interfaces — no classes, no framework dependency | MUST |
| DM-5 | Export all types from `src/types/workout.ts` | MUST |
| DM-11 | Define `Sequence { id, title, description?, workoutIds[], createdAt, updatedAt }` | MUST |
| DM-12 | Define `Session { id, sequenceId?, workoutId?, startedAt, completedAt?, intervals: CompletedInterval[] }` | MUST |
| DM-13 | Define `CompletedInterval { intervalId, title, type, plannedDuration, actualDuration, completed }` | MUST |
| DM-14 | Define `WeekPlan { id, title?, startDate (ISO Monday), days: DayAssignment[7], createdAt, updatedAt }` and `DayAssignment { workoutId?, sequenceId?, notes? }`. At least one of workoutId/sequenceId MAY be null | MUST |
| DM-15 | Define `ProgramTemplate { id, title, description?, days: DayAssignment[7], createdAt, updatedAt }` — reusable snapshot of a week's assignments | MUST |
| DM-16 | Define `ExerciseCategory = 'strength' \| 'cardio' \| 'stretching' \| 'mobility' \| 'other'` | MUST |
| DM-17 | Define `IntervalType = 'prepare' \| 'work' \| 'rest' \| 'rest_between_cycles' \| 'cooldown'` | MUST |
| DM-18 | Define `CycleTemplate { id, title, description?, repeat, workDuration, restDuration, skipLastRest }` — Transient creation-time helper, NOT persisted to localStorage | MUST |

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

### Scenario: rest_between_cycles is valid
- GIVEN an Interval with `type: 'rest_between_cycles'`
- WHEN validated
- THEN it is structurally valid
