# Design: Exercise Integration v2

## Technical Approach

Five sequential PR slices that progressively enhance exercise display and selection across the app. All changes client-side only — localStorage for favorites, native `<dialog>` for picker, CSS grid for layout. Zero new npm dependencies.

## Architecture Decisions

### Decision 1: ExercisePanel — accept full `Exercise` object

| Option | Tradeoff | Choice |
|--------|----------|--------|
| Keep flat props | 7+ new props (images[], instructions[], difficulty, force, mechanic, equipment, secondaryMuscles) | ✗ |
| Accept `Exercise` object | Single prop, panel owns rendering, reusable anywhere | ✓ |

**Rationale**: Both play pages already call `getExercise(interval.exerciseId)` to resolve the full object. Passing it eliminates prop-surface coupling and keeps the panel self-contained.

### Decision 2: ExercisePicker — standalone component

| Option | Tradeoff | Choice |
|--------|----------|--------|
| Inline in IntervalDetailSheet | +200 lines, blurs concerns, busts PR slice | ✗ |
| `ExercisePicker.tsx` | Clean separation, reusable, fits 150-line slice | ✓ |

**Rationale**: Picker manages search state, multi-filter (category/force/mechanic/difficulty), rich card rendering, category grouping, mini preview card, and its own `<dialog>` lifecycle. Inlining violates single-responsibility and the PR slice budget.

### Decision 3: Favorites — hook only (no context)

| Option | Tradeoff | Choice |
|--------|----------|--------|
| React Context | Provider boilerplate, re-renders all consumers on any toggle | ✗ |
| `useFavorites()` hook | Zero setup, synchronous localStorage reads, each consumer independent | ✓ |

**Rationale**: No async, no loading state, no provider. Each component (cards, detail page, picker) calls `useFavorites()` independently. Matches `useExercises` pattern.

### Decision 4: Card layout — Tailwind CSS Grid

| Option | Tradeoff | Choice |
|--------|----------|--------|
| Custom grid impl | Bug-prone, more CSS | ✗ |
| `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | Zero custom code, already used on page | ✓ |

**Rationale**: The exercises page already uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Just adjusting breakpoint classes. No abstraction needed.

## Data Flow

```
localStorage('workoutapp.favorites')          localStorage('workoutapp.exercises')
       ↓                                                ↓
   useFavorites()                                    useExercises()
       ↓                                                ↓
   favoriteIds: string[]                         exercises: Exercise[]
       ↓                                                ↓
   library / detail / picker ───── ◀─────── WorkoutEditor ──→ IntervalDetailSheet ──→ ExercisePicker
                                                    ↑
   library cards / IntervalRow ◀── getExercise(id) ─┘
                                                    ↓
   play pages (workout + sequence) ──→ ExercisePanel(exercise)
```

- `favoriteExercises` is derived: `favoriteIds.map(id => getExercise(id)).filter(Boolean)` — IDs for deleted exercises drop silently
- IntervalRow already calls `useExercises().getExercise()` — no new props needed
- WorkoutEditor must be updated to import `useExercises` and pass `exercises` to IntervalDetailSheet
- Play pages already call `getExercise()` — change is to pass the result to ExercisePanel as a single `exercise` prop

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useFavorites.ts` | Create | localStorage favorites hook |
| `src/components/ExercisePicker.tsx` | Create | Rich card picker dialog |
| `src/app/exercises/page.tsx` | Modify | Star toggle, "Favorites" tab, compact cards, grid density, collapsible filter sections |
| `src/app/exercises/[id]/page.tsx` | Modify | Star toggle in header area |
| `src/components/IntervalDetailSheet.tsx` | Modify | `<select>` → ExercisePicker + mini preview card |
| `src/components/IntervalRow.tsx` | Modify | Exercise thumbnail (32×32) + name link + primary muscles chips |
| `src/components/ExercisePanel.tsx` | Modify | Accept `Exercise` object, render gallery + instructions + all metadata |
| `src/components/WorkoutEditor.tsx` | Modify | Import useExercises, pass exercises to IntervalDetailSheet |
| `src/app/workouts/[id]/play/page.tsx` | Modify | Pass `exercise` object to ExercisePanel instead of flat props |
| `src/app/sequences/[id]/play/page.tsx` | Modify | Same pattern as workouts play |

## Interfaces / Contracts

```typescript
// useFavorites.ts
interface UseFavoritesReturn {
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  favoriteExercises: Exercise[]
  /** Call when an exercise is deleted to clean up orphaned ID */
  removeFavorite: (id: string) => void
}

// ExercisePicker.tsx
interface ExercisePickerProps {
  exercises: Exercise[]
  selectedId?: string
  onSelect: (id: string) => void
  onClose: () => void
}
// Opens as its own <dialog>. The parent renders a button showing
// selected exercise name + mini preview card (conditional).

// ExercisePanel.tsx — replaces flat props
interface ExercisePanelProps {
  exercise?: Exercise
}
// When exercise is undefined, renders "Exercise not found (ID: ...)"
```

Mini preview card (rendered in IntervalDetailSheet when exerciseId is set):
- 40×40 thumbnail + exercise name (link to `/exercises/[id]`)
- Category badge + primary muscles chips (max 2) + difficulty/force/mechanic badges
- Equipment tags (max 3) + first 2 instructions lines
- Favorite star toggle

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useFavorites` toggle, persist, cleanup | Mock `localStorage`, verify reads/writes on toggle and remove |
| Integration | ExercisePicker open → filter → select | Render picker with 3 exercises, simulate search + filter + selection |
| Visual | Responsive grid breakpoints | Tailwind — visual check at 600/900/1400px |
| Edge | ExercisePanel with `undefined` | Render "not found" fallback |
| Edge | IntervalRow with no exerciseId | No preview section rendered |

## Migration / Rollout

No migration required. All changes client-side. Favorites populate on first star click. Existing intervals preserve `exerciseId` — only the display surfaces improve. `imageUrl` field on intervals is preserved for backward compatibility.

## Open Questions

- [ ] Should `deleteExercise` in `useExercises` auto-call `removeFavorite`, or should the delete handler in the page do both? Design favors the page handler doing both for separation of concerns.

## PR Slice Mapping

| PR | Files | Est. Lines |
|----|-------|-----------|
| 1 — Favorites | useFavorites.ts + star UI on library + detail | ~180 |
| 2 — Library redesign | exercises/page.tsx layout + filter bar | ~200 |
| 3 — Rich ExercisePicker | ExercisePicker.tsx + IntervalDetailSheet integration | ~220 |
| 4 — IntervalRow preview | IntervalRow.tsx + WorkoutEditor passes exercises | ~120 |
| 5 — ExercisePanel upgrade | ExercisePanel.tsx + both play pages | ~150 |
