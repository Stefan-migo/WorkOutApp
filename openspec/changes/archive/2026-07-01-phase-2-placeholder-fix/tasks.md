# Tasks: Phase 2 Placeholder Fix

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 15-25 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|-----|-------|
| 1 | StatsDashboard "Export CSV" → "Export JSON" + test | Single PR | 1 component + 1 test file |
| 2 | Exercise pre-population via query params | Single PR | 3 files: exercises page, WorkoutEditor, new workout page |

Both units are independent and well under 400 lines. Deliver as one PR.

## Phase 1: StatsDashboard Label Fix

- [x] 1.1 Rename button label in `src/components/StatsDashboard.tsx` (line 115): `Export CSV` → `Export JSON`
- [x] 1.2 Update test in `src/components/__tests__/StatsDashboard.test.tsx` (lines 64, 73): change `export csv` regex → `export json`

## Phase 2: Exercise Pre-population Flow

- [x] 2.1 Update "Add to Workout" button in `src/app/exercises/page.tsx` (line 341): append `?exerciseId=${ex.id}` to `router.push('/workouts/new')`
- [x] 2.2 Add optional `initialIntervals?: Interval[]` prop to `WorkoutEditorProps` in `src/components/WorkoutEditor.tsx`; change intervals `useState` to `existingWorkout?.intervals ?? initialIntervals ?? DEFAULT_INTERVALS`
- [x] 2.3 Update `src/app/workouts/new/page.tsx`:
    - Add `searchParams: Promise<{ exerciseId?: string }>` prop, unwrap with `use()` from React
    - Import `useExercises` from `@/hooks/useExercises`
    - Look up exercise by `exerciseId`, build one work interval (title: exercise.name, duration: 60, exerciseId, type: 'work')
    - Pass `initialIntervals` to `<WorkoutEditor>`
