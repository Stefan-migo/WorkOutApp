# Delta for Exercise Library — `exercise-enhancement`

## MODIFIED Requirements

### Requirement: EL-1 — Define Exercise type

| ID | Description | Keyword |
|----|-------------|---------|
| EL-1 | Define `Exercise` with `{ id, name, description?, primaryMuscles: string[], secondaryMuscles: string[], equipment: string[], instructions: string[], force?: 'push' \| 'pull' \| 'static', mechanic?: 'compound' \| 'isolation', difficulty?: 'beginner' \| 'intermediate' \| 'advanced', images: string[], source: 'user' \| 'free-exercise-db', category: ExerciseCategory, createdAt, updatedAt }` | MUST |

(Previously: `muscleGroups: string[]` only, no `primaryMuscles`, `secondaryMuscles`, `equipment`, `instructions`, `force`, `mechanic`, `difficulty`, `images`, `source`)

#### Scenario: Exercise saved with new fields
- GIVEN the builder in create mode
- WHEN user sets `primaryMuscles: ["Chest"]`, `force: "push"`, `mechanic: "compound"`, adds 3 instruction steps, uploads an image
- THEN the exercise is saved with all new fields and `source: "user"`

### Requirement: EL-8 — Seed exercises on first load

| ID | Description | Keyword |
|----|-------------|---------|
| EL-8 | Seed exercises from free-exercise-db (~800 exercises) on first load when `workoutapp.exercises` is empty using mapped model; set `source: 'free-exercise-db'` | MUST |

(Previously: seed 20 hardcoded common exercises)

#### Scenario: 800+ seeded on fresh install
- GIVEN empty localStorage
- WHEN exercise list loads
- THEN 800+ exercises appear from free-exercise-db with all new fields populated

### Requirement: EL-11 — Exercise row / card display

| ID | Description | Keyword |
|----|-------------|---------|
| EL-11 | Each exercise row SHALL display name, category badge, difficulty badge, force badge, mechanic badge, and primary muscles chips | MUST |

(Previously: name, category badge, and `muscleGroups` tags only)

## ADDED Requirements

### Requirement: EL-13 — IndexedDB image storage

| ID | Description | Keyword |
|----|-------------|---------|
| EL-13 | System SHOULD store exercise images as IndexedDB blobs via `useIndexedDB` hook, with original URLs as fallback; per-exercise cap of 10MB | SHOULD |

#### Scenario: Image cached on first view
- GIVEN an exercise with a GitHub raw image URL
- WHEN user views the detail page
- THEN the image blob is stored in IndexedDB; subsequent loads serve from cache

### Requirement: EL-14 — Validation for extended fields

| ID | Description | Keyword |
|----|-------------|---------|
| EL-14 | System MUST validate: `name` non-empty, `force` one of push/pull/static, `mechanic` one of compound/isolation, `difficulty` one of beginner/intermediate/advanced if provided; `primaryMuscles` SHOULD have >= 1 entry | MUST |

#### Scenario: Invalid force rejected
- GIVEN the builder form
- WHEN user enters force value "invalid"
- THEN validation rejects and form shows error message
