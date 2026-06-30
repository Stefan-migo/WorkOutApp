# Workout Editor

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| WE-1 | Display flat list of intervals with type, duration, and assigned exercise; editor SHALL render a timeline strip above the list for proportional visual overview | MUST |
| WE-2 | Add interval at any position; default duration 30s for Work, 15s for Rest/Prepare/CoolDown | MUST |
| WE-3 | Remove interval via delete button on each row | MUST |
| WE-4 | Reorder intervals via move up/down buttons | MUST |
| WE-5 | Edit duration (seconds, min 5, max 600) and type via dropdown | MUST |
| WE-6 | Work intervals SHALL use the `ExercisePicker` component (drawing from the exercise library) instead of a hardcoded exercise list or free-text input. Non-Work intervals MUST NOT show exercise picker — unchanged from previous behavior | MUST |
| WE-7 | First interval auto-set to `type: 'prepare'` when workout is empty | SHOULD |
| WE-8 | Last interval auto-set to `type: 'cooldown'` when only one interval remains | SHOULD |
| WE-9 | Warn before navigating away with unsaved changes | SHOULD |
| WE-10 | Editor is a single "use client" page component | MUST |
| WE-11 | Tap on any interval row SHALL open a bottom-sheet modal (`<dialog>`) for detail editing | MUST |
| WE-12 | The bottom-sheet SHALL use the shared `ExercisePicker` component for the exerciseId field on Work intervals. Non-Work intervals SHALL NOT show any exercise field | MUST |
| WE-13 | Bottom-sheet SHALL contain controls for `cycleCount`, `setCount`, `restBetweenCycles` when interval is a group/cycle | MUST |
| WE-14 | Bottom-sheet SHALL have Save and Cancel actions — Save persists changes, Cancel reverts | MUST |
| WE-15 | Bottom-sheet SHALL animate as CSS slide-up from bottom; no external animation library | MUST |
| WE-16 | Editor SHALL display a horizontal timeline strip at the top showing all intervals as proportionally-sized colored blocks | MUST |
| WE-17 | Timeline SHALL indent child intervals visually (left padding/margin/border offset) to indicate nesting | MUST |
| WE-18 | Current/selected interval in timeline SHALL have a visible highlight state | MUST |
| WE-19 | Both bottom-sheet and timeline SHALL use Tailwind CSS only — no SVG, canvas, or external chart libs | MUST |

## Scenarios

### Scenario: Build a basic workout
- GIVEN an empty editor
- WHEN user adds 3 Work intervals and assigns exercises
- THEN list shows 4 intervals (Prepare + 3 Work + CoolDown auto-suggested)

### Scenario: Remove all intervals
- GIVEN a workout with 2 intervals
- WHEN user removes both
- THEN editor shows empty state with "Add interval" prompt

### Scenario: Assign exercise to Rest interval
- GIVEN a Rest interval
- WHEN user tries to select an exercise
- THEN exercise picker is hidden — Rest intervals have no exercise assignment

### Scenario: Edit duration out of bounds
- GIVEN a Work interval with default 30s
- WHEN user enters `600` or `3`
- THEN validation clamps to `[5, 600]` range

### Scenario: Tap interval opens sheet
- GIVEN a workout with 4 intervals in the editor
- WHEN user taps an interval row
- THEN a bottom-sheet slides up with editable fields pre-filled from that interval

### Scenario: Picker shows library exercises
- GIVEN a Work interval in IntervalForm
- WHEN user opens the exercise picker
- THEN the picker renders exercises from `workoutapp.exercises` with search and category filter

### Scenario: Quick-create from picker in IntervalForm
- GIVEN a Work interval with no exercise assigned
- WHEN user clicks "+" in the picker and creates a new exercise
- THEN the new exercise is selected and assigned immediately

### Scenario: Detail sheet shows exercise picker
- GIVEN a Work interval in the detail sheet
- WHEN user taps the exercise field
- THEN the shared ExercisePicker opens with search and filter

### Scenario: Timeline shows 10 intervals without overflow
- GIVEN a workout with 10 intervals of varying durations
- WHEN the editor loads
- THEN timeline shows blocks sized proportionally to each interval's duration, fitting within viewport width
