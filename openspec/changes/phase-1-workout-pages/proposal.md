# Proposal: Phase 1 — Workout Pages Redesign

## Intent

Eliminate visual inconsistency between the current Burgundy Monochrome implementation and the Deep Nordic Athletic design system. The three workout pages (`/workouts`, `/workouts/new`, `[id]/edit`) still use legacy tokens (`text-fg`, `bg-accent`, `border-border`) and lack the glassmorphism cards, segment-colored accents, timeline polish, and bento grid patterns shown in the OpenDesign prototypes. This change makes the workout feature match the brand's "quiet power" aesthetic.

## Scope

### In Scope

1. **Workout list page** (`/workouts`) — full Deep Nordic redesign with search/filter bar, card grid with timeline previews, floating action button, responsive layout
2. **Workout editor pages** (`/workouts/new`, `[id]/edit`) — extract shared `WorkoutEditor` component eliminating 95% duplication between new/edit; apply glass card, timeline legend, bento "Add Block" grid, cycle bracket visual, Deep Nordic tokens
3. **Component rewrites** — `IntervalRow.tsx` (glass card, left accent border, drag handle icon, description), `IntervalForm.tsx` → "Add Block" bento grid (4 interval type cards), `TimelineStrip.tsx` (taller bar, `shadow-inner`, legend), `IntervalDetailSheet.tsx` (token-only)
4. **Token migration** — replace all `text-fg`, `bg-accent`, `border-border`, `text-muted`, `bg-surface-alt`, `bg-interval-*` with corresponding Deep Nordic tokens from `globals.css`

### Out of Scope

- Full drag-and-drop reordering (keep ▲▼ + `drag_indicator` as visual affordance)
- Page-level layout / side nav (already handled globally)
- Active timer pages (`/workouts/[id]/play`)
- Sequence editor pages
- Exercise/library pages
- Any page outside the `/workouts` route group

## Capabilities

### New Capabilities

None — no wholly new capability area. "Wrap in Cycle" and bento grid are UX changes within the workout-editor capability.

### Modified Capabilities

- `workout-editor`: New visual palette, "Add Block" bento grid replaces dropdown IntervalForm, cycle bracket visual + repeats selector for "Wrap in Cycle", shared `WorkoutEditor` component extraction (pure refactor). Spec-level additions for cycle grouping UX and timeline legend.

## Approach

1. **Shared extraction**: Create `src/components/WorkoutEditor.tsx` containing the title input, timeline, interval list, detail sheet, Add Block grid, cycle bracket, and save button — all state/event logic from current new/edit pages. Wire with same `useWorkoutContext` and `useExercises` hooks. New and edit pages become thin wrappers that set initial state and call save/update.
2. **List page rewrite**: Replace flat list with grid layout, search/filter bar, card component with timeline preview chips, and a floating add button on mobile — matching `OpenDesign/workout-list.html`.
3. **Component rewrites**: Each component gets a visual-only rewrite per design refs. `IntervalRow` → glass card with `border-l-4`, `drag_indicator` icon, description line, large duration input. `IntervalForm` → 4-card bento grid. `TimelineStrip` → h-4, `shadow-inner`, legend row. `IntervalDetailSheet` → Deep Nordic tokens only (structural behavior unchanged).
4. **Token sweep**: Find-and-replace all Burgundy Monochrome tokens with Deep Nordic equivalents across all modified files.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/workouts/page.tsx` | Modified | Full rewrite — grid cards, search, filters, FAB |
| `src/app/workouts/new/page.tsx` | Modified | Thin wrapper around WorkoutEditor |
| `src/app/workouts/[id]/edit/page.tsx` | Modified | Thin wrapper around WorkoutEditor |
| `src/components/WorkoutEditor.tsx` | **New** | Shared editor component (extracted from new/edit) |
| `src/components/IntervalRow.tsx` | Modified | Glass card, left border, drag icon, description |
| `src/components/IntervalForm.tsx` | Modified | Replaced by "Add Block" bento grid |
| `src/components/TimelineStrip.tsx` | Modified | Taller bar, shadow-inner, legend |
| `src/components/IntervalDetailSheet.tsx` | Modified | Token-only updates |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Shared WorkoutEditor extraction breaks new/edit flows | Low | Extract iteratively — move logic step by step, test both routes after each change |
| Token sweep misses some tokens | Medium | Visual QA against design refs; grep for all old tokens post-sweep |
| IntervalForm -> bento grid removes exercise picker for Work type | Low | Bento cards define type only; after selecting a type, the default form still allows exercise assignment via detail sheet |
| Cycle bracket CSS complex on small screens | Low | Use relative positioning with left border+top/bottom lines; collapse to label-only on mobile |

## Rollback Plan

Revert all files to current state via `git checkout` — each file is independently revertible. The shared WorkoutEditor extraction is the riskiest change; if it fails, keep new/edit pages separate and apply only token + component visual changes.

## Dependencies

- Deep Nordic tokens must already exist in `globals.css` ✓ (confirmed present)
- `interval-engine.ts` `flattenWorkout` / `FlattenedInterval` — already supports depth/cycle data for timeline

## Success Criteria

- [ ] All pages use only Deep Nordic tokens (grep for old tokens returns 0 hits in modified files)
- [ ] `WorkoutEditor` component renders correctly in both new (empty) and edit (pre-filled) modes
- [ ] Bento "Add Block" grid creates intervals of the correct type
- [ ] Cycle bracket + repeats selector visually groups intervals and repeats as specified
- [ ] Timeline strip shows segment colors with legend, correct proportional widths
