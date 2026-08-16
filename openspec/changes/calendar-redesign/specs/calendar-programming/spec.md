# Delta for calendar-programming

## MODIFIED Requirements

### Requirement: CP-1 — Week calendar grid

The system MUST render a `/calendar` page presenting all seven Mon–Sun days, where each day MAY render as a grid cell, row, or card (visual form is governed by `calendar-ui`). Each day entry MUST display the assigned workout/sequence title, total duration (via `flattenWorkout()`), or a "Rest" badge if unassigned. Navigation MUST include ◀ Previous Week, a week label (e.g. "Mar 30 – Apr 5"), and Next Week ▶. Default view SHALL be the current ISO week. The page MUST include a month overview that enables selecting any week of the displayed month; selecting a day in the month overview MUST open the day assignment modal (CP-2) for that date. Today MUST be visually distinguished by a subtle treatment (e.g. accent ring/border), not a full accent fill.

(Previously: strict 7-column grid, no month overview, no direct assignment from overview, no today-treatment constraint.)

#### Scenario: Navigate to next week

- GIVEN the calendar showing the current week
- WHEN user clicks "Next Week"
- THEN the view shifts forward 7 days and displays that week's assignments

#### Scenario: Rest day entry

- GIVEN a day with no workoutId or sequenceId
- WHEN the calendar renders
- THEN that day shows a "Rest" badge

#### Scenario: Duration uses flattenWorkout

- GIVEN a day assigned to a workout with cycles/sets
- WHEN the calendar renders that day
- THEN the displayed duration matches `flattenWorkout()` expanded time

#### Scenario: Jump to a week via month overview

- GIVEN the month overview showing a month containing the currently displayed week
- WHEN user selects a different week in the overview
- THEN the week grid displays that selected week's assignments

#### Scenario: Direct day assignment from month overview

- GIVEN the month overview showing a day within the displayed month
- WHEN user activates that day
- THEN the day assignment modal (CP-2) opens for that date

#### Scenario: Subtle today highlight

- GIVEN today is within the displayed week
- WHEN the calendar renders
- THEN today is distinguishable via an accent ring/border without a full accent fill
