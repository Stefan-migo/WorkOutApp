# Exercise Library Specification

## Purpose

Manage a persistent library of exercises — list, create, edit, delete. Auto-seeds common exercises on first use.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| EL-1 | Define `Exercise` with `{ id, name, description?, muscleGroups?: string[], primaryMuscles: string[], secondaryMuscles: string[], equipment: string[], instructions: string[], force?: 'push' \| 'pull' \| 'static', mechanic?: 'compound' \| 'isolation', difficulty?: 'beginner' \| 'intermediate' \| 'advanced', images: string[], source: 'user' \| 'free-exercise-db', category: ExerciseCategory, createdAt, updatedAt }`. `muscleGroups` is deprecated — use `primaryMuscles` + `secondaryMuscles` instead. | MUST |
| EL-2 | Define `ExerciseCategory` as `'strength' \| 'cardio' \| 'stretching' \| 'mobility' \| 'plyometrics' \| 'strongman' \| 'powerlifting' \| 'other'` | MUST |
| EL-3 | Validate: `name` SHALL be non-empty, `category` SHALL be a valid `ExerciseCategory` | MUST |
| EL-4 | List all exercises, optionally filtered by `category` and/or text `search` (matches name, case-insensitive) | MUST |
| EL-5 | Create exercise — generate `id` via `crypto.randomUUID()`, set `createdAt`/`updatedAt` to now | MUST |
| EL-6 | Edit exercise — update fields, set `updatedAt` to now | MUST |
| EL-7 | Delete exercise — SHALL show confirmation warning with count of workouts referencing this exercise before deletion | MUST |
| EL-8 | Seed ~800 exercises from free-exercise-db on first load when `workoutapp.exercises` array is empty; fetch from GitHub raw URL, map fields, store in localStorage; set `source: 'free-exercise-db'` | MUST |
| EL-9 | Seed SHALL NOT overwrite existing exercises — only triggers on empty array | MUST |
| EL-10 | `/exercises` page is a RSC shell wrapping a client list component | MUST |
| EL-11 | Each exercise card SHALL render a compact layout with: image thumbnail (48x48, rounded, object-cover), name (truncated to one line), star/favorite toggle, difficulty badge, force badge, mechanic badge, and primary muscles chips (max 3 shown, "+N" overflow). Category badge SHALL appear in the top-right corner. | MUST |
| EL-12 | SHALL, when user clicks "Add to Workout" on an exercise card, navigate to `/workouts/new` with the selected exercise pre-populated as a single-interval workout; the pre-populated interval SHALL use the exercise name as its title and SHALL default to `work` type with 60s duration | MUST |
| EL-13 | System SHOULD store exercise images as IndexedDB blobs via `useIndexedDB` hook, with original URLs as fallback; per-exercise cap of 10MB | SHOULD |
| EL-14 | System MUST validate: `name` non-empty, `force` one of push/pull/static, `mechanic` one of compound/isolation, `difficulty` one of beginner/intermediate/advanced if provided; `primaryMuscles` SHOULD have >= 1 entry | MUST |
| EL-15 | The filter bar SHALL support collapsible sections or a sticky bar that remains visible when scrolling large result sets (800+ items). Each filter group (Category, Force, Mechanic, Difficulty, Favorites) SHALL be collapsible via a chevron toggle. Active filter count badge SHALL show on collapsed groups. | MUST |
| EL-16 | The library grid SHALL group exercises by category with collapsible section headers. Each header SHALL display the category name and exercise count (e.g., "Strength (342)"). Headers SHALL be sticky within the scroll container. | MUST |
| EL-17 | The exercise grid SHALL be responsive: 2 columns on mobile (<768px), 3 columns on tablet (768–1024px), 4 columns on desktop (>1024px). Gap SHALL scale proportionally (md:gap-4, lg:gap-6). | MUST |

## Scenarios

### Scenario: Load exercises on fresh install
- GIVEN empty localStorage (no `workoutapp.exercises` key)
- WHEN the exercise list loads
- THEN ~800 exercises appear, fetched from free-exercise-db and mapped to the Exercise format

### Scenario: Load exercises with existing data
- GIVEN `workoutapp.exercises` contains 3 user-created exercises
- WHEN the exercise list loads
- THEN only those 3 exercises appear (no seed data appended)

### Scenario: Create exercise with valid fields
- GIVEN an exercise create form
- WHEN user enters "Push Up", selects `strength`, adds "Chest" muscle group and saves
- THEN a new exercise appears in the list with a generated UUID and timestamps

### Scenario: Exercise saved with new fields
- GIVEN the builder in create mode
- WHEN user sets `primaryMuscles: ["Chest"]`, `force: "push"`, `mechanic: "compound"`, adds 3 instruction steps, uploads an image
- THEN the exercise is saved with all new fields and `source: "user"`

### Scenario: Create exercise with empty name
- GIVEN an exercise create form
- WHEN user submits with empty name
- THEN the form SHALL show a validation error and not persist

### Scenario: Delete exercise referenced by a workout
- GIVEN a workout containing interval with exerciseId = "ex-1"
- WHEN user deletes exercise "ex-1"
- THEN the confirmation SHALL state "1 workout references this exercise"
- AFTER deletion, the workout interval's exerciseId SHALL remain unchanged (orphan)

### Scenario: Compact card with thumbnail and metadata
- GIVEN an exercise with 2 images, name "Push Up", category "strength", difficulty "beginner", force "push", mechanic "compound", primaryMuscles ["Chest", "Triceps", "Shoulders"]
- WHEN the library renders
- THEN the card shows: a 48x48 image thumbnail, name truncated, filled/outline star, "beginner" badge, "push" badge, "compound" badge, "Chest", "Triceps", "+1" chips, and "strength" category badge top-right

### Scenario: Filter bar sticks on scroll
- GIVEN 800 exercises rendered
- WHEN user scrolls down the page
- THEN the filter bar remains sticky at the top of the exercise list

### Scenario: Categories grouped with counts
- GIVEN 342 strength and 158 cardio exercises
- WHEN the library renders
- THEN two sections appear: "Strength (342)" and "Cardio (158)" with their respective exercises grouped below

### Scenario: Grid adapts to viewport
- GIVEN a browser at 1400px width
- WHEN the library renders 12 exercises
- THEN they appear in a 4-column grid (3 rows)
- WHEN viewport resizes to 900px
- THEN they rearrange to 3-column grid (4 rows)
- WHEN viewport resizes to 600px
- THEN they rearrange to 2-column grid (6 rows)

### Scenario: Filter by category
- GIVEN 10 strength and 5 cardio exercises
- WHEN user selects `cardio` filter
- THEN only the 5 cardio exercises are shown

### Scenario: Search by name
- GIVEN exercises named "Push Up", "Pull Up", "Squat"
- WHEN user searches "push"
- THEN "Push Up" is shown; "Pull Up" and "Squat" are hidden

### Scenario: Invalid force rejected
- GIVEN the builder form
- WHEN user enters force value "invalid"
- THEN validation rejects and form shows error message

### Scenario: Image cached on first view
- GIVEN an exercise with a GitHub raw image URL
- WHEN user views the detail page
- THEN the image blob is stored in IndexedDB; subsequent loads serve from cache

### Scenario: Seed fetch failure returns empty array gracefully
- GIVEN empty localStorage and free-exercise-db GitHub raw URL is unreachable
- WHEN the exercise list loads
- THEN the system logs a warning, exercises remain empty, and the user can create exercises manually

### Scenario: Add exercise creates prepopulated workout
- GIVEN an exercise "Push Up" exists in the library
- WHEN user clicks "Add to Workout" on the Push Up card
- THEN the system navigates to `/workouts/new`
- AND the new workout contains one interval with title "Push Up", type `work`, duration 60s, and `exerciseId` referencing the clicked exercise

### Scenario: Multiple add-to-workout calls create separate workouts
- GIVEN two exercises "Push Up" and "Squat"
- WHEN user clicks "Add to Workout" on Push Up, then on Squat
- THEN two separate navigations to `/workouts/new` occur
- AND each new workout contains exactly one interval (the respective exercise)
