# Tasks: Phase 3 — Exercise Library

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full change | Single PR | Types → seed → hook → picker → page → integration → cleanup |

## Phase 1: Foundation

- [x] 1.1 Update `src/types/workout.ts` — add `ExerciseCategory` type; update `Exercise` with `category`, `muscleGroups?: string[]`, `createdAt`, `updatedAt`
- [x] 1.2 Create `src/lib/exercise-seed.ts` — export `EXERCISE_SEEDS: Exercise[]` with ~20 common exercises across all categories
- [x] 1.3 Create `src/hooks/useExercises.ts` — CRUD over `useLocalStorage<Exercise[]>(workoutapp.exercises)`, auto-seed on empty array, mirrors `useWorkouts` pattern

## Phase 2: Core Components

- [x] 2.1 Create `src/components/ExercisePicker.tsx` — search + category filter + scrollable list + quick-create via native `<dialog>`; props: `exercises`, `value`, `onChange`; empty state with create prompt
- [x] 2.2 Create `src/app/exercises/page.tsx` — RSC shell + client list; create/edit modal (name, category, description, muscle group tags); delete with confirmation showing workout ref count

## Phase 3: Integration

- [x] 3.1 Modify `src/components/IntervalForm.tsx` — replace `<select>` + `getExercises()` with `<ExercisePicker>` + `useExercises()`, only for Work intervals
- [x] 3.2 Modify `src/components/IntervalRow.tsx` — replace `getExercise()` import from `@/data/exercises` with `useExercises()` hook
- [x] 3.3 Modify `src/app/workouts/[id]/play/page.tsx` — replace `getExercise()` import with `useExercises()` hook

## Phase 4: Cleanup

- [x] 4.1 Delete `src/data/exercises.ts` — superseded by `useExercises` + localStorage

### Skipped / Noted

- `IntervalDetailSheet.tsx` — file not found on disk (referenced in spec WE-12 but never created). No task needed in this phase.
- Test tasks excluded — no test runner configured (`testing.runner: null` in config). Add when vitest/jest is set up.
- `muscleGroups`: tags with remove button + free-text input for adding (no autocomplete) per ponytail.
- `createdAt`/`updatedAt` on Exercise: stored but not displayed in UI yet. `ponytail: add date sorting/filtering when needed.`
