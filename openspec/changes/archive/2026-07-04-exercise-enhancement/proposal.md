# Proposal: Exercise Enhancement

## Intent

Exercise library is too small (20 exercises, basic fields) to be useful for real programming. Need 800+ exercises from free-exercise-db with richer metadata, proper builder UI, detail page, and upgraded search/filter.

## Scope

**In**: free-exercise-db ingest (800+ exercises replacing 20 seed), extended model (instructions, primaryMuscles, secondaryMuscles, force, mechanic, images), builder UI (tag chips, step editor, force/mechanic/level selectors, image upload to IndexedDB, preview card), `/exercises/[id]` detail page, upgraded search/filter.
**Out**: Supabase persistence, GIF/video upload, multi-device sync.

## Capabilities

**New**: `exercise-detail-view` (detail page), `exercise-builder-ui` (rich form), `exercise-image-storage` (IndexedDB blobs).
**Modified**: `exercise-library` (model extended, seed 20→800+, filters expanded, `muscleGroups`→`primaryMuscles`+`secondaryMuscles`), `exercise-picker` (updated display with new fields).

## Approach

1. Fetch free-exercise-db JSON, map fields to new Exercise model, replace seed file.
2. Extend `Exercise` type in `types/workout.ts`; split `muscleGroups` into `primaryMuscles` + `secondaryMuscles`.
3. New `[id]/page.tsx` detail page with images, instructions list, metadata chips, edit/delete/add-to-workout.
4. Replace `ExerciseFormDialog` with builder: tag autocomplete chips (from existing DB values), step reorder editor, force/mechanic/level selectors, IndexedDB image upload + URL input, live preview card.
5. New `useIndexedDB` hook for image blob storage.
6. Add force/mechanic/level/category filter chips to `ExerciseSearchHeader`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modified | Exercise model extended |
| `src/lib/exercise-seed.ts` | Replaced | 20→800+ from free-exercise-db |
| `src/hooks/useExercises.ts` | Modified | IndexedDB image integration |
| `src/app/exercises/page.tsx` | Modified | New filters, updated card |
| `src/components/ExerciseSearchHeader.tsx` | Modified | Filter chips added |
| `src/components/ExerciseFormDialog.tsx` | Replaced | Richer builder UI |
| `src/app/exercises/[id]/page.tsx` | New | Detail view |
| `src/hooks/useIndexedDB.ts` | New | Image blob storage |
| `openspec/specs/exercise-library/spec.md` | Delta | Model/filters changed |
| `openspec/specs/exercise-picker/spec.md` | Delta | Updated display |
| `openspec/specs/exercise-detail-view/spec.md` | New | Detail page spec |
| `openspec/specs/exercise-builder-ui/spec.md` | New | Builder UI spec |
| `openspec/specs/exercise-image-storage/spec.md` | New | Image storage spec |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| free-exercise-db schema mismatch | Low | Explicit field mapping + type validation |
| Model change breaks existing Interval.exerciseId refs | Med | Graceful handling of orphaned IDs |
| 800+ exercises degrade search | Low | Add debounce to search input |
| IndexedDB storage limits | Low | Compress images client-side, cap at 10MB |

## Rollback

Revert commits. Clear `workoutapp.exercises` key if stale data remains. No server-side impact.

## Dependencies

free-exercise-db (Unlicense, MIT) — JSON fetched at build/init. IndexedDB (browser native).

## Success Criteria

- [ ] 800+ exercises seeded on fresh install (replacing previous 20)
- [ ] Detail page renders instructions, primary/secondary muscles, force, mechanic, images
- [ ] Builder creates/edits exercises with all new fields
- [ ] Image upload stores blobs in IndexedDB, displays in preview + detail
- [ ] Search/filter includes force, mechanic, level, category
- [ ] All existing exercise-library + exercise-picker scenarios pass
