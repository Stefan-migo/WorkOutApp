# Local Persistence

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| LP-1 | Save workout to `localStorage` under key `workoutapp.workouts` | MUST |
| LP-2 | Load all workouts from `localStorage` on app start (SSR-safe guard) | MUST |
| LP-3 | List saved workouts in editor — show name, interval count, last modified | MUST |
| LP-4 | Handle missing key or corrupt JSON — return empty array without throwing | MUST |
| LP-5 | Persist on every save action (not auto-save on edit — save button only) | MUST |
| LP-6 | Generate unique IDs via `crypto.randomUUID()` or Date-based fallback | MUST |
| LP-7 | Delete SHALL be available for exercises from `/exercises` page. Delete is NOT supported for workouts (LP-7 unchanged for workouts) | MUST |
| LP-8 | `localStorage` calls wrapped in try/catch for SSR and quota errors | SHOULD |
| LP-9 | Persist sequences under key `workoutapp.sequences` using the same try/catch SSR-safe pattern from LP-1 | MUST |
| LP-10 | Persist sessions under key `workoutapp.sessions` using the same append-only pattern | MUST |
| LP-11 | Persist `WeekPlan[]` under localStorage key `workoutapp.weekPlans` using same SSR-safe try/catch pattern from LP-1. `getWeekPlan(date)` SHALL return existing or auto-create new plan | MUST |
| LP-12 | Persist `ProgramTemplate[]` under localStorage key `workoutapp.programTemplates` using same pattern from LP-1. Save, delete, list supported. Loading returns empty array on corrupt data | MUST |
| LP-13 | Persist `Exercise[]` under localStorage key `workoutapp.exercises` using same SSR-safe try/catch pattern from LP-1 | MUST |
| LP-14 | On first load (key missing or empty array `[]`), inject seed data of ~20 common exercises before returning | MUST |
| LP-15 | Seed data SHALL ONLY trigger on empty array — if exercises exist, skip seed | MUST |
| LP-16 | `useExercises` hook SHALL expose `{ exercises, createExercise, updateExercise, deleteExercise, isLoading }` | MUST |

## Scenarios

### Scenario: Save and reload workout
- GIVEN a completed workout in editor
- WHEN user saves, then refreshes the page
- THEN workout appears in saved workouts list

### Scenario: Corrupt localStorage data
- GIVEN `localStorage.workoutapp.workouts` contains invalid JSON
- WHEN app loads
- THEN saved workouts list is empty, no error thrown

### Scenario: Empty workouts list
- GIVEN no saved workouts
- WHEN app loads
- THEN editor shows empty state with no saved workouts

### Scenario: Multiple saves
- GIVEN 3 workouts saved
- WHEN user saves a 4th
- THEN localStorage contains 4 workout entries

### Scenario: Load sequences on app start
- GIVEN 2 saved sequences in localStorage
- WHEN the sequence list page loads
- THEN both sequences appear with workout count and total duration

### Scenario: Corrupted sequences key
- GIVEN `workoutapp.sequences` contains invalid JSON
- WHEN the sequence list loads
- THEN list is empty, no error thrown

### Scenario: Save and reload week plan
- GIVEN a week with 3 assigned days
- WHEN user navigates away and back to `/calendar`
- THEN the same assignments render on the correct week

### Scenario: Corrupt weekPlans key
- GIVEN `workoutapp.weekPlans` contains invalid JSON
- WHEN the calendar loads
- THEN a new empty WeekPlan is created for the current week (no crash)

### Scenario: getWeekPlan creates on miss
- GIVEN no WeekPlan exists for the week of 2026-07-06
- WHEN the page loads for that week
- THEN a new plan with 7 empty days is persisted under `workoutapp.weekPlans`

### Scenario: Save and list templates
- GIVEN 2 saved templates
- WHEN the calendar sidebar lists templates
- THEN both appear with their title and day count

### Scenario: Delete template
- GIVEN a saved template
- WHEN deleted
- THEN it no longer appears in the sidebar list

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

### Scenario: Corrupt programTemplates key
- GIVEN `workoutapp.programTemplates` contains invalid JSON
- WHEN the calendar sidebar loads
- THEN the list is empty, no error thrown
