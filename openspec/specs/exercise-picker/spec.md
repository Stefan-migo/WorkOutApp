# Exercise Picker Specification

## Purpose

Searchable select component for choosing an exercise from the library, used by `IntervalForm` and `IntervalDetailSheet`. Supports quick-create inline.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| EP-1 | Picker SHALL render as a searchable select drawing from `workoutapp.exercises` | MUST |
| EP-2 | Picker SHALL render each option as a rich card showing: image thumbnail (40x40, rounded), exercise name (bold), category badge, primary muscles chips (max 2 shown, "+N" overflow), difficulty badge, and force/mechanic badges. Grouped by category with section headers. Favorite star SHALL appear on each option. | MUST |
| EP-3 | Picker SHALL support filtering by `ExerciseCategory` (dropdown or button group), force (push/pull/static), mechanic (compound/isolation), and difficulty (beginner/intermediate/advanced). Multiple filters SHALL stack (AND logic). | MUST |
| EP-4 | Picker SHALL support free text search across exercise names (case-insensitive substring match) | MUST |
| EP-5 | Picker SHALL include a "+" button that opens a quick-create inline form (name + category + optional muscle group) | MUST |
| EP-6 | Quick-create SHALL save exercise to library and select it in the picker immediately | MUST |
| EP-7 | Picker SHALL be a shared `ExercisePicker` component used by both `IntervalForm` and `IntervalDetailSheet` | MUST |
| EP-8 | Picker SHALL show empty state when library has no exercises, with prompt to create one | MUST |
| EP-9 | Non-Work intervals SHALL NOT show the picker (inherited from WE-6) | MUST |
| EP-10 | When an exercise is selected in the picker, a mini preview card SHALL appear below the search input showing: image thumbnail, name, category badge, primary muscles chips, difficulty/force/mechanic badges, equipment tags (max 3), and instructions preview (first 2 lines). A "View Full Details" link SHALL navigate to `/exercises/[id]`. | MUST |
| EP-11 | Picker SHALL show a favorite star toggle on each option card and on the mini preview card. Toggling SHALL call `toggleFavorite()` from `useFavorites()` and update the star state immediately. | MUST |
| EP-12 | Picker SHALL include a "View Full Details" link on each option (right side) and on the mini preview card. Clicking SHALL navigate to `/exercises/[id]` in the current tab. | MUST |

## Scenarios

### Scenario: Select exercise from library
- GIVEN a Work interval in IntervalForm and 5 exercises in library
- WHEN user opens the picker and types "push"
- THEN options narrow to matching exercises; selecting one sets `exerciseId`

### Scenario: Filter by category
- GIVEN exercises in "strength" and "cardio" categories
- WHEN user selects `cardio` filter
- THEN only cardio exercises appear in the dropdown

### Scenario: Picker shows rich cards
- GIVEN exercises with images, categories, and metadata
- WHEN user opens the picker
- THEN each option renders as a card with thumbnail, name, category, muscles chips, and badges

### Scenario: Stack category + difficulty filter
- GIVEN exercises of mixed categories and difficulties
- WHEN user selects "strength" category AND "beginner" difficulty
- THEN only strength/beginner exercises appear

### Scenario: Selected exercise shows preview
- GIVEN "Push Up" is selected in the picker
- WHEN the picker closes
- THEN a mini preview card renders with thumbnail, metadata, and "View Full Details" link

### Scenario: Star toggle from picker
- GIVEN an unfavorited exercise in the picker options
- WHEN user clicks its star icon
- THEN star fills immediately AND the exercise appears in library favorites filter

### Scenario: Navigate to detail from picker
- GIVEN the picker is open
- WHEN user clicks "View Full Details" on an option
- THEN browser navigates to `/exercises/[id]`

### Scenario: Quick-create from picker
- GIVEN the picker is open with no matching results
- WHEN user clicks "+" and enters "Jumping Jacks" as `cardio`
- THEN the exercise is created, selected, and the picker closes with `exerciseId` set

### Scenario: Empty library
- GIVEN no exercises in the library
- WHEN user opens the picker on a Work interval
- THEN empty state is shown with "No exercises yet — create one" link to quick-create
