# Workload Data Model

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| DM-1 | Define `Interval { id, type, title, duration, description?, exerciseId?, order, children?, cycleCount?, setCount?, restBetweenCycles? }` — now supports nesting via optional fields with safe defaults | MUST |
| DM-2 | Define `Workout { id, name, intervals: Interval[], createdAt, updatedAt }` | MUST |
| DM-3 | Define `Exercise { id, name, description?, muscleGroups: string[], category: ExerciseCategory, createdAt: string, updatedAt: string }` — `category` uses the `ExerciseCategory` enum, `muscleGroups` is an array (default `[]`), timestamps are ISO strings | MUST |
| DM-4 | Types are plain `.ts` interfaces — no classes, no framework dependency | MUST |
| DM-5 | Export all types from `src/lib/types.ts` | MUST |
| DM-6 | `Interval` gains optional `children?: Interval[]` for nested/cycle structures | MUST |
| DM-7 | `Interval` gains optional `cycleCount?: number` defaulting to 1 — repetitions of a cycle group | MUST |
| DM-8 | `Interval` gains optional `setCount?: number` defaulting to 1 — sets within each cycle | MUST |
| DM-9 | `Interval` gains optional `restBetweenCycles?: number` defaulting to 0 — rest inserted between cycles | MUST |
| DM-10 | A parent interval (`children` present and non-empty) is a cycle container — its own `duration` is SHALL be ignored; children define effective duration | MUST |
| DM-11 | Define `Sequence { id, title, description?, workoutIds[], createdAt, updatedAt }` | MUST |
| DM-12 | Define `Session { id, sequenceId?, workoutId?, startedAt, completedAt?, intervals: CompletedInterval[] }` | MUST |
| DM-13 | Define `CompletedInterval { intervalId, title, type, plannedDuration, actualDuration, completed }` | MUST |
| DM-14 | Define `WeekPlan { id, title?, startDate (ISO Monday), days: DayAssignment[7], createdAt, updatedAt }` and `DayAssignment { workoutId?, sequenceId?, notes? }`. At least one of workoutId/sequenceId MAY be null | MUST |
| DM-15 | Define `ProgramTemplate { id, title, description?, days: DayAssignment[7], createdAt, updatedAt }` — reusable snapshot of a week's assignments | MUST |
| DM-16 | Define `ExerciseCategory = 'strength' \| 'cardio' \| 'stretching' \| 'mobility' \| 'other'` | MUST |

## Scenarios

### Scenario: Create interval for each type
- GIVEN valid parameters for each interval type
- WHEN creating `Interval` objects with `type: 'prepare'`, `'work'`, `'rest'`, and `'cooldown'`
- THEN all four objects are structurally valid

### Scenario: Exercise assignment on Work intervals
- GIVEN an Interval with `type: 'work'`
- WHEN `exerciseId` is set to a known exercise ID
- THEN the interval references a valid exercise

### Scenario: Workout with interval list
- GIVEN a Workout object with 4 intervals
- WHEN created with `intervals` array
- THEN intervals maintain their `order` field sequence

### Scenario: Interval with children forms a cycle
- GIVEN an Interval with 2 children and `cycleCount=3`, `setCount=1`
- WHEN imported by any consumer
- THEN the interval is structurally valid and its children form a 3-cycle

### Scenario: Optional fields absent on legacy data
- GIVEN an Interval loaded from localStorage (before this change)
- WHEN `children`, `cycleCount`, `setCount` are absent
- THEN they resolve to `undefined`, `1`, `1`, `0` respectively — no crash

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
