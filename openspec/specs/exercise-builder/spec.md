# Exercise Builder Specification

## Purpose

Rich form for creating and editing exercises with tag-based chip inputs, step editor, media attachment, and live preview card.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| EB-1 | Builder SHALL render tag chips for `primaryMuscles`, `secondaryMuscles`, `equipment` with autocomplete sourced from existing values across all exercises | MUST |
| EB-2 | Builder SHALL provide a step-by-step instructions editor supporting add, remove, and reorder via drag | MUST |
| EB-3 | Builder SHALL provide selectors for `force` (push/pull/static), `mechanic` (compound/isolation), and `difficulty` (beginner/intermediate/advanced) | MUST |
| EB-4 | Builder SHALL accept image URL input AND an upload button storing blobs in IndexedDB via `useIndexedDB` hook | MUST |
| EB-5 | Builder SHALL render a live preview card showing exercise name, category, difficulty badge, primary muscles chips, and first image | MUST |
| EB-6 | Builder SHALL validate: `name` MUST be non-empty, `primaryMuscles` SHOULD have at least one entry, steps MAY be empty | MUST |
| EB-7 | Builder SHALL support create (empty form) and edit (pre-populated from existing exercise) modes | MUST |

## Scenarios

### Full exercise creation
- GIVEN builder in create mode
- WHEN user fills name, adds 2 primary muscles (autocomplete matches), sets force to "push", difficulty to "beginner", adds 3 instruction steps, uploads an image
- THEN preview card updates in real time AND save persists the full exercise

### Edit with step reorder
- GIVEN builder in edit mode for an exercise with 2 instruction steps
- WHEN user reorders steps via drag, adds a 3rd, and saves
- THEN exercise is updated with the new step order

### Validation blocks empty name
- GIVEN builder with empty name field
- WHEN user clicks save
- THEN validation error shown; exercise not persisted

### Tag autocomplete from library
- GIVEN 50 exercises with values "Chest", "Triceps", "Biceps" in primaryMuscles
- WHEN user types "tri" in the primary muscle chip input
- THEN "Triceps" appears as autocomplete suggestion
