# Tasks: Phase 3 — Sequences & Exercises UI

## Metadata

- **Total estimated LOC**: ~410 new/changed
- **Review budget**: 400 lines (as specified)
- **Strict TDD**: Yes
- **Test runner**: vitest
- **Stacked-to-main**: Yes
- **Delivery**: Auto-forecast

## Work Unit 1 — Type Extension + Seed Data

**Files**: `src/types/workout.ts`, `src/lib/exercise-seed.ts`

**Changes**:
1. Add `equipment?: string[]` to `Exercise` interface
2. Add `difficulty?: 'beginner' | 'intermediate' | 'advanced'` to `Exercise` interface
3. Update seed data entries with dummy `equipment` and `difficulty` values

**LOC**: ~30

**Dependencies**: None

**Tests**: None (type changes only, no runtime logic)

---

## Work Unit 2 — Exercise Library Page

**Files**: `src/app/exercises/page.tsx`, `src/components/ExerciseCard.tsx`

**Changes**:
1. Create `ExerciseCard.tsx` shared component:
   - Image placeholder with 4:3 aspect ratio
   - Difficulty badge (absolute top-right)
   - Exercise name
   - Muscle group + equipment tag chips
   - "Add to Workout" outlined button
2. Refactor `exercises/page.tsx`:
   - Search input with Material Icons magnifying glass
   - Category filter pills row
   - Group exercises by category with section headings and counts
   - Responsive grid layout (1/2/3 cols)
   - Update create/edit dialog with equipment + difficulty fields
   - Convert all hardcoded zinc/blue to Deep Nordic tokens

**LOC**: ~180 (80 new ExerciseCard + 100 page refactor)

**Dependencies**: Unit 1

**Tests**:
- ExerciseCard renders name, category, tags
- Search filters by name case-insensitively
- Category filter shows correct subset
- Empty state renders when no exercises

---

## Work Unit 3 — Sequence Builder Page

**Files**: `src/app/sequences/new/page.tsx`

**Changes**:
1. Add glass-panel header with title input + live duration display
2. Keep description, repeat count inputs (restyle with tokens)
3. Restructure workout reorder list with accent left borders and category indicators
4. Replace inline Cancel/Save with sticky bottom action bar (Discard + Save Sequence)
5. Add right sidebar (visible on xl screens):
   - Sequence Profile: bar chart placeholder, work/rest ratio, estimated strain bar
6. Keep ▲▼ reorder (ponytail: drag-and-drop deferred)
7. Keep inline workout picker with search (modal pattern deferred)
8. Convert all styling to Deep Nordic tokens

**LOC**: ~140

**Dependencies**: None (works with existing Sequence type)

**Tests**:
- Form validation: empty title disables save
- Form validation: no workouts selected disables save
- Adding/removing workouts updates selected count
- Reorder buttons work correctly for boundary cases (first, last)
- Total duration updates when selection changes

---

## Work Unit 4 — Sequences List Page

**Files**: `src/app/sequences/page.tsx`

**Changes**:
1. Replace direct color classes with Deep Nordic design tokens
2. Add Material Icons where appropriate (e.g., Play icon)
3. Minor polish: use `glass-card` class for sequence cards

**LOC**: ~40

**Dependencies**: None

**Tests**: Smoke test — renders empty state + populated list

---

## Work Unit 5 — Test Verification + Edge Cases

**Files**: Existing test files + verify

**Changes**:
1. Run all existing tests to confirm no regressions
2. Cover edge cases: empty exercise list, empty sequence list, boundary reorder
3. Confirm seed data loads correctly with new fields

**LOC**: ~20 (test additions)

**Dependencies**: Units 1-4

---

## Review Workload Forecast

| Unit | Estimated LOC | Review effort |
|------|--------------|---------------|
| 1 — Type extension + seed | ~30 | 2 min |
| 2 — Exercise library page | ~180 | 10 min |
| 3 — Sequence builder page | ~140 | 8 min |
| 4 — Sequences list page | ~40 | 3 min |
| 5 — Test verification | ~20 | 2 min |
| **Total** | **~410** | **~25 min** |

Total LOC ~410 (slightly over 400 review budget; 2.5% margin — acceptable).

## Stacking Strategy

Stacked to `main`:
1. `phase-3-types-seed` → Units 1, 5 (tests)
2. `phase-3-exercises` → Unit 2
3. `phase-3-sequences-builder` → Unit 3
4. `phase-3-sequences-list` → Unit 4

Each branch is reviewable independently (< 200 lines per branch).
