# Tasks: Workout Model V2 — Flat Interval Architecture

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | 1800–2200 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 5 stacked PRs to main |
| Delivery strategy | auto-chain (force-chained) |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + migration logic | PR 1 | Foundation, no deps |
| 2 | Engine + reducer | PR 2 | Depends on PR 1 (types) |
| 3 | WorkoutBuilder (Screen 1) | PR 3 | Depends on PR 1 + PR 2 |
| 4 | WorkoutEditor rewrite + cleanup | PR 4 | Depends on PR 1, 2, 3 |
| 5 | Test finalization | PR 5 | Depends on PR 2, 4 |

## Phase 1: Foundation — Types + Migration (PR 1, ~160 lines)

- [x] 1.1 Rewrite `src/types/workout.ts` — add `rest_between_cycles` to IntervalType, remove nested fields (children, cycleCount, setCount, restBetweenCycles, collapseTrailingRest, isGenerated), add transient `CycleTemplate` interface
- [x] 1.2 Add `migrateWorkout()` to `src/lib/migration.ts` — detect old nested format by `children` presence, expand cycles into flat Interval[], strip deprecated fields, call on read in `getWorkout()` via `useWorkouts.ts`
- [x] 1.3 Create `src/lib/__tests__/migration.test.ts` — test old-format expansion, collapseTrailingRest behavior, passthrough for flat data, malformed fallback
- [x] 1.4 Update `openspec/specs/workload-data-model/spec.md` with DM-17, DM-18, modified DM-1, DM-2

## Phase 2: Core — Engine + Reducer (PR 2, ~380 lines)

- [x] 2.1 Simplify `src/lib/interval-engine.ts` — `flattenWorkout` returns `workout.intervals` as identity, `totalDuration`/`durationAt` iterate flat array, delete cycle expansion DFS and collapseTrailingRest logic
- [x] 2.2 Rewrite `src/lib/workout-reducer.ts` — 4 actions: ADD_INTERVAL, REMOVE_INTERVAL, REORDER, CHANGE_INTERVAL (CHANGE subsumes SHEET_SAVE, REORDER subsumes MOVE_UP/DOWN)
- [x] 2.3 Update `interval-engine.test.ts` — remove cycle/set/rest scenarios, add identity passthrough test
- [x] 2.4 Update `workout-reducer.test.ts` — rewrite for 4 actions (one test per action), remove 15-action scenarios
- [x] 2.5 Update `openspec/specs/interval-engine/spec.md` with IE-1 passthrough semantics, remove cycle scenarios

## Phase 3: Screen 1 — WorkoutBuilder (PR 3, ~250 lines)

- [x] 3.1 Create `src/components/WorkoutBuilder.tsx` — block palette (6 types: prepare, work, rest, rest_between_cycles, cycle, cooldown), DnD reorder, CycleTemplate UI (repeat ×1–×10, workDuration, restDuration, skipLastRest), expansion on save producing flat Interval[]
- [x] 3.2 Update `src/lib/segment-styles.ts` — change `rest_between_cycles` icon from `pause_circle` to `hourglass_bottom` for visual distinction
- [x] 3.3 Create `WorkoutBuilder.test.tsx` — block palette renders 6 types, add block appends interval, cycle template expands correctly on save, DnD reorder

## Phase 4: Screen 2 — Editor Rewrite + Cleanup (PR 4, ~600 lines ⚠️ size:exception)

- [x] 4.1 Rewrite `src/components/WorkoutEditor.tsx` — flat Interval[] list, 5-type Add Block grid (no Cycle), 4-action reducer wiring, no selection mode, no cross-level DnD, no cycle grouping
- [x] 4.2 Delete `src/components/CycleGroup.tsx` — 220 lines removed ✅
- [x] 4.3 Delete `src/components/__tests__/CycleGroup.test.tsx` — 312 lines removed ✅
- [x] 4.4 Simplify `src/components/IntervalRow.tsx` — remove `selectionMode`, `selected`, `onSelect`, `parentIndex` props
- [x] 4.5 Simplify `src/components/IntervalDetailSheet.tsx` — remove cycleCount/setCount/restBetweenCycles controls, add imageUrl field
- [x] 4.6 Update `IntervalRow.test.tsx` — remove selection/cycle test cases
- [x] 4.7 Rewrite `WorkoutEditor.test.tsx` — flat-only editor behavior, 5 Add Block types, DnD reorder, save

## Phase 5: Test Finalization (PR 5, ~250 lines)

- [x] 5.1 Harden `workout-reducer.test.ts` — 10 new tests: REMOVE first/last, REORDER backward + out-of-bounds, CHANGE title + multiple fields + negative index. Total: 18 tests, 4-action edge case coverage complete.
- [x] 5.2 Harden `interval-engine.test.ts` — added single-interval identity test. Total: 8 tests, identity flatten covered for empty/single/multiple.
- [x] 5.3 Dead exports scan — no dead exports found. All old types/reducer constants already removed in Phases 1-4. migration.ts references are legitimate (reading old format).
- [x] 5.4 Final review pass — 246 tests pass, tsc 0 errors, build succeeds (13 routes).

## Dependency Diagram

```
PR 1 (Types + Migration)
 └─ PR 2 (Engine + Reducer)  ← needs types
     └─ PR 3 (WorkoutBuilder) ← needs types + reducer
         └─ PR 4 (Editor Rewrite) ← needs everything above
             └─ PR 5 (Test Finalization) ← waits for PR 2 + PR 4
```

Each PR stacks to main. PR N merges before PR N+1 is reviewed to keep diffs clean.
