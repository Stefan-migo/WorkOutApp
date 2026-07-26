# Local Persistence

## Description

localStorage is demoted from primary data store to a one-time migration source and a stale offline fallback. Supabase is now the primary data store for all 7 entities (workouts, exercises, sessions, sequences, week_plans, program_templates, favorites). All data hooks read from and write to Supabase via the browser client. localStorage keys are read once during `migrate-local.ts` and serve as a stale cache for read operations when Supabase is unreachable.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| LP-1 | Workout data SHALL be persisted to Supabase table `workouts` with the authenticated user's `user_id` | MUST |
| LP-2 | Workout data from localStorage key `workoutapp.workouts` SHALL serve as a stale offline fallback when Supabase is unreachable (read-only) | SHOULD |
| LP-3 | List saved workouts in editor — show name, interval count, last modified (loaded from Supabase) | MUST |
| LP-4 | Handle missing key or corrupt JSON from localStorage fallback — return empty array without throwing | MUST |
| LP-5 | Persist on every save action via Supabase (not auto-save on edit — save button only) | MUST |
| LP-6 | Generate unique IDs via `crypto.randomUUID()` or `gen_random_uuid()` (Supabase default) | MUST |
| LP-7 | Delete SHALL be available for exercises from `/exercises` page. Delete is NOT supported for workouts (LP-7 unchanged for workouts) | MUST |
| LP-8 | `useLocalStorage` SHALL use a lazy `useState` callback initializer reading from `localStorage`. On quota errors, `console.warn('Storage quota exceeded for key:', key)` MUST fire. | MUST |
| LP-9 | Sequence data SHALL be persisted to Supabase table `sequences`. localStorage key `workoutapp.sequences` serves as stale offline fallback | MUST |
| LP-10 | Session data SHALL be persisted to Supabase table `sessions` (append-only). localStorage key `workoutapp.sessions` serves as stale offline fallback | MUST |
| LP-11 | Week plan data SHALL be persisted to Supabase table `week_plans`. `getWeekPlan(date)` SHALL return existing or auto-create new plan in Supabase. localStorage key `workoutapp.weekPlans` serves as stale offline fallback | MUST |
| LP-12 | Program template data SHALL be persisted to Supabase table `program_templates`. localStorage key `workoutapp.programTemplates` serves as stale offline fallback | MUST |
| LP-13 | Exercise data SHALL be persisted to Supabase table `exercises`. localStorage key `workoutapp.exercises` serves as stale offline fallback | MUST |
| LP-14 | REMOVED — Seed data injection on first load | *(see Reason/Migration in archive)* |
| LP-15 | REMOVED — Seed-only-on-empty-array guard | *(see Reason/Migration in archive)* |
| LP-16 | `useExercises` hook SHALL expose `{ data, isLoading, error, createExercise, updateExercise, deleteExercise }` with `data` as the exercises array | MUST |

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

### Scenario: Lazy init reads stored value
- GIVEN `localStorage` has `workoutapp.workouts` = `[{"id":"w1"}]`
- WHEN `useLocalStorage('workoutapp.workouts', [])` initializes
- THEN state is `[{"id":"w1"}]` without rendering the default first

### Scenario: Quota error is logged
- GIVEN `localStorage` is full
- WHEN `useLocalStorage` tries to write
- THEN `console.warn('Storage quota exceeded for key:', key)` fires

### Scenario: Hooks read from Supabase, not localStorage
- GIVEN user is authenticated with data in Supabase
- WHEN a `use*` hook mounts
- THEN it queries Supabase via the browser client
- AND returns the user's data in `{ data, isLoading, error }` format

### Scenario: localStorage used during migration only
- GIVEN user has existing localStorage data from before the change
- WHEN the migration script runs on first login (see data-migration spec)
- THEN each localStorage key is read with SSR-safe try/catch
- AND upserted to the corresponding Supabase table

### Scenario: Offline fallback from stale localStorage
- GIVEN Supabase is unreachable (network error)
- WHEN a hook query fails
- THEN the hook MAY fall back to reading stale localStorage data
- AND SHOULD indicate "offline" or "cached" state to the user

### Scenario: localStorage is no longer written to by hooks
- GIVEN user saves a new workout via `createWorkout`
- WHEN the save completes
- THEN the data exists in Supabase only
- AND localStorage is NOT updated (except during migration)

## Removed Requirements

### LP-14 — Seed data injection on first load
(Reason: Seed data moves to an idempotent SQL migration that inserts public rows with `user_id = NULL`. The `useExercises` hook no longer manages seed injection.)
(Migration: `supabase/seed.sql` inserts ~20 common exercises; RLS policy allows all authenticated users to read `user_id IS NULL` rows.)

### LP-15 — Seed-only-on-empty-array guard
(Reason: Same as LP-14 — the seed-on-empty logic is replaced by the SQL migration seed. The hook no longer checks whether the store is empty.)
(Migration: No code migration needed; the SQL seed runs once as part of schema setup.)
