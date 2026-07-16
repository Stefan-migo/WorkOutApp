# Design: Workout Cycle Editor

## Technical Approach

Four new reducer actions replace the hardcoded `WRAP_IN_CYCLE`; HTML5 DnD extended with a `DragState` discriminator for cross-level moves; selection mode as transient UI state in `WorkoutEditor`; existing `CycleGroup` gains DnD drop target, unwrap, title edit, and add-child.

## Architecture Decisions

### Decision: Single `DragState` union over separate trackers

| Option | Tradeoff |
|--------|----------|
| `DragState = { from: number; parentIndex?: number } \| null` | + Fits existing `dragIndex` pattern, + one source of truth, - all handlers switch on parentIndex |
| Separate `dragChildParent` + `dragIndex` | - Two sources of truth, - race conditions |

**Choice**: `DragState`. `parentIndex` undefined = root interval, set = child inside that parent.
**Rationale**: One field replaces two, handlers discriminate on `parentIndex`. Zero new dependencies.

### Decision: Selection mode as local component state

**Choice**: `selectionMode: boolean` + `selectedIndices: Set<number>` in WorkoutEditor.
**Alternatives**: Store in reducer. **Rejected** — selection is transient UI state, not workout data.
**Rationale**: Ponytail — local state, no reducer churn.

### Decision: Keep HTML5 DnD, no library

**Choice**: Extend existing native DnD with `DragState`.
**Alternatives**: dnd-kit, react-beautiful-dnd. **Rejected** — cross-level moves only need a discriminator type.
**Rationale**: Zero new dependencies, same pattern.

## Data Flow

```
WorkoutEditor (dragState, selectionMode, selectedIndices)
   |          \           /
root IntervalRow  CycleGroup (drop target, unwrap, title edit, add-child)
   |          /           \
   dispatch → workoutReducer
   WRAP_SELECTION_IN_CYCLE | UNWRAP_CYCLE |
   MOVE_INTO_CYCLE | MOVE_FROM_CYCLE | REORDER
```

**Drag flow**:
1. IntervalRow calls `onDragStart(index, parentIndex?)` → sets `dragState`
2. Target `onDragOver(e)` → `e.preventDefault()`
3. Target `onDrop` → WorkoutEditor reads `dragState`:
   - root→root: `REORDER(from, to)`
   - root→CycleGroup: `MOVE_INTO_CYCLE(from, parentIndex)`
   - child→root: `MOVE_FROM_CYCLE(child, parent, to)`
   - child→CycleGroup: ignore (out of scope)

**Selection flow**:
1. "Select" toggle → `selectionMode = !selectionMode`, reset `selectedIndices`
2. In selection mode: checkboxes shown, drag handles hidden
3. Tap row → toggle index in `selectedIndices`
4. "Wrap N Selected" → dispatch `WRAP_SELECTION_IN_CYCLE(Array.from(selectedIndices))`, exit selection mode

## Component Changes

### CycleGroup — modified
- **New props**: `onUnwrap`, `onTitleChange`, `onAddChild`, `dragState`, `onDragOver`, `onDrop`, `onDragEnd`
- **Unwrap** icon in header → calls `onUnwrap(index)`
- **Title edit**: click header text → inline `<input>` (same pattern as workout title)
- **Add child** "+" button in footer → calls `onAddChild(index)` → appends 30s Work interval
- **DnD drop target**: outer `div` handles `onDragOver`/`onDrop` — reacts only when `dragState.parentIndex === undefined`

### IntervalRow — modified
- **New props**: `parentIndex?: number`, `selectionMode?: boolean`, `selected?: boolean`, `onSelect?: (index: number) => void`
- **Child context** (`parentIndex !== undefined`): calls `onDragStart(index, parentIndex)`
- **Selection mode**: renders checkbox, `selected` for checked, calls `onSelect(index)` on tap

### WorkoutEditor — modified
- **New state**: `selectionMode`, `selectedIndices: Set<number>`, `dragState: DragState` (replaces `dragIndex`)
- **Selection toggle** button: renders near Add Block area
- **"Wrap N Selected"** button: replaces old "Wrap in Cycle", disabled when `< 2` selected
- **DnD handlers**: updated to switch on `dragState.parentIndex`

## New/Changed Interfaces

```ts
// Reducer — replaces WRAP_IN_CYCLE, adds 3 new
type Action =
  | { type: 'WRAP_SELECTION_IN_CYCLE'; selectedIndices: number[] }
  | { type: 'UNWRAP_CYCLE'; index: number }
  | { type: 'MOVE_INTO_CYCLE'; fromIndex: number; parentIndex: number }
  | { type: 'MOVE_FROM_CYCLE'; childIndex: number; parentIndex: number; toIndex: number }
  // WRAP_IN_CYCLE removed from union
  // ... existing actions unchanged

// Drag state
type DragState = { from: number; parentIndex?: number } | null

// CycleGroupProps
interface CycleGroupProps {
  interval: Interval; index: number
  // existing callbacks unchanged
  onCycleCountChange, onChildChange, onRemoveChild, onChildMoveUp, onChildMoveDown
  // new
  onUnwrap: (index: number) => void
  onTitleChange: (index: number, title: string) => void
  onAddChild: (index: number) => void
  dragState?: DragState
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
  onDragEnd?: () => void
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `WRAP_SELECTION_IN_CYCLE` | `selectedIndices=[2,3,4]` → cycle at index 2 with those children. Edge: empty, single, last indices. |
| Unit | `UNWRAP_CYCLE` | Cycle with 3 children at index 1 → children spliced at 1, cycle gone. Edge: single child, first/last. |
| Unit | `MOVE_INTO_CYCLE` | Root index 0 into cycle index 2 → child appended. Edge: empty cycle, self-drop. |
| Unit | `MOVE_FROM_CYCLE` | Child index 1 to root index 3 → removed from children, inserted at 3. Edge: last child (children → undefined). |
| DnD | Root→cycle drag | Sim dragStart+drop on CycleGroup → child count +1. |
| DnD | Child→root drag | Sim dragStart+drop on root row → child removed, root count +1. |
| DnD | Invalid drop | Sim child→CycleGroup → no state change. |

## Migration

No data migration. `WRAP_IN_CYCLE` removed from reducer union and its case block deleted. Old "Wrap in Cycle" button replaced by selection mode + `WRAP_SELECTION_IN_CYCLE`. All existing data compatible.
