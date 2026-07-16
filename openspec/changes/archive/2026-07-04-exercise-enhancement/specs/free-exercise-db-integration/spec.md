# Free Exercise DB Integration Specification

## Purpose

Ingest the free-exercise-db dataset (800+ exercises), map fields to the Exercise model, seed on first load without overwriting user-created data, and manage IndexedDB image storage.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| FI-1 | System SHALL fetch `exercises.json` from free-exercise-db GitHub repository at build/init time | MUST |
| FI-2 | System SHALL map source fields: `primaryMuscles` → `primaryMuscles`, `secondaryMuscles` → `secondaryMuscles`, `level` → `difficulty` (mapping `expert` to `advanced`), `instructions` as array, `equipment` string → string[], `images` as URL strings | MUST |
| FI-3 | System SHALL store images as IndexedDB blobs via `useIndexedDB` hook, with original URLs as fallback | MUST |
| FI-4 | Seed SHALL trigger only once on first load when `workoutapp.exercises` key is empty or absent | MUST |
| FI-5 | Seed SHALL NEVER overwrite existing user-created exercises | MUST |
| FI-6 | System SHOULD cap IndexedDB image storage at 10MB per exercise | SHOULD |
| FI-7 | Free-exercise-db exercises SHALL carry a `source: 'free-exercise-db'` field to distinguish from user-created ones | MUST |

## Scenarios

### First load seeds 800+ exercises
- GIVEN empty localStorage (no `workoutapp.exercises` key)
- WHEN exercise library initializes
- THEN 800+ exercises appear with all mapped fields (primaryMuscles, secondaryMuscles, instructions, difficulty, force, mechanic, images)

### Existing data preserved on reload
- GIVEN 3 user-created exercises in localStorage
- WHEN exercise library initializes
- THEN only those 3 exercises appear; no seed data appended

### Field mapping preserves metadata
- GIVEN a source entry with `primaryMuscles: ["Chest"]`, `level: "expert"`, `instructions: ["Lie flat", "Press up"]`, `equipment: "barbell"`
- WHEN mapped to Exercise model
- THEN `primaryMuscles: ["Chest"]`, `difficulty: "advanced"`, `instructions: ["Lie flat", "Press up"]`, `equipment: ["barbell"]`

### Image stored and cached in IndexedDB
- GIVEN an exercise with a GitHub raw image URL
- WHEN the detail page loads
- THEN the image is fetched, stored as a blob in IndexedDB, and served from cache on subsequent loads
