# Delta for Workout Editor

## ADDED Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| WE-11 | Tap on any interval row SHALL open a bottom-sheet modal (`<dialog>`) for detail editing | MUST |
| WE-12 | Bottom-sheet SHALL contain fields: title, duration, description, exerciseId (Work intervals only) | MUST |
| WE-13 | Bottom-sheet SHALL contain controls for `cycleCount`, `setCount`, `restBetweenCycles` when interval is a group/cycle | MUST |
| WE-14 | Bottom-sheet SHALL have Save and Cancel actions — Save persists changes, Cancel reverts | MUST |
| WE-15 | Bottom-sheet SHALL animate as CSS slide-up from bottom; no external animation library | MUST |
| WE-16 | Editor SHALL display a horizontal timeline strip at the top showing all intervals as proportionally-sized colored blocks | MUST |
| WE-17 | Timeline SHALL indent child intervals visually (left padding/margin) to indicate nesting | MUST |
| WE-18 | Current/selected interval in timeline SHALL have a visible highlight state | MUST |
| WE-19 | Both bottom-sheet and timeline SHALL use Tailwind CSS only — no SVG, canvas, or external chart libs | MUST |

## MODIFIED Requirements

### Requirement: Display flat list of intervals with type, duration, and assigned exercise

The editor now renders intervals in the timeline strip (top) AND maintains the existing list below. Timeline provides proportional visual overview.
(Previously: editor only showed a flat list)

#### Scenario: Tap interval opens sheet
- GIVEN a workout with 4 intervals in the editor
- WHEN user taps an interval row
- THEN a bottom-sheet slides up with editable fields pre-filled from that interval

#### Scenario: Timeline shows 10 intervals without overflow
- GIVEN a workout with 10 intervals of varying durations
- WHEN the editor loads
- THEN timeline shows blocks sized proportionally to each interval's duration, fitting within viewport width
