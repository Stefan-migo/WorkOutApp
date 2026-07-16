# Proposal: Phase 3 — Sequences & Exercises UI

## Intent

Align `/sequences`, `/sequences/new`, and `/exercises` pages with the Open Design prototypes (`sequence-builder.html`, `exercise-library.html`) and the Deep Nordic Athletic design system defined in `DESIGN.md` and `globals.css`.

## Scope

| Page | Route | Current state | Target state |
|------|-------|---------------|--------------|
| Sequence List | `/sequences` | Functional but unstyled | Deep Nordic tokens, Material Icons, glass-card pattern |
| Sequence Builder | `/sequences/new` | Functional inline form | Glass-panel header, drag reorder, sequence profile sidebar, sticky bottom bar |
| Exercise Library | `/exercises` | Hardcoded zinc/blue palette, flat list | Search, category filters, grid layout with cards, new `equipment`/`difficulty` fields |

## What stays the same

- Data layer (`useSequences`, `useExercises`, `useLocalStorage`, `WorkoutContext`)
- Types model (`Exercise`, `Sequence`, `Workout`) — extended but not broken
- All existing routes and navigation structure
- The `Nav` component (sidebar + top bar already renders globally)

## What changes

### Sequences list
- Minimal: replace raw Tailwind classes with Deep Nordic design tokens
- Add `material-symbols-outlined` icons
- Use `glass-card` class for sequence cards
- No feature changes

### Sequence builder (major)
- Replace inline Cancel/Save buttons with proper sticky bottom action bar (Discard + Save Sequence)
- Add glass-panel header showing sequence title + total duration
- Add right sidebar panel with Sequence Profile (bar chart, work/rest ratio, estimated strain)
- Add drag-and-drop reorder (or enhance ▲▼ with better UX)
- Replace inline workout picker with "Browse & Add Workouts" modal

### Exercise library (major)
- Add search field with icon
- Add category filter chips (All, Strength, Cardio, etc.)
- Redesign from flat list to grid with category sections
- Add `equipment: string[]` and `difficulty: 'beginner' | 'intermediate' | 'advanced'` to `Exercise` type
- Exercise cards with image placeholder, muscle group + equipment tags, difficulty badge
- Convert all hardcoded colors to Deep Nordic design tokens

## Out of scope

- `/sequences/[id]/play` — already handled in Phase 2
- Drag-and-drop library (reorder via HTML5 drag API or keep ▲▼)
- Image upload for exercises — use placeholder only
- Server-side rendering / RSC optimizations

## Approach

1. Extend `Exercise` type with `equipment` and `difficulty`
2. Refactor `/exercises/page.tsx` — search, filter, grid cards
3. Refactor `/sequences/new/page.tsx` — glass header, sidebar profile, bottom bar
4. Update `/sequences/page.tsx` — tokens + icons
5. Add shared components for reused patterns (ExerciseCard, SequenceProfilePanel)
