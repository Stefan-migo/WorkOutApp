# Delta for Workout Editor

## REMOVED Requirements

### Requirement: WE-13 — Bottom-sheet cycle controls
(Reason: Cycles are creation-time only. Bottom-sheet no longer shows cycleCount/setCount/restBetweenCycles controls.)
(Migration: Remove cycle/set/rest fields from IntervalDetailSheet.)

### Requirement: WE-17 — Timeline indentation
(Reason: No nested intervals exist in flat model.)
(Migration: Timeline strips indentation — all intervals render at root level.)

### Requirement: WE-23 — Cycle grouping and selection mode
(Reason: Cycles are creation-time only. Screen 2 has no selection mode, no wrap/unwrap.)
(Migration: Delete CycleGroup component. Remove all selection-mode and cycle-wrapping logic.)

### Scenarios removed (cycle-related)

- Cycle grouping — selection mode (WE-23a)
- Unwrap cycle (WE-23b)
- Selection exits on drag (WE-23c)
- Inline cycle title edit (WE-26a)
- Add child to cycle (WE-27a)
- Drag root into cycle (WE-28a)
- Drag child out of cycle (WE-29a)
- Drag last child out removes cycle (WE-29b)

(Reason for all: Cycle editing removed from Screen 2. Cycles exist only transiently during Screen 1 creation.)

## MODIFIED Requirements

### Requirement: WE-1 — Editor rendering

Editor SHALL render intervals as glass cards (bg-surface/80, backdrop-blur-md, border-outline-variant/30) with 4px left accent border colored by segment type, drag_indicator icon, and description text. A timeline strip SHALL render above the list for proportional visual overview, including a legend row with 5 segment color dots + labels below the bar (prepare, work, rest, rest_between_cycles, cooldown).
(Previously: 4 segment color dots — no rest_between_cycles.)

#### Scenario: Editor renders 5 interval types
- GIVEN a workout with all 5 interval types
- WHEN the editor loads
- THEN each interval shows its 4px accent in segment color
- AND the legend shows 5 colored dots

### Requirement: WE-4 — Drag-and-drop reorder

Editor SHALL render drag_indicator icon (visual affordance). Full drag-and-drop reordering SHALL work. Move up/down buttons SHALL be retained for accessibility.
(Previously: DnD was deferred; up/down buttons were the only reorder method.)

#### Scenario: Reorder by drag
- GIVEN 3 intervals in editor
- WHEN user drags interval 3 above interval 1
- THEN order becomes [interval3, interval1, interval2]

### Requirement: WE-21 — Timeline strip colors

Timeline strip SHALL be h-4 rounded-full, bg-surface-dim, shadow-inner, segments as colored divs (seg-prepare/sky, seg-work/emerald, seg-rest/red, seg-rest-between-cycles/amber, seg-cooldown/violet); legend row below with 5 colored dots + label-caps labels.
(Previously: 4 colors, no rest_between_cycles.)

#### Scenario: 5 segment types in timeline
- GIVEN a workout with all 5 interval types
- WHEN the editor loads
- THEN timeline shows 5 colored segments proportionally sized

### Requirement: WE-22 — Add Block grid

Add Block SHALL be a 2x3 (mobile) / 6-col (desktop) grid of glass cards, one per type (Prepare, Work, Rest, Rest Between Cycles, Cycle, Cool Down), each with type icon, label-caps label, top-2 border accent in segment color; hover lift effect.
(Previously: 2x2/4-col grid for 4 interval types.)

#### Scenario: Add Block shows 6 types
- GIVEN editor showing interval list
- WHEN user opens Add Block
- THEN a 2x3 grid shows all 6 block types (Cycle included for new intervals)

### Requirement: TS-1 — TimelineStrip colors

TimelineStrip SHALL be h-4 rounded-full, bg-surface-dim, shadow-inner, segments as colored divs with proportional widths; legend row below with 5 items (w-3 h-3 rounded-sm colored square + label-caps text).
(Previously: 4 items.)

#### Scenario: Legend shows 5 colors
- GIVEN a workout loaded in editor
- WHEN the timeline renders
- THEN the legend row contains 5 colored squares
