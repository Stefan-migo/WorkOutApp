# Delta for Active Timer

## ADDED Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| AT-13 | Timer SHALL display "Cycle N/M" indicator when current interval is inside a cycle group (parent with cycleCount > 1) | MUST |
| AT-14 | Timer SHALL display "Set N/M" indicator when current interval is inside a cycle with setCount > 1 | MUST |
| AT-15 | Cycle/set indicators SHALL derive from the flattened array — no per-tick recalculation of nesting | MUST |

## MODIFIED Requirements

### Requirement: Show overall progress bar (% of total workout completed)

Progress bar now shows overall workout progress AND per-interval countdown. Cycle/set indicators appear above the progress bar when applicable.
(Previously: progress bar only showed overall percentage)

#### Scenario: Cycle and set visible during execution
- GIVEN a cycle group with `cycleCount=5`, `setCount=4`, current position is cycle 3, set 2
- WHEN timer is running
- THEN display shows "Cycle 3/5" and "Set 2/4" above the progress bar

#### Scenario: Flat workout hides cycle/set indicators
- GIVEN a flat workout with no nested intervals
- WHEN timer is running
- THEN no cycle/set indicators are shown (backward compatible)

#### Scenario: Progress bar continues working with flattened input
- GIVEN a workout with cycles expanded to 15 intervals via flatten
- WHEN timer runs
- THEN progress bar advances proportionally across all 15 intervals
