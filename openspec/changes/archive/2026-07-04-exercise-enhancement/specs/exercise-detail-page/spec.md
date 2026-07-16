# Exercise Detail Page Specification

## Purpose

Dedicated route `/exercises/[id]` displaying full exercise information with image gallery, metadata chips, action buttons, and graceful 404 handling.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| ED-1 | Route `/exercises/[id]` SHALL render full exercise view when `[id]` exists in the library | MUST |
| ED-2 | Page SHALL display image gallery (swipeable on mobile, grid on desktop) from the exercise's `images` array | MUST |
| ED-3 | Page SHALL display name, category badge, difficulty badge, force badge, and mechanic badge | MUST |
| ED-4 | Page SHALL display `instructions` as a numbered list | MUST |
| ED-5 | Page SHALL display `primaryMuscles`, `secondaryMuscles`, and `equipment` as chip tags | MUST |
| ED-6 | Page SHALL have an Edit button that opens the exercise builder pre-populated | MUST |
| ED-7 | Page SHALL have a Delete button with confirmation dialog showing workout reference count | MUST |
| ED-8 | Page SHALL have an "Add to Workout" button navigating to `/workouts/new` with this exercise as a single-interval workout | MUST |
| ED-9 | Page SHALL render a 404 state with "Exercise not found" message when `[id]` does not exist | MUST |

## Scenarios

### View existing exercise
- GIVEN an exercise with 2 images, 3 primary muscles, force "push", difficulty "beginner", and 5 instruction steps
- WHEN user navigates to `/exercises/ex-1`
- THEN all metadata chips render, instructions appear as numbered list, image gallery displays, and Edit/Delete/Add-to-Workout buttons are present

### Exercise not found
- GIVEN no exercise with id "ex-999"
- WHEN user navigates to `/exercises/ex-999`
- THEN "Exercise not found" message is shown with a link back to `/exercises`

### Delete with workout reference warning
- GIVEN an exercise referenced by 2 workouts
- WHEN user clicks Delete
- THEN confirmation dialog shows "2 workouts reference this exercise"; deletion only proceeds on confirm

### Add to Workout navigation
- GIVEN exercise "Push Up" with id "ex-1"
- WHEN user clicks "Add to Workout"
- THEN navigates to `/workouts/new` with one interval pre-populated: title "Push Up", type `work`, duration 60s, exerciseId "ex-1"
