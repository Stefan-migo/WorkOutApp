# SDD Tasks: Workout Cycle Editor

**Change**: workout-cycle-editor
**Mode**: Strict TDD
**Delivery**: auto-forecast, stacked-to-main, review budget 400 lines

---

## PR 1: Reducer Actions — `WRAP_SELECTION_IN_CYCLE`, `UNWRAP_CYCLE`, `MOVE_INTO_CYCLE`, `MOVE_FROM_CYCLE`

**Depends on**: None
**Goal**: Replace hardcoded `WRAP_IN_CYCLE` with selection-based wrap and three new cycle lifecycle actions. All tests pass before any UI change.

---

### Task 1.1 — RED: Test new reducer actions ✅

**Type**: RED
**File**: MOD `src/lib/__tests__/workout-reducer.test.ts`
**Lines changed**: ~55
**Boundary**: Write **failing** tests for all four actions before any implementation code:

**`WRAP_SELECTION_IN_CYCLE(selectedIndices)`** (replaces `WRAP_IN_CYCLE`):
- 3 intervals, selects `[1, 2]` → cycle at index 1 with intervals 1,2 as children, interval 0 stays
- 4 intervals, selects `[0, 3]` — non-contiguous → cycle at index 0 with intervals 0 and 3 as children (min index wins), the two non-selected intervals shift
- `[]` selection → no-op (same state returned)
- `[0]` single selection → no-op
- Selected last indices (e.g. `[2, 3]` of 4) → cycle at index 2, children in order
- Selected indices in reverse order `[3, 1]` → cycle at min index (1), children in original flat order
- `WRAP_IN_CYCLE` test removed (action removed from union)

**`UNWRAP_CYCLE(index)`**:
- Cycle with 3 children at index 1 in 3-interval array → cycle removed, 3 children spliced at index 1, array length increases by 2
- Cycle with 1 child → child becomes root at same index, cycle removed
- Cycle at index 0 (first position) → children inserted from index 0 onward
- Cycle at last position → children appended at end

**`MOVE_INTO_CYCLE(fromIndex, parentIndex)`**:
- Root index 0 moved into cycle at index 2 → interval removed from root, appended to cycle's children
- Target cycle has no children yet (`children: undefined`) → children array created with moved interval
- Self-drop (`fromIndex === parentIndex`) → no-op
- `fromIndex` is after `parentIndex` → correctly adjusts for splice offset (removing fromIndex after parentIndex means fromIndex shifts by -1)

**`MOVE_FROM_CYCLE(childIndex, parentIndex, toIndex)`**:
- Cycle with 3 children at index 2, move child index 1 to root index 5 (after the cycle) → child removed from children, inserted at root position 5
- Cycle with 3 children at index 2, move child index 0 to root index 0 (before the cycle) → child removed, inserted at root position 0
- Cycle with exactly 2 children, remove one → cycle stays with remaining 1 child (`children` array shrinks to 1 element)
- Cycle with exactly 1 child → cycle removed, child becomes root at `toIndex`
- `MOVE_FROM_CYCLE` where `toIndex` is before the cycle → correctly accounts for cycle position shift after child removal

---

### Task 1.2 — GREEN: Implement four new reducer actions ✅

**Type**: GREEN
**File**: MOD `src/lib/workout-reducer.ts`
**Lines changed**: ~55
**Boundary**:

**Remove**:
- `WRAP_IN_CYCLE` from the `Action` type union
- `WRAP_IN_CYCLE` case block

**Add to `Action` type**:
```ts
| { type: 'WRAP_SELECTION_IN_CYCLE'; selectedIndices: number[] }
| { type: 'UNWRAP_CYCLE'; index: number }
| { type: 'MOVE_INTO_CYCLE'; fromIndex: number; parentIndex: number }
| { type: 'MOVE_FROM_CYCLE'; childIndex: number; parentIndex: number; toIndex: number }
```

**`WRAP_SELECTION_IN_CYCLE` case**:
- Guard: if `selectedIndices.length < 2` → return state
- Sort indices ascending, extract intervals at those positions
- Compute min index from selectedIndices
- Count how many selected items are before each non-selected item to compute correct index offset
- Build cycle: `{ id: intervalId(), type: 'work', title: 'Block', duration: 0, children: [...extracted], cycleCount: 4 }`
- Splice out selected intervals (in reverse order to preserve indices), insert cycle at min index
- **Ponytail**: Sorted indices + splice in reverse order. No complex diff logic needed until 3+ selection edge cases prove it insufficient.

**`UNWRAP_CYCLE` case**:
- Guard: if target has no `children` → return state
- Splice target out, spread children at that position
- **Ponytail**: `splice` handles the replacement atomically.

**`MOVE_INTO_CYCLE` case**:
- Guard: `fromIndex === parentIndex` → no-op
- Remove interval at `fromIndex` from root array
- Guard: if removed is undefined → return state
- Account for splice offset: if `fromIndex < parentIndex`, the removal shifts parentIndex by -1
- Push removed interval into cycle's children array (init children as `[]` if undefined)
- **Ponytail**: One splice + one push. No new helpers.

**`MOVE_FROM_CYCLE` case**:
- Read parent at `parentIndex`, guard if no `children`
- Remove child at `childIndex` from children
- Determine cycle's position in root array
- Account for offset: if `toIndex > cycleIndex`, subtract 1 because we're removing the cycle-or its remaining children
- Splice saved child into root at `toIndex`
- If cycle's children is now empty → remove cycle entirely, child takes cycle's position
- If cycle still has children → keep cycle with remaining children, insert child at `toIndex`
- **Ponytail**: Single splice for insertion, conditional removal of empty cycle. Edge cases handled by offset logic.

---

### Task 1.3 — VERIFY: Run tests ✅

**Type**: VERIFY
**Lines changed**: 0
**Boundary**:
- `npx vitest run` — all tests pass
- `npx tsc --noEmit` — zero type errors
- Confirm old `WRAP_IN_CYCLE` case no longer compiles if referenced anywhere

**Estimated PR 1 total**: ~110 lines

---

## PR 2: CycleGroup UI — Inline Title Edit, Unwrap, Add Child

**Depends on**: PR 1 (`UNWRAP_CYCLE` action exists)
**Goal**: Cycle header gains inline title editing (match workout title pattern), unwrap icon, and add-child button. Component stays self-contained; DnD props stubbed for later.

---

### Task 2.1 — RED: Test CycleGroup new interactions ✅

**Type**: RED
**File**: NEW `src/components/__tests__/CycleGroup.test.tsx`
**Lines changed**: ~35
**Boundary**: Write **failing** tests for component interactions:

- Renders cycle title with "Cycle" suffix (e.g., "Block Cycle")
- Clicking title text switches to editable `<input>` pre-filled with current title
- Pressing Enter in title input calls `onTitleChange(index, newTitle)`
- Pressing Escape reverts to original title without calling callback
- Unwrap icon button renders with correct aria-label
- Clicking unwrap icon calls `onUnwrap(index)`
- Add-child "+" button renders in footer area
- Clicking add-child calls `onAddChild(index)`
- **Ponytail**: Test the callback contract, not DOM structure. Use `vitest` + `@testing-library/react` if available, else plain render + click assertions.

---

### Task 2.2 — GREEN: CycleGroup new features ✅

**Type**: GREEN
**File**: MOD `src/components/CycleGroup.tsx`
**Lines changed**: ~55
**Boundary**:

**Props added**:
```ts
onUnwrap: (index: number) => void
onTitleChange: (index: number, title: string) => void
onAddChild: (index: number) => void
```

**Inline title edit** (matches WE-26 spec — same pattern as workout title):
- State: `isEditing: boolean` (local useState)
- Click title text → `setIsEditing(true)`, input auto-focuses (useRef + useEffect)
- Input: transparent bg, `border-b-2 border-outline-variant`, same typography as header title
- Enter → call `onTitleChange(index, value)`, `setIsEditing(false)`
- Escape → `setIsEditing(false)`, revert to `props.interval.title`
- Blur → same as Enter (save on blur)
- **Ponytail**: Local `useState` for edit mode. No controlled input for the title itself — the parent owns the canonical value.

**Unwrap icon**:
- `<button>` with `<span class="material-symbols-outlined">unfold_less</span>` in header, right side near repeats selector
- `onClick={() => onUnwrap(index)}`
- aria-label: "Unwrap cycle"

**Add-child footer button**:
- "+" icon button below the children list (still inside the bracket area, above the bracket bottom)
- `onClick={() => onAddChild(index)}`
- Styling: dashed border, `text-outline-variant`, hover → `text-primary`
- aria-label: "Add interval to cycle"

**Visual structure after changes**:
```
┌─ bracket ──────────────────────────┐
│  [title click→edit]  [Total: 01:30]  [unfold_less]  Repeats: [x4▾] │
│  ┌─ child interval 1 ────────────┐ │
│  └──────────────────────────────┘ │
│  ┌─ child interval 2 ────────────┐ │
│  └──────────────────────────────┘ │
│  [+ Add to Cycle]                 │
└───────────────────────────────────┘
```

---

### Task 2.3 — GREEN: Wire CycleGroup callbacks in WorkoutEditor ✅

**Type**: GREEN
**File**: MOD `src/components/WorkoutEditor.tsx`
**Lines changed**: ~25
**Boundary**:

Add handlers:
```ts
function handleUnwrap(index: number) {
  markDirty()
  dispatch({ type: 'UNWRAP_CYCLE', index })
}

function handleTitleChange(index: number, title: string) {
  markDirty()
  const interval = intervals[index]
  if (!interval) return
  dispatch({ type: 'CHANGE_INTERVAL', index, interval: { ...interval, title } })
}

function handleAddChild(index: number) {
  markDirty()
  const interval = intervals[index]
  if (!interval) return
  const newChild: Interval = {
    id: intervalId(),
    type: 'work',
    title: 'Work',
    duration: 30,
  }
  const children = [...(interval.children ?? []), newChild]
  dispatch({ type: 'CHANGE_INTERVAL', index, interval: { ...interval, children } })
}
```

Pass new callbacks to `<CycleGroup>`:
```tsx
<CycleGroup
  ...
  onUnwrap={handleUnwrap}
  onTitleChange={handleTitleChange}
  onAddChild={handleAddChild}
/>
```

**Note**: `intervalId()` already exists in WorkoutEditor.tsx for root intervals — this reuses the same counter. Collisions won't happen since IDs are runtime-only and ephemeral.

---

### Task 2.4 — VERIFY ✅

**Type**: VERIFY
**Lines changed**: 0
**Boundary**:
- `npx vitest run` — all tests pass
- `npx tsc --noEmit` — zero errors
- Manual: click cycle title → edit, unwrap icon dispatches action, add-child creates interval

**Estimated PR 2 total**: ~115 lines

---

## PR 3: Selection Mode — Toggle, Checkboxes, `WRAP_SELECTION_IN_CYCLE` Button

**Depends on**: PR 1 (`WRAP_SELECTION_IN_CYCLE` action exists)
**Goal**: Replace old one-button "Wrap in Cycle" with selection-mode UX: toggle to enter selection mode, checkboxes per interval, "Wrap N Selected" button.

---

### Task 3.1 — RED: Test IntervalRow checkbox rendering

**Type**: RED
**File**: NEW `src/components/__tests__/IntervalRow.test.tsx`
**Lines changed**: ~20
**Boundary**: Write **failing** tests:

- Renders checkbox input when `selectionMode={true}`
- Checkbox is checked when `selected={true}`
- `onSelect(index)` called when checkbox is clicked
- Does NOT render checkbox when `selectionMode` is false or undefined (existing behavior unchanged)
- Drag indicator hidden when `selectionMode` is true

---

### Task 3.2 — GREEN: IntervalRow selection mode props

**Type**: GREEN
**File**: MOD `src/components/IntervalRow.tsx`
**Lines changed**: ~25
**Boundary**:

**Props added**:
```ts
selectionMode?: boolean
selected?: boolean
onSelect?: (index: number) => void
```

**When `selectionMode` is true**:
- Before the drag handle (leftmost): render checkbox `<input type="checkbox" checked={selected} onChange={() => onSelect?.(index)} />`
- Drag handle container hidden (add `hidden` class or conditional render)
- The entire row is clickable (consider pointer-events on checkbox area or wrapping div click)

**When `selectionMode` is false/undefined**:
- No checkbox, drag handle visible — zero change from current behavior

**Ponytail**: Plain `<input type="checkbox">`, zero JS checkbox component. `sr-only` label for accessibility.

---

### Task 3.3 — GREEN: Selection mode state and UI in WorkoutEditor

**Type**: GREEN
**File**: MOD `src/components/WorkoutEditor.tsx`
**Lines changed**: ~45
**Boundary**:

**State additions** (local useState — per design decision, selection is transient UI not store):
```ts
const [selectionMode, setSelectionMode] = useState(false)
const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
```

**Selection toggle button** — placed near Add Block grid area:
- `<button>` with `data_object` icon + "Select" label
- On click: `setSelectionMode(!selectionMode)`, `setSelectedIndices(new Set())`
- Active state: `bg-primary-container text-on-primary` when selectionMode is true
- Exit selection mode on Escape key (window event listener)

**Interval mapping update** — in the render loop where IntervalRow is created:
```tsx
<IntervalRow
  ...
  selectionMode={selectionMode}
  selected={selectedIndices.has(i)}
  onSelect={(idx) => {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx) else next.add(idx)
      return next
    })
  }}
/>
```

**"Wrap N Selected" button** — replaces old "Wrap in Cycle" button:
- Renders below Add Block grid (same position as old button)
- Text: `Wrap {selectedIndices.size} Selected` (pluralizes)
- Disabled when `selectedIndices.size < 2` or `!selectionMode`
- On click: `dispatch({ type: 'WRAP_SELECTION_IN_CYCLE', selectedIndices: Array.from(selectedIndices).sort() })`, then `setSelectionMode(false)`, `setSelectedIndices(new Set())`
- Remove old `handleWrapInCycle` and its JSX `<button>` entirely

**DnD auto-exit hook** (stub for now, full connection in PR 4):
- In `handleDragStart`: if `selectionMode` is true, `setSelectionMode(false)`, `setSelectedIndices(new Set())`
- This ensures WE-23c scenario (selection exits on drag)

---

### Task 3.4 — VERIFY

**Type**: VERIFY
**Lines changed**: 0
**Boundary**:
- `npx vitest run` — all tests pass
- `npx tsc --noEmit` — zero errors
- Manual: toggle selection mode, check 2+ intervals, wrap fires correctly
- Confirm old "Wrap in Cycle" button no longer renders
- Verify selection mode exits on drag start

**Estimated PR 3 total**: ~90 lines

---

## PR 4: Cross-level DnD — Root → Cycle, Child → Root

**Depends on**: PR 1 (`MOVE_INTO_CYCLE`, `MOVE_FROM_CYCLE` actions), PR 2 (CycleGroup component wired), PR 3 (selection mode auto-exit)
**Goal**: Drag a root interval onto a CycleGroup to add it as a child; drag a child interval out of a CycleGroup to restore it as a root interval at the drop position. Visual drop zone indicators.

---

### Task 4.1 — RED: Test DnD edge cases (reducer already covered)

**Type**: RED
**File**: MOD `src/lib/__tests__/workout-reducer.test.ts`
**Lines changed**: ~10
**Boundary**: Add failing tests for DnD-specific edge cases not yet covered in PR 1:

- `MOVE_FROM_CYCLE` where child is the only child → cycle is deleted, child becomes root (WE-29b) — *verify this was covered in PR 1, add if missing*
- `MOVE_FROM_CYCLE` where `toIndex` equals the cycle's index → child goes exactly where the cycle was (edge: after removing the cycle or after removing the child with remaining children?)
- `MOVE_INTO_CYCLE` where target cycle is at index 0 → first root interval moves into first item

**Ponytail**: If all DnD reducer paths are already covered by PR 1, add minimal tests for any missing edge. The DnD interaction logic (dragStart → drop) is UI-level and tested manually.

---

### Task 4.2 — GREEN: `DragState` type and WorkoutEditor DnD refactor

**Type**: GREEN
**File**: MOD `src/components/WorkoutEditor.tsx`
**Lines changed**: ~40
**Boundary**:

**Add `DragState` type** (local to file, or in a types file if it grows):
```ts
type DragState = { from: number; parentIndex?: number } | null
```

**Replace `dragIndex: number | null`** with `dragState: DragState`:
- `const [dragState, setDragState] = useState<DragState>(null)`

**Update handlers**:
```ts
// Root drag (called by IntervalRow)
function handleDragStart(i: number) {
  if (selectionMode) { setSelectionMode(false); setSelectedIndices(new Set()) }
  setDragState({ from: i })
}

// Child drag (called by IntervalRow inside CycleGroup)
function handleChildDragStart(childIndex: number, parentIndex: number) {
  if (selectionMode) { setSelectionMode(false); setSelectedIndices(new Set()) }
  setDragState({ from: childIndex, parentIndex })
}

// Drag over — only for root-to-root reorder
function handleDragOver(e: React.DragEvent, i: number) {
  if (!dragState || dragState.parentIndex !== undefined) return
  if (dragState.from === i) return
  e.preventDefault()
}

// Drop — route based on dragState
function handleDrop(i: number) {
  if (!dragState || dragState.from === i) return
  markDirty()
  if (dragState.parentIndex === undefined) {
    // Root → root: REORDER
    dispatch({ type: 'REORDER', fromIndex: dragState.from, toIndex: i })
  } else {
    // Child → root: MOVE_FROM_CYCLE
    dispatch({
      type: 'MOVE_FROM_CYCLE',
      childIndex: dragState.from,
      parentIndex: dragState.parentIndex,
      toIndex: i,
    })
  }
  setDragState(null)
}

// Cycle drop target: root → cycle
function handleCycleDrop(parentIndex: number) {
  if (!dragState || dragState.parentIndex !== undefined) return // only root → cycle
  markDirty()
  dispatch({
    type: 'MOVE_INTO_CYCLE',
    fromIndex: dragState.from,
    parentIndex,
  })
  setDragState(null)
}

function handleDragEnd() {
  setDragState(null)
}
```

**Pass dragState/handlers to children**:
- Root IntervalRow: `dragIndex={dragState?.from}` still works (keyed by from)
- CycleGroup gets new props: `dragState`, `onCycleDrop={handleCycleDrop}`, `onChildDragStart={handleChildDragStart}`
- Root IntervalRow keeps existing `onDragStart={handleDragStart}`

**Update existing references**:
- Any code checking `dragIndex !== null` → `dragState !== null`
- Any code checking `dragIndex === i` → `dragState?.from === i && dragState.parentIndex === undefined` (only root drags show visual feedback for root intervals)

---

### Task 4.3 — GREEN: CycleGroup as drop target

**Type**: GREEN
**File**: MOD `src/components/CycleGroup.tsx`
**Lines changed**: ~30
**Boundary**:

**Props added**:
```ts
dragState?: DragState | null
onCycleDrop?: (parentIndex: number) => void
onChildDragStart?: (childIndex: number, parentIndex: number) => void
```

**Outer wrapper DnD handlers**:
```tsx
<div
  onDragOver={(e) => {
    // Only accept root → cycle drops
    if (dragState?.parentIndex === undefined) {
      e.preventDefault()
      // Visual feedback: set local state for hover indicator
    }
  }}
  onDragLeave={() => {/* remove hover indicator */}}
  onDrop={() => onCycleDrop?.(index)}
>
```

**Visual drop target indicator**:
- Local state `isDragOver: boolean` — set to true when valid drag hovers, false on leave/drop
- When `isDragOver`: add Tailwind classes `ring-2 ring-secondary bg-secondary/5` to the outer div
- Only activate when `dragState.parentIndex === undefined` (root interval drag)

**Pass `parentIndex` to child IntervalRow components**:
```tsx
<IntervalRow
  ...
  parentIndex={index}
  onDragStart={onChildDragStart}
/>
```

Also pass through any DnD props the IntervalRow needs: `dragState`, `onDragOver`, `onDrop`, `onDragEnd`.

**Ponytail**: HTML5 `onDragOver`/`onDrop` on the CycleGroup div, no DnZ/DnD library. The `parentIndex` discriminator on `dragState` replaces the need for a separate child-drag tracker.

---

### Task 4.4 — GREEN: IntervalRow child drag with parent context

**Type**: GREEN
**File**: MOD `src/components/IntervalRow.tsx`
**Lines changed**: ~15
**Boundary**:

**Props added**:
```ts
parentIndex?: number
```

**Update `onDragStart` call**:
- When `parentIndex !== undefined`: call `onDragStart(index, parentIndex)`
- When `parentIndex === undefined`: call `onDragStart(index)` (existing behavior)

The `onDragStart` prop type signature changes to accept the second parameter:
```ts
onDragStart?: (i: number, parentIndex?: number) => void
```

**No other changes to IntervalRow for DnD** — the existing draggable, onDragOver, onDrop, onDragEnd handlers work the same way. The drop target is the parent CycleGroup, not the IntervalRow itself.

**Ponytail**: One optional prop, one conditional in the drag start handler. Minimal change.

---

### Task 4.5 — GREEN: Drop zone indicators

**Type**: GREEN
**Files**: MOD `src/components/WorkoutEditor.tsx`
**Lines changed**: ~20
**Boundary**:

**When dragging a child out of a cycle** (`dragState?.parentIndex !== undefined`):
- Render a visual drop zone at the bottom of the root interval list
- Styled as a dashed-border empty row with `border-dashed border-2 border-outline-variant/30 rounded-lg p-16 text-center text-on-surface-variant text-sm`
- Text: "Drop here to move out of cycle"
- Has its own `onDragOver` (prevents default to allow drop) and `onDrop` handler that dispatches `MOVE_FROM_CYCLE` with `toIndex = intervals.length` (append at end)

**When dragging a root interval** (`dragState?.parentIndex === undefined`):
- No drop zone needed — the existing root interval drop targets (IntervalRow and inter-row gaps) handle drops
- Add a drop zone BETWEEN root intervals as subtle full-width gap that accepts drops — or rely on the existing `handleDrop(i)` on each IntervalRow

**Ponytail**: One extra div conditionally rendered. CSS-only styling. No animation.

---

### Task 4.6 — VERIFY

**Type**: VERIFY
**Lines changed**: 0
**Boundary**:
- `npx vitest run` — all tests pass
- `npx tsc --noEmit` — zero type errors
- Manual test all DnD flows:
  - Root → Cycle: drag 1st interval onto CycleGroup → becomes last child
  - Child → Root: drag child to root position 0 → becomes first root interval
  - Last child out → cycle removed
  - Invalid drop: child → CycleGroup → no state change
  - Root → Root: existing REORDER still works (regression)
- Confirm selection mode auto-exits when drag starts
- Confirm drop zone indicator appears during child drag-out

**Estimated PR 4 total**: ~115 lines

---

## PR Delivery Plan

| PR | Tasks | Est. Lines (gross) | Chain Base | Description |
|----|-------|-------------------|------------|-------------|
| 1 | 1.1 → 1.3 | ~110 | `main` | Reducer actions + unit tests |
| 2 | 2.1 → 2.4 | ~115 | `main` (after PR 1) | CycleGroup UI: title edit, unwrap, add-child |
| 3 | 3.1 → 3.4 | ~90 | `main` (after PR 1) | Selection mode: toggle, checkboxes, wrap button |
| 4 | 4.1 → 4.6 | ~115 | `main` (after PRs 2+3) | Cross-level DnD: root↔cycle drag |
| **Total** | **14 tasks** | **~430** | — | 4 PRs stacked-to-main |

**Execution order**: PR 1 → PR 2 + PR 3 (parallel after PR 1) → PR 4 (after both)

**Note on parallelism**: PR 2 and PR 3 can be developed simultaneously after PR 1 merges, since:
- PR 2 modifies `CycleGroup.tsx` (not touched by PR 3)
- PR 3 modifies `IntervalRow.tsx` and `WorkoutEditor.tsx` (CycleGroup untouched)
- PR 4 depends on both because it modifies all three UI files and needs the CycleGroup DnD hooks plus selection mode auto-exit

If parallel is not desired, execute as: PR 1 → PR 2 → PR 3 → PR 4 (fully sequential, ~4 days at 1 PR/day).

---

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| **Estimated total changed lines** | ~430 (gross: new + modified, excluding deletions) |
| **400-line budget risk** | **LOW** — each PR is well under 400 lines; aggregate 30-line overshoot is marginal |
| **Chained PRs recommended** | **Yes** — 4 PRs stacked-to-main, each <120 lines for focused review |
| **Largest single PR** | PR 2 at ~115 lines (CycleGroup UI + tests) |
| **Lowest risk PR** | PR 1 at ~110 lines (pure reducer logic, full test coverage, no UI) |
| **Reducer/UI overlap risk** | Low — PR 1 is pure logic; PRs 2–4 are UI-driven and depend on PR 1's interface |
| **Merge conflict risk** | Medium — PRs 2, 3, 4 all modify `WorkoutEditor.tsx`. Stacked-to-main mitigates this since each merges before the next starts. PR 4 also modifies `CycleGroup.tsx` and `IntervalRow.tsx`, which PR 2 and PR 3 touch. **Recommend sequential execution** (not parallel) to avoid merge conflicts. |

## Key Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `MOVE_FROM_CYCLE` offset arithmetic wrong when cycle is at index 0 or `toIndex` is before the cycle | Low | Test all boundary positions in RED tests (PR 1) — first, last, before, after |
| Selection mode conflicts with existing input focus (typing in title input when checkbox appears) | Low | Selection mode sets `selectionMode` state which conditionally renders checkbox; inputs keep their state. Test manually in PR 3 Verify. |
| CycleGroup DnD drop target receives drops from child intervals | Low | `handleCycleDrop` guards: only proceeds when `dragState.parentIndex === undefined`. Child drags have `dragState.parentIndex` set → ignored. |
| Old `WRAP_IN_CYCLE` test removal forgotten | Low | PR 1 Verify step explicitly names it. `npx vitest run` will fail if the old test references the removed action. |
