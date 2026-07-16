# Design: Workout Model V2 — Flat Interval Architecture

## Technical Approach

Replace the nested `Interval` model (children/cycleCount/setCount/restBetweenCycles/collapseTrailingRest) with a flat `Interval[]` throughout the data layer, editor, and timer engine. Cycles become a **transient creation-time helper** that expands to flat intervals on save. Data migration runs on read for existing stored workouts.

## Architecture Decisions

### Decision: Cycle Expansion Timing

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Expand on save (Screen 1 → flat) | Simpler storage, no ambiguity. User loses cycle grouping after save. | **Chosen** |
| Persist cycles, expand on read | Keeps edit symmetry but requires cycle model in storage. | Rejected — defeats simplification goal |

### Decision: CycleTemplate as Local State (not persisted)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Separate type in storage | Migration needed again, extra schema surface | **Rejected** — YAGNI |
| In-memory `CycleTemplate` interface only | Zero persistence change, lost on unmount | **Chosen** — Screen 1 is creation-only, user never returns |

### Decision: 4-Action Reducer

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep 15 actions with nested handlers | Handles cross-level DnD, wrap/unwrap | **Rejected** — no nesting to operate on |
| 4 actions: ADD, REMOVE, REORDER, CHANGE | Covers all flat operations, 1/4 the code | **Chosen** — CHANGED subsumes SHEET_SAVE, MOVE_UP/DOWN can be client-side reorder helpers |

### Decision: Migration on Read (not batch)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Batch migration on app load | Migrates all workouts at once, single mutation | **Rejected** — risk of corrupting all stored data |
| Migrate on individual read | Lazy, no risk to unaccessed workouts, simplest code | **Chosen** — `migrateWorkout()` runs inside `getWorkout()` and lazily rewrites when user accesses |

## Data Flow

```
 ┌────────────────────────────────────────────┐
 │  Screen 1 (WorkoutBuilder)                 │
 │  - CycleTemplate added as block            │
 │  - Block palette: Prepare|Work|Rest|Cycle  │
 │    |RestBetweenCycles|CoolDown             │
 │  - DnD reorder of all items                │
 │  - On Save: Cycle expansion                │
 │    Cycle(repeat=3,work=45,rest=20,         │
 │      skipLastRest=true)                    │
 │    → [work,rest,work,rest,work]            │
 └──────────────┬─────────────────────────────┘
                │ flat Interval[]
                ▼
 ┌────────────────────────────────────────────┐
 │  localStorage ('workoutapp.workouts')      │
 │  flat Interval[] only (no cycles)          │
 └──────────────┬─────────────────────────────┘
                │ on read → migrateWorkout()
                ▼
 ┌────────────────────────────────────────────┐
 │  Screen 2 (WorkoutEditor)                  │
 │  - Flat rows only                          │
 │  - No selection mode                       │
 │  - DnD simple reorder                      │
 │  - Add Block (w/ Cycle helper auto-expand) │
 │  - IntervalDetailSheet (no cycle controls) │
 └────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modify | Flat `Interval`, add `rest_between_cycles` to `IntervalType`, add transient `CycleTemplate` |
| `src/lib/workout-reducer.ts` | Rewrite | 4 actions (ADD, REMOVE, REORDER, CHANGE_CHILD → CHANGE) |
| `src/lib/interval-engine.ts` | Rewrite | `flattenWorkout` is identity, `totalDuration`/`durationAt` iterate flat |
| `src/components/WorkoutEditor.tsx` | Rewrite | No cycles, no selection mode, no cross-level DnD |
| `src/components/WorkoutBuilder.tsx` | Create | Screen 1 creation-only builder |
| `src/components/CycleGroup.tsx` | Delete | 220 lines removed |
| `src/components/IntervalRow.tsx` | Simplify | Remove selectionMode, selected, onSelect, parentIndex props |
| `src/components/IntervalDetailSheet.tsx` | Simplify | Remove cycleCount, setCount, restBetweenCycles controls + Nesting section |
| `src/lib/segment-styles.ts` | Modify | Add `rest_between_cycles` to all 5 style maps + TYPE_ICONS |
| `src/hooks/useWorkouts.ts` | Modify | Add `migrateWorkout()` in `getWorkout()`, add `saveBuilderWorkout()` |
| `src/lib/__tests__/workout-reducer.test.ts` | Rewrite | Only test the 4 remaining actions |
| `src/lib/__tests__/interval-engine.test.ts` | Rewrite | Test flat identity passthrough only (no cycle expansion) |
| `src/components/__tests__/WorkoutEditor.test.tsx` | Modify | Update for flat-only editor |
| `src/components/__tests__/CycleGroup.test.tsx` | Delete | Component deleted |

## Interfaces / Contracts

```typescript
// New IntervalType
type IntervalType = 'prepare' | 'work' | 'rest' | 'rest_between_cycles' | 'cooldown'

// Flat Interval (no children, no cycle/set fields, no isGenerated)
interface Interval {
  id: string
  type: IntervalType
  title: string
  duration: number
  description?: string
  imageUrl?: string  // external URL only
}

// Transient — creation-only, never persisted
interface CycleTemplate {
  id: string
  type: 'cycle'
  title: string
  description?: string
  repeat: number
  workDuration: number
  restDuration: number
  skipLastRest: boolean  // default true
}

// Reducer actions (4 total)
type Action =
  | { type: 'ADD_INTERVAL'; interval: Interval }
  | { type: 'REMOVE_INTERVAL'; index: number }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'CHANGE_INTERVAL'; index: number; interval: Partial<Interval> }
```

### CycleTemplate Expansion Rule

```
Cycle(repeat=N, work=W, rest=R, skipLastRest=true)
→ N times: [work(W), ...(rest(R) if not last iteration OR last child not rest)]
→ N=3, W=45, R=20, skipLastRest=true: [work(45), rest(20), work(45), rest(20), work(45)]
→ skipLastRest=false: [work(45), rest(20), work(45), rest(20), work(45), rest(20)]
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — reducer | ADD, REMOVE, REORDER, CHANGE all work as expected | Existing pattern (create state, dispatch, assert). Remove all cycle tests. |
| Unit — engine | `flattenWorkout` returns intervals as-is. `totalDuration` sums flat. `durationAt` scans linear. | 3 tests only (identity, sum, scan) |
| Unit — migration | `migrateWorkout()` converts old nested format to flat correctly. Handles edge cases (empty children, missing fields, trailing rest collapse). | JSON fixtures of old format |
| Component — WorkoutEditor | Renders flat list, adds/removes/reorders, saves flat. | RTL, mock localStorage |
| Component — WorkoutBuilder | Block palette renders, CycleTemplate expands correctly on save. | RTL, verify saved Interval[] |
| Timer integration | Timer still renders correct intervals from flat data. | Existing timer tests should pass unchanged |

## Migration / Rollout

### Migration Strategy

Migration runs **lazily on read** inside `getWorkout()`:
1. Detect old format: interval has `children` array or any of `cycleCount`/`setCount`/`restBetweenCycles`
2. Expand using `migrateWorkout()`: for each root interval, if `children` exists, expand by `cycleCount` with `restBetweenCycles` inserts and `collapseTrailingRest` omitted. If flat, passthrough.
3. The migrated workout is not written back to localStorage — only the in-memory copy is flat.
4. New saves always write flat format.

### Edge Cases in Migration

- **Empty children array** → treat as flat interval (passthrough)
- **`isGenerated: true` rest intervals** → included in flat output (existing timer depends on them as entries)
- **`collapseTrailingRest: true`** — if last child is rest AND the next root interval is rest/cooldown, omit that last rest from expansion (mirrors old engine behavior)
- **Missing `cycleCount`/`setCount`** — default to 1

### Rollout

- No feature flag needed (pure refactor, no UI changes to existing functionality)
- Can be committed as a single atomic change after verification
- Rollback: revert all changed files to previous commit. Old format is still readable by rollback code.

## Open Questions

- [ ] `CycleTemplate` in Screen 1 — should `cycle` block appear as a single draggable item in the list, or should it pop open a modal? The proposal says "block palette" — treat it as a block that expands on save.
- [ ] `Add Block` in Screen 2 — should Cycle be available as an auto-expanding helper, or omitted entirely? Proposal says "WITHOUT Cycle" but also says "(or with Cycle as helper that auto-expands)". Need alignment.
- [ ] `rest_between_cycles` icon — what Material icon best represents this? Related to `rest` but distinct for the timeline.
