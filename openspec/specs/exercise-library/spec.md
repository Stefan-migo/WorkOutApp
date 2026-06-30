# Exercise Library Specification

## Purpose

Manage a persistent library of exercises — list, create, edit, delete. Auto-seeds common exercises on first use.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| EL-1 | Define `Exercise` with `{ id, name, description?, muscleGroups: string[], category: ExerciseCategory, createdAt, updatedAt }` | MUST |
| EL-2 | Define `ExerciseCategory` as `'strength' \| 'cardio' \| 'stretching' \| 'mobility' \| 'other'` | MUST |
| EL-3 | Validate: `name` SHALL be non-empty, `category` SHALL be a valid `ExerciseCategory` | MUST |
| EL-4 | List all exercises, optionally filtered by `category` and/or text `search` (matches name, case-insensitive) | MUST |
| EL-5 | Create exercise — generate `id` via `crypto.randomUUID()`, set `createdAt`/`updatedAt` to now | MUST |
| EL-6 | Edit exercise — update fields, set `updatedAt` to now | MUST |
| EL-7 | Delete exercise — SHALL show confirmation warning with count of workouts referencing this exercise before deletion | MUST |
| EL-8 | Seed ~20 common exercises on first load when `workoutapp.exercises` array is empty | MUST |
| EL-9 | Seed SHALL NOT overwrite existing exercises — only triggers on empty array | MUST |
| EL-10 | `/exercises` page is a RSC shell wrapping a client list component | MUST |
| EL-11 | Each exercise row SHALL display name, category badge, and muscle group tags | MUST |

## Scenarios

### Scenario: Load exercises on fresh install
- GIVEN empty localStorage (no `workoutapp.exercises` key)
- WHEN the exercise list loads
- THEN 20 seed exercises appear with varied categories and muscle groups

### Scenario: Load exercises with existing data
- GIVEN `workoutapp.exercises` contains 3 user-created exercises
- WHEN the exercise list loads
- THEN only those 3 exercises appear (no seed data appended)

### Scenario: Create exercise with valid fields
- GIVEN an exercise create form
- WHEN user enters "Push Up", selects `strength`, adds "Chest" muscle group and saves
- THEN a new exercise appears in the list with a generated UUID and timestamps

### Scenario: Create exercise with empty name
- GIVEN an exercise create form
- WHEN user submits with empty name
- THEN the form SHALL show a validation error and not persist

### Scenario: Delete exercise referenced by a workout
- GIVEN a workout containing interval with exerciseId = "ex-1"
- WHEN user deletes exercise "ex-1"
- THEN the confirmation SHALL state "1 workout references this exercise"
- AFTER deletion, the workout interval's exerciseId SHALL remain unchanged (orphan)

### Scenario: Filter by category
- GIVEN 10 strength and 5 cardio exercises
- WHEN user selects `cardio` filter
- THEN only the 5 cardio exercises are shown

### Scenario: Search by name
- GIVEN exercises named "Push Up", "Pull Up", "Squat"
- WHEN user searches "push"
- THEN "Push Up" is shown; "Pull Up" and "Squat" are hidden
