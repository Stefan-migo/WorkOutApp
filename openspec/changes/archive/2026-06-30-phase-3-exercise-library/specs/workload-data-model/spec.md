# Delta — Workload Data Model

## MODIFIED Requirements

### DM-3: Define Exercise with metadata

Define `Exercise { id, name, description?, muscleGroups: string[], category: ExerciseCategory, createdAt, updatedAt }`. `muscleGroups` replaces the singular `muscleGroup: string`, `category` is new, timestamps are new.
(Previously: `Exercise { id, name, description }` with singular `muscleGroup`)

| ID | Description | Keyword |
|----|-------------|---------|
| DM-3 | Define `Exercise { id, name, description?, muscleGroups: string[], category: ExerciseCategory, createdAt: string, updatedAt: string }` — `category` uses the `ExerciseCategory` enum, `muscleGroups` is an array (default `[]`), timestamps are ISO strings | MUST |

#### Scenario: Exercise with all optional fields
- GIVEN an Exercise object from localStorage before this change
- WHEN `muscleGroups`, `category`, `createdAt`, `updatedAt` are absent
- THEN `muscleGroups` resolves to `[]`, `category` to `'other'`, timestamps to now
- AND type does not throw or crash

#### Scenario: Exercise with multiple muscle groups
- GIVEN a strength exercise targeting chest and triceps
- WHEN creating with `muscleGroups: ['Chest', 'Triceps']`
- THEN both groups are stored and rendered in UI

### DM-2: Define ExerciseCategory enum

| ID | Description | Keyword |
|----|-------------|---------|
| DM-16 | Define `ExerciseCategory = 'strength' \| 'cardio' \| 'stretching' \| 'mobility' \| 'other'` | MUST |

#### Scenario: Valid category assignment
- GIVEN any exercise
- WHEN `category` is set to one of the five valid values
- THEN the exercise is structurally valid

## ADDED Requirements

No additional top-level requirements. See DM-3 modified above.
