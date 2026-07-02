# TimerControls Tests

## Purpose

Verify the `TimerControls` component renders pause/play icons conditionally based on `status`, wires click handlers correctly, and shows/hides buttons per state.

## Requirements

### Requirement: TC-1 — Conditional pause/play icon

The center button MUST show the `pause` Material Icon when `status='running'` and `play_arrow` when `status='paused'`.

#### Scenario: Running shows pause icon
- GIVEN `<TimerControls status="running" ... />`
- THEN the center button contains a `pause` material icon and `aria-label="Pause"`

#### Scenario: Paused shows play icon
- GIVEN `<TimerControls status="paused" ... />`
- THEN the center button contains a `play_arrow` material icon and `aria-label="Resume"`

### Requirement: TC-2 — Button visibility per status

The control group SHALL render only during running/paused states. Skip button SHALL be visible alongside the play/pause toggle when status is running or paused. No controls SHALL render when status is idle or complete.

#### Scenario: Idle hides all controls
- GIVEN `<TimerControls status="idle" ... />`
- THEN no control buttons are rendered

#### Scenario: Complete hides all controls
- GIVEN `<TimerControls status="complete" ... />`
- THEN no control buttons are rendered

### Requirement: TC-3 — Handler wiring

Each visible button MUST call its corresponding handler on click.

#### Scenario: Pause button fires onPause
- GIVEN `<TimerControls status="running" onPause={mockFn} ... />`
- WHEN the center button is clicked
- THEN `mockFn` is called once

#### Scenario: Resume button fires onResume
- GIVEN `<TimerControls status="paused" onResume={mockFn} ... />`
- WHEN the center button is clicked
- THEN `mockFn` is called once

#### Scenario: Skip button fires onSkip
- GIVEN `<TimerControls status="running" onSkip={mockFn} ... />`
- WHEN the skip button is clicked
- THEN `mockFn` is called once

### Requirement: TC-4 — Conditional rewind button

The rewind button SHALL only render when `onRewind` prop is provided.

#### Scenario: Rewind renders when onRewind provided
- GIVEN `<TimerControls status="running" onRewind={mockFn} ... />`
- THEN a rewind button is rendered

#### Scenario: Rewind not rendered when onRewind omitted
- GIVEN `<TimerControls status="running" />` (no onRewind)
- THEN no rewind button is present
