# Spec: Phase 3 — Sequences & Exercises UI

## Requirements

### Sequences List (`/sequences`)

| ID | Description | Keyword |
|----|-------------|---------|
| SL-1 | Page SHALL use Deep Nordic design tokens for all colors, typography, and spacing | MUST |
| SL-2 | Empty state SHALL show "Sequences" heading + "No sequences yet. Chain your workouts!" message + accent button to `/sequences/new` | MUST |
| SL-3 | Sequence cards SHALL show title, description (if any), workout count, total duration, repeat count, and missing-workout warning | MUST |
| SL-4 | Each card SHALL have Play button + Delete button with confirm dialog | MUST |
| SL-5 | Cards SHALL use `glass-card` styling with `material-symbols-outlined` icons | SHOULD |

### Sequence Builder (`/sequences/new`)

| ID | Description | Keyword |
|----|-------------|---------|
| SB-1 | Page SHALL have a glass-panel header section with title input and live total duration display | MUST |
| SB-2 | Title input SHALL be a large inline-editable field (no background, bottom-border on focus) | MUST |
| SB-3 | Description textarea SHALL be present | MUST |
| SB-4 | Repeat count input (1-99) SHALL show computed total rounds | MUST |
| SB-5 | Workout list SHALL display selected workouts with reorder (▲▼ buttons), remove (✕), and index numbering | MUST |
| SB-6 | Each workout row SHALL show name, duration, category badge/accent | MUST |
| SB-7 | A dashed "Browse & Add Workouts" area SHALL open the workout picker | MUST |
| SB-8 | Workout picker SHALL have search-by-name filter on saved workouts | MUST |
| SB-9 | Right sidebar SHALL display Sequence Profile: bar chart placeholder, work/rest ratio, estimated strain bar | MUST |
| SB-10 | Sticky bottom bar SHALL contain Discard button (navigates back) and Save Sequence button | MUST |
| SB-11 | Save SHALL validate: non-empty title, at least 1 workout, no duplicates | MUST |
| SB-12 | Save SHALL persist to localStorage and navigate to `/sequences/[id]/play` | MUST |
| SB-13 | Page SHALL use Deep Nordic design tokens throughout | MUST |

### Exercise Library (`/exercises`)

| ID | Description | Keyword |
|----|-------------|---------|
| EL-1 | Page SHALL have search input with Material Icons magnifying glass | MUST |
| EL-2 | Search SHALL filter by name, case-insensitive, in real-time | MUST |
| EL-3 | Category filter SHALL be a row of pill-shaped buttons: "All" (accent/highlighted) + one per `ExerciseCategory` | MUST |
| EL-4 | Active filter SHALL highlight in secondary/accent style; inactive filters in surface-container style | MUST |
| EL-5 | Exercises SHALL be grouped by category in sections with category heading + count | MUST |
| EL-6 | Each category section SHALL display exercises in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop) | MUST |
| EL-7 | Exercise cards SHALL show: image placeholder (4:3), name, difficulty badge, muscle group tags, equipment tags | MUST |
| EL-8 | Exercise card footer SHALL have "Add to Workout" outlined button | SHOULD |
| EL-9 | Create/Edit SHALL use a dialog with fields: name, category select, description, muscle groups (comma input), equipment (comma input), difficulty select | MUST |
| EL-10 | Delete SHALL show confirmation dialog with count of referencing workouts | MUST |
| EL-11 | All colors SHALL use Deep Nordic design tokens (no hardcoded zinc/blue) | MUST |

### Type Extensions

| ID | Description | Keyword |
|----|-------------|---------|
| TY-1 | `Exercise` SHALL gain optional `equipment?: string[]` | MUST |
| TY-2 | `Exercise` SHALL gain optional `difficulty?: 'beginner' \| 'intermediate' \| 'advanced'` | MUST |

## Non-Requirements

- No drag-and-drop library dependency (▲▼ buttons suffice for this iteration)
- No image upload for exercise cards (placeholder visuals only)
- No server-side data fetching (local-first remains)
- No pagination (flat list at current scale)

## Scenarios

### Scenario: Create sequence with 3 workouts, repeat=2
- GIVEN 5 saved workouts
- WHEN user types title, adds 3 workouts via picker, sets repeatCount=2, clicks Save Sequence
- THEN sequence persists with 3 workoutIds, repeatCount=2, navigates to play page

### Scenario: Empty sequence rejected
- GIVEN no workouts selected
- WHEN user attempts to save
- THEN Save button is disabled

### Scenario: Search exercises by name
- GIVEN 10 exercises with varied names
- WHEN user types "push" in search
- THEN only exercises matching "push" (case-insensitive) are shown

### Scenario: Filter by category
- GIVEN 5 strength and 3 cardio exercises
- WHEN user clicks "cardio" filter chip
- THEN only cardio exercises shown; filter chip is highlighted

### Scenario: Create exercise with equipment
- GIVEN empty create dialog
- WHEN user fills name, selects `strength`, adds "Dumbbell, Bench" equipment, adds "Chest" muscle groups, difficulty "intermediate", saves
- THEN exercise persists with equipment=["Dumbbell", "Bench"], difficulty="intermediate"

### Scenario: Delete exercise with refs
- GIVEN exercise used in 2 workouts
- WHEN user confirms delete
- THEN confirmation shows "2 workouts reference this exercise", delete proceeds
