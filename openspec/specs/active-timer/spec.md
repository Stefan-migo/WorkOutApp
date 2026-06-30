# Active Timer

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| AT-1 | Show large countdown (HH:MM:SS) for current interval, monospace font | MUST |
| AT-2 | Show overall progress bar (% of total workout completed) with per-interval countdown and cycle/set indicators (Cycle N/M, Set N/M) above the bar when applicable | MUST |
| AT-3 | Pause/resume via single button — freezes countdown, preserves elapsed | MUST |
| AT-4 | Skip to next interval immediately — resets timer to next interval's duration | MUST |
| AT-5 | Restart from first interval — resets all state | MUST |
| AT-6 | Auto-advance on `remaining === 0` — play a brief beep/sound, move to next | MUST |
| AT-7 | Completion state when all intervals done — show "Workout Complete" screen | MUST |
| AT-8 | Correct drift using `Date.now()` delta on each 1s tick | MUST |
| AT-9 | Dark background default with high-contrast numerals | MUST |
| AT-10 | All tap targets ≥ 44px | MUST |
| AT-11 | Timer runs in `"use client"` component — no RSC for interactivity | MUST |
| AT-12 | Single `setInterval` at 1s; no animation frame, no external timer libs | MUST |
| AT-13 | Timer SHALL display "Cycle N/M" indicator when current interval is inside a cycle group (parent with cycleCount > 1) | MUST |
| AT-14 | Timer SHALL display "Set N/M" indicator when current interval is inside a cycle with setCount > 1 | MUST |
| AT-15 | Cycle/set indicators SHALL derive from the flattened array — no per-tick recalculation of nesting | MUST |

## Scenarios

### Scenario: Full workout execution
- GIVEN a workout with Prepare(10s) → Work(30s) → CoolDown(10s)
- WHEN user starts timer
- THEN countdown shows 00:00:10, progress bar at 0%

### Scenario: Pause and resume
- GIVEN timer is running at 00:00:15 remaining
- WHEN user taps pause, then resume after 5s
- THEN countdown resumes at 00:00:15 (elapsed time NOT lost)

### Scenario: Skip to next interval
- GIVEN timer is on Prepare interval
- WHEN user taps skip
- THEN timer advances to Work interval at full duration

### Scenario: Auto-advance at zero
- GIVEN timer at 00:00:01 on Prepare
- WHEN 1 second passes
- THEN Prepare countdown reaches 00:00:00 and auto-advances to next interval

### Scenario: All intervals complete
- GIVEN timer on last interval (CoolDown) at 00:00:01
- WHEN 1 second passes
- THEN "Workout Complete" screen shown with restart option

### Scenario: Tab hidden and revisited
- GIVEN timer running
- WHEN user switches tabs for 10s and returns
- THEN displayed time reflects actual elapsed time (drift correction via Date.now)

### Scenario: Cycle and set visible during execution
- GIVEN a cycle group with `cycleCount=5`, `setCount=4`, current position is cycle 3, set 2
- WHEN timer is running
- THEN display shows "Cycle 3/5" and "Set 2/4" above the progress bar

### Scenario: Flat workout hides cycle/set indicators
- GIVEN a flat workout with no nested intervals
- WHEN timer is running
- THEN no cycle/set indicators are shown (backward compatible)

### Scenario: Progress bar continues working with flattened input
- GIVEN a workout with cycles expanded to 15 intervals via flatten
- WHEN timer runs
- THEN progress bar advances proportionally across all 15 intervals
