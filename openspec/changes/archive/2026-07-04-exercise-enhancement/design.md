# Design: Exercise Enhancement

## Technical Approach

Local-first extension of the Exercise model with free-exercise-db integration (~800 exercises). Three stacked PRs: data layer → builder + detail page → image storage + filters. No server-side changes — all data stays in localStorage/IndexedDB.

## Architecture Decisions

### Decision: Keep `muscleGroups` as deprecated alias

| Choice | Replace with `primaryMuscles` + `secondaryMuscles`, keep `muscleGroups` as computed compat shim |
|--------|------------------------------------------------------------------------------------------------|
| Rationale | Users have exercises in localStorage with `muscleGroups`. A migration would bloat the PR and risk data loss. The alias is a getter that returns `[...(primary ?? []), ...(secondary ?? [])]`. Remove in a future breaking change. |

### Decision: Seed at runtime via `fetch()`, not inline or build-time

| Choice | Fetch `exercises.json` from GitHub raw URL on first load, map fields, store in localStorage |
|--------|----------------------------------------------------------------------------------------------|
| Rationale | Free-exercise-db JSON is ~3MB. Inlining bloats the bundle; build-time fetch is fragile (stale data). Runtime fetch keeps bundle lean and data fresh. Cache in localStorage on first fetch — subsequent loads skip the network. |

### Decision: Image storage in IndexedDB via new `useIndexedDB` hook

| Choice | IndexedDB wrapper hook storing image blobs, returning blob URLs |
|--------|-----------------------------------------------------------------|
| Rationale | localStorage caps at 5-10MB and can't store blobs natively (base64 overhead ~33%). IndexedDB handles binary data, supports 50MB+ quotas, and works in all browsers. Free-exercise-db images are fetched on demand and cached. |

### Decision: Builder stays as dialog (not full-page route)

| Choice | Keep builder as `<dialog>`, expand to full-screen on mobile (via CSS class toggle) |
|--------|----------------------------------------------------------------------------------------|
| Rationale | Consistent with existing UX pattern. A full-page route would require a separate layout, back-navigation handling, and breaks the CRUD flow on the exercises list. Dialog works — just needs scroll for the richer form. |

## Data Flow

```ascii
  [First Load]
       │
  useExercises()
       │
  ┌────▼───────────┐
  │ localStorage   │ ← empty?
  │ exercises[]    │──yes──▶ fetch free-exercise-db JSON
  └────────────────┘              │
                                  ▼
                           map fields to Exercise[]
                                  │
                           save to localStorage,
                           set seeded=true
                                  │
  user creates exercise ──▶ saveExercise() → localStorage
                                  │
  user uploads image  ──▶ useIndexedDB hook → IDB blob
                                  │
  detail page loads   ──▶ getExercise(id) → localStorage
                           getImages(id)  → IndexedDB (blob URL)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modify | Extend Exercise type: add primaryMuscles, secondaryMuscles, instructions, force, mechanic, images, source; keep muscleGroups as gettable alias |
| `src/lib/exercise-seed.ts` | Replace | Remove 20 hardcoded exercises; export free-exercise-db fetching + mapping logic |
| `src/hooks/useExercises.ts` | Modify | Add seed-from-fetch logic on first load; integrate with IndexedDB for images |
| `src/hooks/useIndexedDB.ts` | Create | Wrapper hook: open DB, store/retrieve blobs by exercise ID, cap at 10MB |
| `src/lib/free-exercise-db-mapper.ts` | Create | Field mapping: `primaryMuscles`→`primaryMuscles`, `level`→`difficulty`, `instructions` array, `equipment` string→string[], images as URL array |
| `src/components/ExerciseFormDialog.tsx` | Replace | Rich builder: tag chips, step editor, force/mechanic/difficulty selectors, image URL + upload, live preview |
| `src/app/exercises/[id]/page.tsx` | Create | Detail page: image gallery, metadata chips, instructions list, edit/delete/add-to-workout |
| `src/app/exercises/page.tsx` | Modify | Update card display (force, mechanic, difficulty badges; primary muscles); update EMPTY_FORM |
| `src/components/ExerciseSearchHeader.tsx` | Modify | Add force, mechanic, difficulty filter chips; derive options from all exercises |
| `src/components/ExerciseDeleteDialog.tsx` | Modify | Accept exercise name; show workout ref counts |
| `src/app/exercises/__tests__/ExercisesPage.test.tsx` | Modify | Update mock exercise data with new fields; add filter tests |

## Interfaces / Contracts

```ts
// Extended Exercise type
interface Exercise {
  id: string
  name: string
  description?: string
  // deprecated — use primaryMuscles + secondaryMuscles
  muscleGroups?: string[]
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  equipment?: string[]
  instructions?: string[]
  force?: 'push' | 'pull' | 'static'
  mechanic?: 'compound' | 'isolation'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  images?: string[]      // URLs (GitHub raw or IndexedDB blob URLs)
  source?: 'user' | 'free-exercise-db'
  category: ExerciseCategory
  createdAt: number
  updatedAt: number
}

// useIndexedDB hook
function useIndexedDB(): {
  getImages(exerciseId: string): Promise<string[]>     // returns blob URLs
  saveImage(exerciseId: string, file: File): Promise<string>  // returns blob URL
  deleteImage(exerciseId: string, blobId: string): Promise<void>
  getUsage(): Promise<number>                          // total bytes used
}

// Free-exercise-db mapper
function mapFreeExerciseDbEntry(raw: RawExercise): Exercise
function fetchAndSeedExercises(): Promise<Exercise[]>
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | free-exercise-db field mapping (level→difficulty, equipment string→array, instructions preserve order) | Pure function tests — fixture data in fixture files |
| Unit | useIndexedDB: save + retrieve image blob, 10MB cap enforcement, cleanup on delete | Mock IDB with fake-indexeddb |
| Integration | Seed flow: empty localStorage fetches and maps 800+ exercises; non-empty localStorage skips seed | Vitest with mocked fetch + mocked localStorage |
| Integration | Builder validation: empty name rejected, invalid force rejected, step reorder persists | Component integration (render form, simulate events) |
| Integration | Detail page: existing ID renders all sections; missing ID renders 404 | Component integration with mock useExercises |

## Migration / Rollout

**PR 1 (Data layer)**:
- Existing exercises in localStorage have `muscleGroups` field. New code reads `primaryMuscles` and `secondaryMuscles` with fallback: `primaryMuscles ?? muscleGroups` and `secondaryMuscles ?? []`.
- `Interval.exerciseId` references are string IDs — no data migration needed. Orphaned IDs already handled gracefully (UI shows fallback).
- Seed migration: first load with empty localStorage triggers free-exercise-db fetch. Users with existing exercises keep them — seed only fires when `exercises.length === 0`.

**PR 2 (Builder + Detail page)**: New UI replaces old form. Existing data rendered with new fields shown as empty where absent.

**PR 3 (Images + Filters)**: Images fetched on demand, cached in IndexedDB. No data migration.

## Open Questions

- [ ] What GitHub raw URL for free-exercise-db `exercises.json`? (Need to pin a tagged release, not `main`)
- [ ] Image upload file size cap — is 10MB per exercise reasonable? Should we compress client-side before storing?
