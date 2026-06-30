# Proposal: Phase 3 — Exercise Library

## Intent

Replace hardcoded inline exercises with a persistent exercise library. Users can manage their own exercise list, and the workout editor picker draws from it instead of a static array.

## Scope

### In Scope
- `Exercise` type upgrade: `muscleGroup: string` → `muscleGroups?: string[]`, add `category` enum
- `useExercises` hook with CRUD + seed-data logic, backed by `workoutapp.exercises` localStorage
- `/exercises` page — list, create, edit, delete exercises
- Update `IntervalForm` / `IntervalDetailSheet` picker to use exercise library with search/filter
- Quick-create exercise from picker flow
- ~20 common exercises as seed data (inline, no external JSON)

### Out of Scope
- Muscle group or category management UI
- Exercise images, GIFs, or video
- Bulk import/export
- External exercise DB (e.g., free-exercise-db API)
- Exercise sharing between users

## Capabilities

### New Capabilities
- `exercise-library`: Exercise CRUD page, seed data, category/muscleGroup metadata
- `exercise-picker`: Searchable select drawing from exercise library, with inline quick-create

### Modified Capabilities
- `workload-data-model`: Update `Exercise` type — add `category`, pluralize `muscleGroups`, add timestamps
- `local-persistence`: Add `workoutapp.exercises` key with seed-on-empty logic
- `workout-editor`: Exercise picker draws from persistent library instead of hardcoded array

## Approach

New `useExercises` hook (`src/hooks/useExercises.ts`) mirrors `useWorkouts` pattern — `useLocalStorage<Exercise[]>(...)` + CRUD wrappers. Seed data (~20 exercises) inlined in the hook as default value; first-load-empty check detects empty array and writes seeds. `/exercises` page is a RSC shell with a client list component. Picker becomes a `<datalist>` or simple searchable select — no modal complexity.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modified | Update `Exercise` interface |
| `src/hooks/useExercises.ts` | New | Exercise CRUD + seed logic |
| `src/hooks/useLocalStorage.ts` | Unchanged | Reused |
| `src/data/exercises.ts` | Removed | Superseded by useExercises + localStorage |
| `src/app/exercises/page.tsx` | New | Exercise list/CRUD page |
| `src/components/IntervalForm.tsx` | Modified | Picker uses exercise library |
| `src/components/IntervalDetailSheet.tsx` | Modified | Picker uses exercise library |
| `src/components/ExercisePicker.tsx` | New | Shared picker with search + quick-create |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing workout `exerciseId` values become stale if exercise deleted | Low | Soft-delete flag or just orphan IDs — intervals still work, name is cached in UI |
| Seed data overwrites user edits | Low | Only seed on empty array, never on re-load |
| Exercise deletion removes exercises referenced by active workouts | Med | Show warning with count of affected workouts before delete |

## Rollback Plan

Revert changed files. Existing localStorage keys are additive — `workoutapp.exercises` won't interfere. If `/exercises` page breaks, remove route folder. If picker breaks, restore `IntervalForm` to `getExercises()` import.

## Dependencies

None.

## Success Criteria

- [ ] `/exercises` page lists all exercises with name, category, muscle groups
- [ ] Create, edit, delete exercises persists to localStorage and survives refresh
- [ ] Fresh install (empty localStorage) auto-seeds ~20 exercises
- [ ] IntervalForm exercise picker shows saved exercises, supports search/filter
- [ ] Quick-create from picker adds exercise and selects it immediately
- [ ] All existing workout/sequence/history pages unchanged
