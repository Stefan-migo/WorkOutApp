# Exercise Picker Specification

## Purpose

Searchable select component for choosing an exercise from the library, used by `IntervalForm` and `IntervalDetailSheet`. Supports quick-create inline.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| EP-1 | Picker SHALL render as a searchable select drawing from `workoutapp.exercises` | MUST |
| EP-2 | Picker SHALL show each exercise's name, category badge, and muscle group tags in the option list | MUST |
| EP-3 | Picker SHALL support filtering by `ExerciseCategory` via a dropdown or button group | MUST |
| EP-4 | Picker SHALL support free text search across exercise names (case-insensitive substring match) | MUST |
| EP-5 | Picker SHALL include a "+" button that opens a quick-create inline form (name + category + optional muscle group) | MUST |
| EP-6 | Quick-create SHALL save exercise to library and select it in the picker immediately | MUST |
| EP-7 | Picker SHALL be a shared `ExercisePicker` component used by both `IntervalForm` and `IntervalDetailSheet` | MUST |
| EP-8 | Picker SHALL show empty state when library has no exercises, with prompt to create one | MUST |
| EP-9 | Non-Work intervals SHALL NOT show the picker (inherited from WE-6) | MUST |

## Scenarios

### Scenario: Select exercise from library
- GIVEN a Work interval in IntervalForm and 5 exercises in library
- WHEN user opens the picker and types "push"
- THEN options narrow to matching exercises; selecting one sets `exerciseId`

### Scenario: Filter by category
- GIVEN exercises in "strength" and "cardio" categories
- WHEN user selects `cardio` filter
- THEN only cardio exercises appear in the dropdown

### Scenario: Quick-create from picker
- GIVEN the picker is open with no matching results
- WHEN user clicks "+" and enters "Jumping Jacks" as `cardio`
- THEN the exercise is created, selected, and the picker closes with `exerciseId` set

### Scenario: Empty library
- GIVEN no exercises in the library
- WHEN user opens the picker on a Work interval
- THEN empty state is shown with "No exercises yet — create one" link to quick-create
