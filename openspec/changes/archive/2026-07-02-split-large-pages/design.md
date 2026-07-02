# Design: Split large page files

## Technical Approach

Pure mechanical extraction. Cut JSX + adjacent logic from 2 page files into 8 new components in `src/components/`, move `deriveTypeLabel` to `src/lib/calendar-utils.ts`. Zero behavior change — copy-paste only, no refactoring of logic, state management, or styling.

2 stacked PRs:
- **PR 1** (calendar): 5 components + utility move
- **PR 2** (exercises): 3 components

Both independent — no shared files.

## Architecture Decisions

### Decision: Component export style
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Default export | Matches `DayAssignmentModal` pattern | Rejected |
| **Named export** | Matches `ExercisePanel` pattern; consistent with proposal wording | **Chosen** |

Named exports (`export function`) for all 8 components. Parents import as `{ DayRow }` from path.

### Decision: Dialog ref management
| Option | Tradeoff | Decision |
|--------|----------|----------|
| `forwardRef` | Parent keeps ref control, but adds indirection | Rejected |
| **Internal ref + callbacks** | Component owns its `<dialog>` ref, parent controls visibility via conditional render. Matches existing `DayAssignmentModal` pattern | **Chosen** |

Dialogs auto-open via `useEffect` on mount, close via internal handlers. Parent passes `onSave`, `onClose`, `onConfirm`, `onCancel` callbacks. No `forwardRef` needed.

### Decision: deriveTypeLabel move
Pure function, zero dependencies. Moves to `calendar-utils.ts` where `formatWeekRange` and `getDayOfWeek` already live. Reused by `DayRow` and `UpcomingList` after extraction.

### Decision: Constants duplication
`CATEGORIES`, `DIFFICULTIES`, `CATEGORY_LABELS`, `EMPTY_FORM` stay in the exercise page AND get duplicated in extracted components. YAGNI on a shared constants file — these are static label definitions, not logic that can drift.

### Decision: TemplatesPanel owns save/apply logic
`TemplatesPanel` receives `templates`, `weekPlan`, `saveTemplate`, `saveWeekPlan`, `deleteTemplate` as props and owns `templateName`/`saveError` state internally. The `handleSaveTemplate` and `handleApplyTemplate` functions (including duplicate check, confirm dialog) move verbatim into the component. Parent keeps no template-related state.

## File Changes

### PR 1 — Calendar

| File | Action | Lines |
|------|--------|-------|
| `src/components/WeekNav.tsx` | Create | ~15 |
| `src/components/DayRow.tsx` | Create | ~110 |
| `src/components/TodaysFocus.tsx` | Create | ~80 |
| `src/components/TemplatesPanel.tsx` | Create | ~105 |
| `src/components/UpcomingList.tsx` | Create | ~40 |
| `src/lib/calendar-utils.ts` | Modify | +17 lines (deriveTypeLabel) |
| `src/app/calendar/page.tsx` | Modify | ~553 → ~220 |

### PR 2 — Exercises

| File | Action | Lines |
|------|--------|-------|
| `src/components/ExerciseSearchHeader.tsx` | Create | ~80 |
| `src/components/ExerciseFormDialog.tsx` | Create | ~120 |
| `src/components/ExerciseDeleteDialog.tsx` | Create | ~40 |
| `src/app/exercises/page.tsx` | Modify | ~501 → ~200 |

## Interfaces

### PR 1 — Calendar

```tsx
// WeekNav — prev/next header with formatted week range
interface WeekNavProps {
  weekStart: string
  onPrev: () => void
  onNext: () => void
}

// DayRow — single day button with 3 visual states
interface DayRowProps {
  dayName: string
  dayNum: number
  title?: string
  typeLabel: string
  duration: number      // total seconds
  isToday: boolean
  isEmpty: boolean
  onClick: () => void
}

// TodaysFocus — today's session card or "no session" fallback
interface TodaysFocusProps {
  assignment: DayAssignment | null
  workout?: Workout
  sequence?: Sequence
  typeLabel: string
  isCurrentWeek: boolean
  onStartWorkout: () => void
}

// TemplatesPanel — save/apply/delete templates sidebar card
interface TemplatesPanelProps {
  templates: ProgramTemplate[]
  weekPlan: WeekPlan
  saveTemplate: (template: ProgramTemplate) => void
  saveWeekPlan: (plan: WeekPlan) => void
  deleteTemplate: (id: string) => void
}

// UpcomingList — mini-list of future assigned days
interface UpcomingListProps {
  upcomingDays: { index: number; assignment: DayAssignment }[]
  weekStart: string
  workouts: Workout[]
  sequences: Sequence[]
}
```

### PR 2 — Exercises

```tsx
// ExerciseSearchHeader — bento header with search + filter chips + create button
interface ExerciseSearchHeaderProps {
  search: string
  muscleFilter: string | null
  equipmentFilter: string | null
  allMuscleGroups: string[]
  allEquipment: string[]
  onSearchChange: (value: string) => void
  onMuscleFilterChange: (value: string | null) => void
  onEquipmentFilterChange: (value: string | null) => void
  onCreateClick: () => void
}

// ExerciseFormDialog — create/edit exercise inside native <dialog>
interface ExerciseFormDialogProps {
  exercise?: Exercise   // undefined = create mode
  onSave: (exercise: Exercise) => void
  onClose: () => void
}

// ExerciseDeleteDialog — delete confirmation with ref-count warning
interface ExerciseDeleteDialogProps {
  exerciseName: string
  referenceCount: number
  onConfirm: () => void
  onCancel: () => void
}
```

## Data Flow

Each page remains the single source of state. Extracted components are **presentational shells** that receive data via props and delegate actions back via callbacks:

```
calendar/page.tsx (state owner)
  ├── WeekNav       ← weekStart, onPrev, onNext
  ├── DayRow[]      ← day data, onClick → setModalDay(i)
  ├── TodaysFocus   ← today data, onStartWorkout → router.push
  ├── TemplatesPanel ← templates, weekPlan, save/apply/delete
  ├── UpcomingList  ← upcomingDays, workouts, sequences
  └── DayAssignmentModal (existing)

exercises/page.tsx (state owner)
  ├── ExerciseSearchHeader ← search, filters, onCreateClick
  ├── ExerciseFormDialog   ← exercise?, onSave, onClose
  └── ExerciseDeleteDialog ← exerciseName, refCount, onConfirm
```

State lifted up: `templateName`, `saveError`, `form` (exercise), `muscleInput`, `equipmentInput`, `editingId`, `deleteTarget` move INTO their respective extracted components.

## Verification Strategy

| Layer | What | How |
|-------|------|-----|
| Compile | Full build | `next build` passes with zero errors |
| TypeScript | No type mismatches | Strict mode, no `@ts-expect-error` or `any` added |
| Visual | Render identical | Manual check of Calendar and Exercises pages before merging |
| Test | Existing tests pass | `npx vitest run` in CI — no test changes needed (behavior preserved) |

The existing `ExercisesPage.test.tsx` imports `../page` dynamically — it tests the default export of the page file, not inline components. The extraction does not change the default export, so the test continues to pass without modification.

## Open Questions

None. All decisions resolved above.

## PR Structure

PR 1 (calendar): `DayRow`, `TodaysFocus`, `WeekNav`, `TemplatesPanel`, `UpcomingList` + `deriveTypeLabel` move. ~±380 lines in total across creates/deletes, well under the 400-line review budget goal.

PR 2 (exercises): `ExerciseSearchHeader`, `ExerciseFormDialog`, `ExerciseDeleteDialog`. ~±260 lines.

Both PRs target `main` independently — no diff pollution between them.
