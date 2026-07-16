# Proposal: Workout Model V2 — Flat Interval Architecture

## Intent

The current workout data model uses nested intervals with `children`, `cycleCount`, `setCount`, `restBetweenCycles`, and `collapseTrailingRest`. This adds complexity to every part of the system: the reducer (15+ action types), the flatten engine (DFS recursion), the editor (cross-level DnD, selection mode), and the CycleGroup component. The `collapseTrailingRest` feature is buggy and hard to reason about.

Replace nesting with a **flat `Interval[]`** model. Cycles become a transient creation-time helper that expands on save. The storage, editor, timer, and data flow all simplify dramatically.

## Scope

### In Scope
- New flat `Interval` type (no children/cycleCount/setCount/restBetweenCycles/collapseTrailingRest/isGenerated)
- New `rest_between_cycles` IntervalType added
- `Cycle` type exists only transiently during creation (not persisted)
- **Screen 1** — creation-only builder with palette of blocks (Prepare, Work, Rest, Cycle template, Rest between Cycles, Cool Down)
- **Screen 2** — flat full-detail editor (replaces current WorkoutEditor, no selection mode, no cycle nesting)
- Reducer simplified to 4 actions: ADD, REMOVE, REORDER, CHANGE
- `flattenWorkout` becomes trivial passthrough
- Delete `CycleGroup.tsx` (220 lines)
- Simplify `IntervalRow.tsx` (remove selection/cross-level props)
- Simplify `IntervalDetailSheet.tsx` (remove cycle controls)
- Data migration for existing saved workouts (old nested format → flat)
- `segment-styles.ts` gains `rest_between_cycles` entries

### Out of Scope
- Image/GIF upload system (external URLs only in MVP)
- Server-side persistence (localStorage only, unchanged)
- Undo/redo system
- Multi-workout template system
- Cycle template library (saved cycle presets)

## Capabilities

### New Capabilities
- `workout-creation-builder`: Screen 1 creation-only flow with block palette and Cycle template expansion
- `workout-data-migration`: Migration path for existing saved workouts from nested to flat format

### Modified Capabilities
- `workout-editor`: Screen 2 now shows flat intervals only — no cycles, no selection mode, no cross-level DnD. Add Block adds individual intervals (Cycle helper auto-expands)
- `interval-engine`: `flattenWorkout` becomes passthrough (no DFS, no collapsed rest). `totalDuration` and `durationAt` operate directly on flat array
- `workload-data-model`: `Interval` loses children/cycleCount/setCount/restBetweenCycles/collapseTrailingRest/isGenerated. `IntervalType` gains `rest_between_cycles`. `Cycle` type added as transient creation helper

## Approach

1. **Types first**: Rewrite `workout.ts` with flat `Interval`, add transient `Cycle` interface, add `rest_between_cycles` to `IntervalType`
2. **Screen 1** (new component `WorkoutBuilder.tsx`): Block palette, DnD, Cycle template expands on save
3. **Screen 2**: Rewrite `WorkoutEditor.tsx` — flat list, simple reducer, no CycleGroup, no selection mode
4. **Reducer**: Replace `workoutReducer.ts` with 4-action version
5. **Engine**: Simplify `interval-engine.ts` — flatten is identity, totalDuration/durationAt iterate flat
6. **Components**: Delete `CycleGroup.tsx`, simplify `IntervalRow.tsx` and `IntervalDetailSheet.tsx`
7. **Migration**: In `getWorkout()`, detect old format (has children prop) and expand cycles into flat intervals on read
8. **Segment styles**: Add `rest_between_cycles` to all style maps
9. **Tests**: Rewrite engine tests (no cycle scenarios), rewrite reducer tests (4 actions), update editor/component tests

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modified | Flat Interval, added IntervalType, transient Cycle |
| `src/lib/workout-reducer.ts` | Rewritten | 4 actions vs 15 |
| `src/lib/interval-engine.ts` | Simplified | Passthrough flatten, no cycle expansion |
| `src/lib/segment-styles.ts` | Modified | +rest_between_cycles entries |
| `src/components/WorkoutEditor.tsx` | Rewritten | No cycles, no selection mode, flat DnD |
| `src/components/WorkoutBuilder.tsx` | New | Screen 1 creation builder |
| `src/components/CycleGroup.tsx` | Deleted | 220 lines removed |
| `src/components/IntervalRow.tsx` | Simplified | Remove selection/cross-level drag props |
| `src/components/IntervalDetailSheet.tsx` | Simplified | Remove cycle/set/restBetween controls |
| `src/hooks/useWorkouts.ts` | Modified | Data migration in getWorkout |
| `openspec/specs/workout-editor/spec.md` | Modified | Major spec rewrite |
| `openspec/specs/interval-engine/spec.md` | Modified | Simplified semantics |
| `openspec/specs/workload-data-model/spec.md` | Modified | Updated type definitions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migration breaks existing saved workouts | Medium | Test migration path with real saved data; fail gracefully with fallback to empty workout |
| Timer engine depends on `FlattenedInterval` fields (depth, cycleIndex, setIndex) | Low | Timer already iterates flat array; those fields are unused by playback |
| Users lose cycle grouping after edit | Medium | Screen 1 preserves cycles as templates; Screen 2 warns "Cycles will expand on save" |

## Rollback Plan

Revert `src/types/workout.ts`, `src/lib/workout-reducer.ts`, `src/lib/interval-engine.ts`, all changed components, and `src/hooks/useWorkouts.ts` to the previous commit. No DB migration needed (localStorage old format is read-only preserved by migration code). If migration has already rewritten stored workouts, restore from git-history copy.

## Dependencies

- None — pure frontend refactor, no dependency changes

## Success Criteria

- [ ] All existing interval playback timer tests pass with flat model
- [ ] Screen 1 creation flow produces correct flat `Interval[]` output
- [ ] Migration path correctly expands old nested workouts into flat format
- [ ] Reducer handles ADD/REMOVE/REORDER/CHANGE without errors
- [ ] CycleGroup.tsx deleted, no dead code remains
- [ ] All component tests pass (updated for new interfaces)
