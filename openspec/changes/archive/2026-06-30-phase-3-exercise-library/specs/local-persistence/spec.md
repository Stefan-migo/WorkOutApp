# Delta — Local Persistence

## ADDED Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| LP-13 | Persist `Exercise[]` under localStorage key `workoutapp.exercises` using same SSR-safe try/catch pattern from LP-1 | MUST |
| LP-14 | On first load (key missing or empty array `[]`), inject seed data of ~20 common exercises before returning | MUST |
| LP-15 | Seed data SHALL ONLY trigger on empty array — if exercises exist, skip seed | MUST |
| LP-16 | `useExercises` hook SHALL expose `{ exercises, createExercise, updateExercise, deleteExercise, isLoading }` | MUST |

## MODIFIED Requirements

### LP-7: Delete now supported for exercises

Delete SHALL be available for exercises from `/exercises` page. Delete is NOT supported for workouts (LP-7 unchanged for workouts).
(Previously: "Delete not implemented in MVP — no delete UI or logic" for all data)

#### Scenario: Delete exercise from library
- GIVEN 4 exercises in localStorage
- WHEN user deletes one exercise
- THEN localStorage contains 3 exercises
- AND the deleted exercise no longer appears in the list

## Scenarios

### Scenario: Seed on empty array
- GIVEN `workoutapp.exercises` is `[]`
- WHEN the exercise list loads
- THEN 20 exercises are written to localStorage and returned

### Scenario: No seed on existing data
- GIVEN `workoutapp.exercises` contains `[{ id: 'u1', name: 'Custom' }]`
- WHEN the exercise list loads
- THEN only the custom exercise appears

### Scenario: Corrupt exercises key
- GIVEN `workoutapp.exercises` contains invalid JSON
- WHEN the exercise list loads
- THEN seed data is injected (corrupt JSON triggers empty-array path)
