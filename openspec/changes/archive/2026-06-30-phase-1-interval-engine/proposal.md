# Proposal: Phase 1 — Interval Engine

## Intent

Workouts are flat interval lists — no cycles, no nesting. This change adds the data model and pure logic for non-linear structures (sets, circuits) without building their full UI yet. Foundation for circuit/superset phases.

## Scope

### In Scope
- Data model: `children`, `cycleCount`, `setCount` on `Interval`
- Interval engine: pure functions (flatten, total duration, locate by elapsed)
- Bottom-sheet modal for interval detail editing (confirmed default)
- Timeline strip in editor only (confirmed default)
- Silent migration: defaults on read (`children: undefined`, `cycleCount: 1`, `setCount: 1`) (confirmed default)

### Out of Scope
- Timeline on timer (keeps simple ProgressBar — confirmed default)
- Circuit/superset UI (adding child intervals in editor — later phase)
- Batch edit, multi-select, drag-and-drop
- External dependencies

## Capabilities

### New
- `interval-engine`: flatten nested intervals to linear sequence, compute total duration, locate active interval by elapsed time — consumed by timer and editor

### Modified
- `workload-data-model`: `Interval` gains optional `children`, `cycleCount`, `setCount`
- `workout-editor`: detail editing moves to bottom-sheet; editor gains timeline preview

## Approach

Add optional fields to `Interval`. Pure functions in `src/lib/interval-engine.ts`: DFS flatten with cycle repetition, total duration, active-interval lookup. Timer receives flattened array once at start — no per-tick expansion. Editor gets `<TimelineStrip>` and `<IntervalDetailSheet>` using native `<dialog>` + CSS slide-up. Migration: getter in data access layer fills defaults on read — no destructive migration runs.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modified | `children?`, `cycleCount?`, `setCount?` on `Interval` |
| `src/lib/interval-engine.ts` | New | Pure flatten/navigate functions |
| `src/components/IntervalDetailSheet.tsx` | New | Bottom-sheet modal |
| `src/components/TimelineStrip.tsx` | New | Editor timeline |
| `src/hooks/useTimer.ts` | Modified | Accept flat array from engine |
| `src/hooks/useWorkouts.ts` | Modified | Migration layer on read |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bottom-sheet feels off on mobile | Low | Native `<dialog>`, CSS slide-up, accessible |
| Migration misses edge-case data | Low | Defaults are safe — no data loss possible |
| DFS perf on large workouts | Low | Realistic max is 200 intervals; flat is O(n) |

## Rollback Plan

Revert `types/workout.ts`. Delete new files. Old localStorage data is untouched — no destructive migration runs. Existing workouts are forward-compatible.

## Dependencies

None. Zero new dependencies. Pure TypeScript.

## Success Criteria

- [ ] Engine passes: flat+cycle expansion, nested DFS, empty input, single interval
- [ ] Bottom-sheet opens/closes with slide animation on mobile + desktop
- [ ] Timeline renders 1–50 intervals without overflow on editor page
- [ ] Old workouts from localStorage load without errors — defaults applied silently
- [ ] Timer shows correct intervals for flat workouts (backward compatible)
