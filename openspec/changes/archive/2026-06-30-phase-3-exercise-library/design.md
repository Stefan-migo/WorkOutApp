# Design: Phase 3 — Exercise Library

## Technical Approach

Replace the static `src/data/exercises.ts` hardcoded array with a persistent exercise library backed by `localStorage`. Reuse the existing `useLocalStorage` hook pattern (mirrors `useWorkouts`). Add a shared `ExercisePicker` component with search, category filter, and quick-create via native `<dialog>`. Create a standalone `/exercises` CRUD page. Auto-seed ~20 common exercises on first load.

## Architecture Decisions

### Decision: Seed data location

**Choice**: Separate `src/lib/exercise-seed.ts` module exporting a typed `EXERCISE_SEEDS` constant.
**Alternatives**: Inline in the hook as default value (proposal suggested this); external JSON file.
**Rationale**: Keeps the hook free of seed noise. A constant export is trivially testable and discoverable. No JSON file means no import/extract ceremony.

### Decision: Exercise type shape

**Choice**: `muscleGroups?: string[]`, `category: ExerciseCategory` enum, `createdAt/updatedAt: number`.
**Alternatives**: Keep `muscleGroup: string`; add `category` as optional string.
**Rationale**: Aligns with real-world exercise metadata (multiple muscle groups). The category enum constrains the set to `'strength' | 'cardio' | 'stretching' | 'mobility' | 'other'` — no free-text categories.

### Decision: Picker component architecture

**Choice**: Controlled component receiving `exercises: Exercise[]` and `onSelect(id: string)`. Search/filter state internal.
**Alternatives**: Self-contained hook call inside the picker; compound component with render props.
**Rationale**: Parent already has the hook (`useExercises`), passing `exercises` as props avoids dual state sources and keeps the picker a pure presentational component.

### Decision: Quick-create flow

**Choice**: Inline in the picker via native `<dialog>`. After save, auto-selects the new exercise.
**Alternatives**: Navigate to `/exercises` page and back; separate modal component.
**Rationale**: Minimal friction — user stays in the same form. Native `<dialog>` needs zero dependencies.

## Data Flow

```
User opens workout editor
        │
        ▼
IntervalForm ──uses──► ExercisePicker
                            │
                    ┌───────┴──────────┐
                    ▼                  ▼
              Search/filter      Quick-create
                                    │
                                    ▼
                              useExercises().saveExercise()
                                    │
                                    ▼
                              localStorage['workoutapp.exercises']
                                    │
                                    ▼
                              Seed on empty ← EXERCISE_SEEDS[]
```

For display at play time:

```
play/page.tsx
    │
    ▼
useExercises().getExercise(id) ──→ exercise?.name, .description
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modify | Update `Exercise` — add `category`, `createdAt`, `updatedAt`; `muscleGroup` → `muscleGroups?: string[]` |
| `src/lib/exercise-seed.ts` | Create | Export `EXERCISE_SEEDS` constant array (~20 seed exercises) |
| `src/hooks/useExercises.ts` | Create | `useExercises()` — CRUD wrapper over `useLocalStorage<Exercise[]>`, auto-seed on empty |
| `src/components/ExercisePicker.tsx` | Create | Search input + category filter + scrollable list + quick-create dialog |
| `src/components/IntervalForm.tsx` | Modify | Replace `<select>` with `<ExercisePicker>`, wire `useExercises` hook |
| `src/components/IntervalRow.tsx` | Modify | Replace `getExercise()` import with `useExercises()` lookup (or prop-drill name) |
| `src/app/workouts/[id]/play/page.tsx` | Modify | Replace `getExercise()` import with `useExercises()` lookup |
| `src/app/exercises/page.tsx` | Create | Exercise CRUD list page — list, create, edit, delete with confirmation |
| `src/data/exercises.ts` | Delete | Superseded by `useExercises` + localStorage |

## Interfaces / Contracts

```typescript
// src/types/workout.ts — updated
export type ExerciseCategory = 'strength' | 'cardio' | 'stretching' | 'mobility' | 'other'

export interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroups?: string[]
  category: ExerciseCategory
  createdAt: number
  updatedAt: number
}

// src/hooks/useExercises.ts — public API
export function useExercises(): {
  exercises: Exercise[]
  getExercise: (id: string) => Exercise | undefined
  saveExercise: (exercise: Exercise) => void
  deleteExercise: (id: string) => void
}

// src/components/ExercisePicker.tsx — props
interface ExercisePickerProps {
  exercises: Exercise[]
  value: string          // selected exercise id
  onChange: (id: string) => void
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useExercises` CRUD + seed logic | Mock `useLocalStorage`, assert seed-on-empty, assert add/update/delete |
| Unit | `ExercisePicker` search/filter | Render with exercise list, type in search, assert filter result |
| Integration | `/exercises` page flow | Render page, create exercise, verify it appears in list |
| E2E | Full picker flow | Open workout editor, pick exercise, quick-create new one, verify it's selected |

No migration required — old `src/data/exercises.ts` is deleted, all consumers switch to `useExercises()`. Existing `exerciseId` values in intervals remain valid as long as the referenced exercise exists in localStorage.

## Open Questions

- [ ] Does `IntervalRow` need to show exercise category badge, or just name is enough?
- [ ] Confirm: `IntervalDetailSheet.tsx` does not exist yet — should it be created in this phase or is it a future component?
