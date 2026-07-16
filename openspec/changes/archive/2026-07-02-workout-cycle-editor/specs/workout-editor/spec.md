# Delta: workout-editor

## MODIFIED Requirements

### Requirement: WE-23 — Cycle grouping

The system MUST wrap selected intervals into a cycle via selection mode. Selection mode SHALL be toggled via a toolbar button. When active, each interval SHALL show a checkbox; checking 2+ intervals enables a "Wrap in Cycle" action that wraps them in order. The cycle visual SHALL render left bracket (absolute, border-l-2 + border-t-2 + border-b-2, rounded-l-lg) around grouped intervals, header with name + total duration badge, repeats select (x2–x6). The system MUST also support unwrapping a cycle, restoring its children as root intervals at the cycle's position preserving order. Selection mode SHALL auto-exit when a drag begins.
(Previously: Hardcoded "wrap last 2" via single button below Add Block. No unwrap, no selection mode.)

#### Scenario: Cycle grouping — selection mode (WE-23a)

- GIVEN 3+ intervals in the editor
- WHEN user toggles selection mode
- THEN each interval shows a checkbox
- WHEN user checks intervals 1 and 3 and taps "Wrap in Cycle"
- THEN a cycle wraps those 2 intervals preserving their order (indices 1, 3 removed; cycle at min index)
- AND cycle header shows name, total duration badge, repeats selector defaulting to x4

#### Scenario: Unwrap cycle (WE-23b)

- GIVEN a cycle with 3 children at index 2
- WHEN user taps the unwrap icon on the cycle header
- THEN the cycle is removed
- AND its 3 children become root intervals at indices 2, 3, 4, preserving order and all interval data

#### Scenario: Selection exits on drag (WE-23c)

- GIVEN selection mode is active with 2 intervals checked
- WHEN user starts dragging an interval
- THEN selection mode exits
- AND all checkboxes are cleared
- AND drag proceeds normally

## ADDED Requirements

### Requirement: WE-26 — Inline cycle title edit

The system SHOULD support inline editing of the cycle title by clicking the header text. The input behavior SHALL match the workout title pattern (click to focus, inline input, blur to save).

#### Scenario: Edit cycle title (WE-26a)

- GIVEN a cycle with title "Superset"
- WHEN user clicks the title text
- THEN the text becomes an editable input pre-filled with "Superset"
- WHEN user types "Circuit" and presses Enter
- THEN the cycle title updates to "Circuit"
- AND focus returns to the cycle header

### Requirement: WE-27 — Add child to cycle

The system MUST allow adding a default interval (30s Work, no exercise) to the end of a cycle's children array via an add-button in the cycle footer.

#### Scenario: Add child to cycle (WE-27a)

- GIVEN a cycle with 2 children
- WHEN user taps "+" in the cycle footer
- THEN a new Work interval (30s, blank exercise) appends as the last child
- AND the cycle's total duration badge updates

### Requirement: WE-28 — DnD root interval into cycle

The system MUST support dragging a root interval and dropping it onto a CycleGroup to add it as a child at the end of the children array.

#### Scenario: Drag root into cycle (WE-28a)

- GIVEN 3 root intervals and a cycle with 2 children
- WHEN user drags root interval index 1 onto the CycleGroup
- THEN the interval is removed from the root list
- AND it is appended to the cycle's children array
- AND the cycle total duration updates

### Requirement: WE-29 — DnD child interval out of cycle

The system MUST support dragging a child interval out of a CycleGroup and dropping it in the root area to restore it as a root interval at the drop position.

#### Scenario: Drag child out of cycle to specific position (WE-29a)

- GIVEN a cycle with 3 children at index 2
- WHEN user drags child index 1 to root drop position 5
- THEN the child becomes a root interval at index 5
- AND remaining cycle children are re-indexed preserving order

#### Scenario: Drag last child out removes cycle (WE-29b)

- GIVEN a cycle with exactly 1 child
- WHEN user drags the sole child out to root
- THEN the cycle is removed (empty cycles are invalid)
- AND the child becomes a root interval at the drop position

### Requirement: WE-13 — restBetweenCycles (no change needed)

The existing WE-13 requirement already covers cycle-group controls (`cycleCount`, `setCount`, `restBetweenCycles`) in the bottom-sheet detail. No additional spec change required for this field.
