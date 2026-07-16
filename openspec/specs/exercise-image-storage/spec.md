# Exercise Image Storage Specification (Delta)

## Purpose

User-uploaded image storage for exercises using IndexedDB, plus extended filter options (force/mechanic/difficulty/category) on the exercise list.

## Requirements

### Image Storage

| ID | Description | Keyword |
|----|-------------|---------|
| IS-1 | User SHALL be able to upload images (File) per exercise via the exercise detail page | MUST |
| IS-2 | Images SHALL be stored in IndexedDB database `workoutapp-images` with object store `images` | MUST |
| IS-3 | Each image record SHALL store `{ exerciseId: string, blobData: ArrayBuffer, blobType: string, createdAt: number }` (blobs stored as ArrayBuffer — fake-indexeddb/structured clone compatibility) | MUST |
| IS-4 | Each exercise SHALL have a 10MB total storage cap across all its images | MUST |
| IS-5 | `saveImage(exerciseId, file)` SHALL return a unique blob ID string | MUST |
| IS-6 | `getImages(exerciseId)` SHALL return `{ blobUrl: string, blobId: string }[]` — blob URLs for rendering, blob IDs for deletion | MUST |
| IS-7 | `deleteImage(exerciseId, blobId)` SHALL remove the blob from the store and revoke its URL | MUST |
| IS-8 | `getUsage()` SHALL return total bytes used across all exercises | SHOULD |
| IS-9 | Blob URLs SHALL be revoked on component unmount to prevent memory leaks | MUST |
| IS-10 | Detail page SHALL render a combined gallery: external URLs (`images[]` field) + IDB blob URLs | MUST |
| IS-11 | Detail page SHALL have an upload button (file input) that calls `saveExerciseImage` | SHOULD |

### Filter Upgrades

| ID | Description | Keyword |
|----|-------------|---------|
| IS-12 | Exercise search header SHALL render **Force** filter chips: All / Push / Pull / Static (lowercase values: `push`, `pull`, `static`) | MUST |
| IS-13 | Exercise search header SHALL render **Mechanic** filter chips: All / Compound / Isolation (`compound`, `isolation`) | MUST |
| IS-14 | Exercise search header SHALL render **Level** filter chips: All / Beginner / Intermediate / Advanced (`beginner`, `intermediate`, `advanced`) | MUST |
| IS-15 | Exercise search header SHALL render **Category** filter chips: All / Strength / Cardio / Stretching / Plyometrics / Strongman / Powerlifting / Mobility / Other | MUST |
| IS-16 | Secondary filter row SHALL only render when all four `onForceFilter`, `onMechanicFilter`, `onDifficultyFilter`, `onCategoryFilter` props are provided (optional props for backward compat) | MUST |
| IS-17 | Clicking an active chip SHALL deactivate it (set filter to null) | MUST |
| IS-18 | Clicking "All" SHALL clear the filter for that group | MUST |
| IS-19 | Exercise list `useMemo` SHALL filter by all dimensions: search, muscle, equipment, force, mechanic, difficulty, category | MUST |

### Test Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| IS-20 | IndexedDB hook tests SHALL use `fake-indexeddb` polyfill | MUST |
| IS-21 | IndexedDB hook tests SHALL verify save/retrieve round-trip, 10MB cap enforcement, delete, usage tracking, multi-exercise isolation, unmount cleanup, and empty exercise | MUST |
| IS-22 | ExerciseSearchHeader tests SHALL verify all 4 filter groups render with correct options, click toggles, All clears, and conditional rendering | MUST |

## Scenarios

### Upload image and view in gallery
- GIVEN user is on exercise detail page
- WHEN user selects a .jpg file via the upload button
- THEN the image is saved to IndexedDB
- AND a blob URL appears in the gallery alongside any external URLs

### 10MB cap enforcement
- GIVEN an exercise with 9.5MB of stored images
- WHEN user tries to upload a 1MB file
- THEN save is allowed (total = 10.5MB would exceed cap → rejected)
- WHEN user tries to upload a 0.3MB file
- THEN save succeeds (total = 9.8MB < 10MB)

### Delete image
- GIVEN an exercise with 2 uploaded images
- WHEN user calls deleteImage with the blobId of the first image
- THEN only that image is removed
- AND the second image remains accessible
- AND getImages returns only the remaining image

### Filter by force
- GIVEN exercises of various force types (push, pull, static)
- WHEN user clicks "Push" on the Force filter
- THEN only exercises with `force: "push"` are shown

### Multiple filters combine
- GIVEN exercises across categories and difficulties
- WHEN user selects "Strength" category AND "Beginner" level
- THEN only exercises matching BOTH filters are shown

### Secondary chips hidden when not configured
- GIVEN ExerciseSearchHeader rendered without force/mechanic/difficulty/category props
- WHEN the component renders
- THEN the secondary filter row is absent
- AND existing muscle/equipment filters still render
