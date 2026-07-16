# Exercise Detail View Specification

## Purpose

Dedicated route `/exercises/[id]` displaying full exercise information with image gallery, metadata chips, action buttons, and graceful 404 handling.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| ED-1 | Route `/exercises/[id]` SHALL render full exercise view when `[id]` exists in the library | MUST |
| ED-2 | Page SHALL display image gallery (CSS scroll-snap on mobile, max-width container on desktop) from the exercise's `images` array | MUST |
| ED-3 | Page SHALL display name (h1), category badge, difficulty badge, force badge, and mechanic badge | MUST |
| ED-4 | Page SHALL display `instructions` as a numbered `<ol>` list | MUST |
| ED-5 | Page SHALL display `primaryMuscles`, `secondaryMuscles`, and `equipment` as tag chips | MUST |
| ED-6 | Page SHALL have an Edit button that opens the exercise builder pre-populated | MUST |
| ED-7 | Page SHALL have a Delete button with confirmation dialog showing exercise name and workout reference count | MUST |
| ED-8 | Page SHALL have an "Add to Workout" button navigating to `/workouts/new?exerciseId={id}` | MUST |
| ED-9 | Page SHALL render a 404 state with "Exercise not found" message and a link back to `/exercises` when `[id]` does not exist | MUST |
| ED-10 | Page SHALL show SVG placeholder when exercise has no images | SHOULD |
| ED-11 | Page SHALL show source badge ("free-exercise-db" or "User created") | SHOULD |

## Scenarios

### View existing exercise (with all fields)
- GIVEN an exercise with 2 images, 3 primary muscles, force "push", difficulty "beginner", and 5 instruction steps
- WHEN user navigates to `/exercises/ex-1`
- THEN all metadata chips render, instructions appear as numbered list, image gallery displays, and Edit/Delete/Add-to-Workout buttons are present

### View exercise with no images
- GIVEN an exercise with no `images` array
- WHEN user navigates to `/exercises/ex-2`
- THEN SVG placeholder is shown instead of image gallery

### Exercise not found
- GIVEN no exercise with id "ex-999"
- WHEN user navigates to `/exercises/ex-999`
- THEN "Exercise not found" message is shown with a link back to `/exercises`

### Delete with name confirmation
- GIVEN an exercise "Push Up"
- WHEN user clicks Delete
- THEN confirmation dialog shows "Delete Push Up?" and a workout reference count

### Add to Workout navigation
- GIVEN exercise "Push Up" with id "ex-1"
- WHEN user clicks "Add to Workout"
- THEN navigates to `/workouts/new?exerciseId=ex-1`
