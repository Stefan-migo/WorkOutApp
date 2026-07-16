# Proposal: Workout Cycle Editor

## Intent

Current "Wrap in Cycle" hardcodes the last 2 intervals, cycles can't be unwrapped, titles are uneditable. Users building complex workouts (supersets, circuits) need full cycle lifecycle.

## Scope

### In Scope
- Selection-mode UX (tap intervals to select, then wrap)
- `WRAP_SELECTION_IN_CYCLE` reducer action (replaces hardcoded `WRAP_IN_CYCLE`)
- `UNWRAP_CYCLE` action: explode children back to flat at parent position
- Inline cycle title editing (matches workout title pattern)
- Add child to cycle (appends at end of children)
- DnD root → cycle: drag a root interval INTO a cycle (becomes a child)
- DnD cycle → root: drag a child OUT of a cycle (becomes a root interval)
- Update spec with new scenarios

### Out of Scope
- Drag children between cycles (move child from cycle A to cycle B)
- Nested cycles (cycle inside a cycle)
- Drag-to-nest (drag interval to create a new cycle on drop)
- Cycle repeats editor in detail sheet (already via WE-13)

## Capabilities

### New Capabilities
- None — pure enhancement of existing `workout-editor`

### Modified Capabilities
- `workout-editor`: cycle lifecycle — selection-based wrap, unwrap, inline title edit, add child

## Approach

1. **Reducer**: `WRAP_SELECTION_IN_CYCLE(selectedIndices[])` replaces hardcoded `WRAP_IN_CYCLE`. `UNWRAP_CYCLE(index)` splices children into parent array at cycle position, removes container. `MOVE_INTO_CYCLE(fromIndex, parentIndex)` and `MOVE_FROM_CYCLE(childIndex, parentIndex, toIndex)` for cross-level DnD.
2. **UI — selection mode**: toggle button activates checkboxes on rows; tap to select; "Wrap in Cycle" creates cycle from selected in order.
3. **UI — unwrap**: icon action on cycle header → dispatches UNWRAP_CYCLE.
4. **UI — title edit**: click header text → inline input (same pattern as workout title).
5. **UI — add child**: "+" button in cycle footer → appends 30s Work interval to children.
6. **DnD — CycleGroup as drop target**: CycleGroup wrapper handles onDragOver/onDrop. When a root interval is dropped onto it, dispatch MOVE_INTO_CYCLE.
7. **DnD — child drag out**: IntervalRow inside a cycle uses a different drag handler that, when dropped on root area, dispatches MOVE_FROM_CYCLE. Uses a "drop zone" indicator at the end of root list or the drag ghost position.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/workout-reducer.ts` | Modified | Replace WRAP_IN_CYCLE → WRAP_SELECTION_IN_CYCLE, add UNWRAP_CYCLE, MOVE_INTO_CYCLE, MOVE_FROM_CYCLE |
| `src/components/WorkoutEditor.tsx` | Modified | Selection mode toggle, checkbox per row, unwrap button, inline title edit, add-child button, cross-level DnD handlers |
| `src/components/CycleGroup.tsx` | Modified | Add DnD target (onDragOver/onDrop), unwrap icon, inline title input, add-child button |
| `src/components/IntervalRow.tsx` | Modified | Distinguish root vs child drag (different drop targets for cross-level moves) |
| `openspec/specs/workout-editor/spec.md` | Modified | Update WE-23 scenario, add scenarios for unwrap/add-child/title-edit/DnD |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| Selection mode conflicts with drag reorder | Low | Exit selection mode when drag starts; disable drag handles in selection mode |
| Cross-level DnD drop target ambiguity (root vs cycle) | Medium | Visual drop zone indicators (highlight on hover); disallow drops that would create invalid state |
| CycleGroup DnD target receives drops meant for root | Low | Check `dragIndex` origin — root intervals go into cycle, child intervals go to root |

## Rollback Plan

One-shot revert: restore `workout-reducer.ts` and `WorkoutEditor.tsx` from git. No data migration needed — cycles already use `children`/`cycleCount` fields. Unwrap is a reducer op, not persisted state.

## Dependencies

- None

## Success Criteria

- [ ] User can select arbitrary intervals (not just last 2) and wrap them in a cycle
- [ ] Unwrapping a cycle restores children at the same index, preserving order
- [ ] Cycle title is editable inline by clicking the text
- [ ] "Add child to cycle" appends at end of children array
- [ ] Dragging a root interval onto a CycleGroup adds it as a child
- [ ] Dragging a child out of a CycleGroup restores it as a root interval at the drop position
- [ ] All existing tests pass; new reducer actions have unit test coverage
