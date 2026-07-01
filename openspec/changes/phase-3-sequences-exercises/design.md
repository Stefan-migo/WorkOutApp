# Design: Phase 3 — Sequences & Exercises UI

## Architecture Overview

This is a **visual layer change** only. Data layer (`useSequences`, `useExercises`, `useLocalStorage`), routing, and core types remain untouched (with minor type extension).

```
Current data flow:
  localStorage → useLocalStorage → useExercises / useSequences → pages

Design change:
  Only the "pages" layer is affected. All hooks, context, and types unchanged except
  Exercise type extension (new optional fields).
```

## Component Tree

### Sequences List (`/sequences/page.tsx`)

```
SequenceListPage (client component)
├── Header: "Sequences" heading + "+ New Sequence" button
└── Sequence cards (mapped from sequences[])
    ├── Title, description, metadata (workout count, duration, repeat, missing)
    ├── Play button → `/sequences/[id]/play`
    └── Delete button → confirm → deleteSequence(id)
```

Minimal change: replace class names with design tokens, add Material Icons.

### Sequence Builder (`/sequences/new/page.tsx`)

```
NewSequencePage (client component)
├── Main column (flex-1)
│   ├── Glass-panel header
│   │   ├── Sequence title (inline input, bottom-border focus)
│   │   └── Total duration display (data-lg / JetBrains Mono)
│   ├── Description textarea
│   ├── Repeat count input + computed rounds
│   ├── Selected workout list (mapped from selectedIds)
│   │   ├── Index number
│   │   ├── Workout name + duration + category accent
│   │   ├── Reorder: ▲ / ▼ buttons
│   │   └── Remove: ✕ button
│   └── Dashed "Browse & Add Workouts" area → opens picker modal
│       └── Picker dialog:
│           ├── Search input
│           └── Scrollable checkbox list
├── Right sidebar (xl:block, w-80)
│   └── Sequence Profile panel (sticky, glass-panel)
│       ├── Bar chart placeholder (colored bars)
│       ├── Work ratio / Rest ratio stat cards
│       └── Estimated strain bar
└── Sticky bottom bar
    ├── Discard button (ghost, navigates to /sequences)
    └── Save Sequence button (primary, accent)
```

### Exercise Library (`/exercises/page.tsx`)

```
ExercisesPage (client component)
├── Search + Filter Bento section
│   ├── Search input with magnifying glass icon
│   └── Category filter pills row
├── Category sections (mapped from grouped exercises)
│   ├── Section heading: category name + count
│   └── Responsive grid (1/2/3 cols)
│       └── Exercise cards
│           ├── Image placeholder (4:3 aspect, surface-container pattern)
│           ├── Difficulty badge (top-right absolute)
│           ├── Exercise name
│           ├── Tags: muscle groups + equipment chips
│           └── "Add to Workout" outlined button
├── Create/Edit dialog
│   ├── Name input
│   ├── Category select
│   ├── Description textarea
│   ├── Muscle Groups input (comma-separated)
│   ├── Equipment input (comma-separated) — NEW
│   ├── Difficulty select — NEW
│   └── Cancel + Save buttons
└── Delete confirmation dialog
    ├── Warning message with workout reference count
    └── Cancel + Delete buttons
```

## Type Changes

```typescript
// Extension to existing Exercise type in src/types/workout.ts
export interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroups?: string[]
  category: ExerciseCategory
  equipment?: string[]       // NEW
  difficulty?: 'beginner' | 'intermediate' | 'advanced'  // NEW
  createdAt: number
  updatedAt: number
}
```

## Styling Strategy

All colors, typography, and spacing use the existing `@theme` tokens from `globals.css`:

| Token | Usage |
|-------|-------|
| `bg-background` | Page background |
| `rounded-xl` (1.5rem) | Glass panels and cards |
| `rounded-lg` (1rem) | Smaller cards, dialogs |
| `rounded-md` (0.75rem) | Buttons |
| `rounded-full` | Filter chips |
| `glass-card` | Reusable glass panel |
| `ambient-shadow` | Elevated buttons |
| `text-headline-lg/md` | Section headings |
| `text-body-lg/md` | Body text |
| `text-data-sm/data-lg` | Metrics and durations |
| `text-label-caps` | Section labels (uppercase) |
| `font-mono`, `font-data`, `font-timer` | JetBrains Mono |
| `font-headline`, `font-body`, `font-label` | Inter |

Color tokens to use (not hardcoded zinc/blue):
- `text-primary`, `text-on-surface`, `text-on-surface-variant`
- `bg-surface`, `bg-surface-container`, `bg-surface-variant`
- `border-outline-variant`, `border-outline`
- `bg-secondary-container`, `text-secondary-container`
- `text-error`, `bg-error-container/50`

## State Management

```
Sequence Builder state:
  title: string
  description: string
  repeatCount: number (1-99)
  selectedIds: string[]
  search: string
  pickerOpen: boolean

Exercise Library state:
  search: string
  activeCategory: ExerciseCategory | 'all'
  form fields (create/edit)
  editingId: string | null
  deleteTarget: string | null
```

Both are local component state — no global state changes.

## File Changes

| File | Change |
|------|--------|
| `src/types/workout.ts` | Add `equipment` and `difficulty` to `Exercise` |
| `src/app/sequences/page.tsx` | Design tokens + Material Icons |
| `src/app/sequences/new/page.tsx` | Major restructure: glass header, sidebar profile, bottom bar |
| `src/app/exercises/page.tsx` | Major restructure: search, filter, grid cards, new fields |
| `src/lib/exercise-seed.ts` | Update seed data with equipment + difficulty |
| `src/components/ExerciseCard.tsx` | (NEW) Shared exercise card component |

## Risks

- **Schedule risk**: None — visual-only changes, data layer untouched
- **Type risk**: Adding optional fields to `Exercise` is backwards-compatible; existing exercise data will work without equipment/difficulty
- **Regression risk**: Low — no changes to data flow, routing, or navigation
- **Ponytail risk**: Drag-and-drop library intentionally skipped; ▲▼ reorder kept. Add if user requests it.
