# Delta: Calendar, History & Stats Visual Polish

## MODIFIED Requirements

### Requirement: CP-1 — Week calendar grid

The system MUST render a `/calendar` page with 7 horizontal day-rows (Mon–Sun). Each row MUST show: a date badge (day name + number in a compact card), the assigned workout/sequence title with type chip (Strength/HIIT/Recovery), total duration, and a chevron icon. Unassigned days MUST show "Rest Day / Active Recovery" with an `add_circle` icon. The calendar SHALL include a "Today's Focus" right panel showing the current day's workout detail, exercise list, and a "Start Workout" button. The calendar SHALL include an "Upcoming" sidebar with 3-day preview and a mini motivational card. View toggle (Weekly/Monthly) MAY exist but Monthly is out-of-scope.
(Previously: 7-column Mon-Sun grid with cell buttons, no focus panel or upcoming sidebar)

#### Scenario: Day row with assigned workout

- GIVEN Monday has "Heavy Pull Session" assigned
- WHEN the calendar renders
- THEN Monday shows a full-width row with date badge (MON + 23), title, "Strength" chip, "60 min", and chevron icon

#### Scenario: Day row without assignment

- GIVEN Tuesday has no assignment
- WHEN the calendar renders
- THEN Tuesday shows "Rest Day / Active Recovery" italic text and an add_circle icon

#### Scenario: Today's Focus panel shows current day

- GIVEN Wednesday is "MetCon V.2"
- WHEN user views calendar
- THEN the right panel shows title, HIIT chip, "45 Minutes Total", exercise list with sets, and "Start Workout" button

### Requirement: CP-2 — Day assignment modal

The system MUST maintain the existing DayAssignmentModal with native `<dialog>`. No functional changes. Visual alignment with design references.
(Previously: no visual changes required)

#### Scenario: Assign workout to a day (unchanged)

- GIVEN the modal open for an empty Monday
- WHEN user selects a workout, optionally adds notes, and clicks Assign
- THEN the Monday row shows the workout title and duration

### Requirement: CP-4 — ProgramTemplate sidebar

The system MUST keep the templates sidebar. Visual alignment with Deep Nordic tokens and Material Icons. No functional changes.
(Previously: no visual changes required)

### Requirement: SH-1 through SH-4 — History list and detail

**History list** (`/history`):
- MUST render sessions in glass-card rows with a left accent bar color-coded by type (workout/sequence)
- MUST show a date badge (month abbreviation + day number in compact card)
- MUST show: title, type chip, duration, interval count
- SHOULD include a search field with magnifying glass icon
- SHOULD include "Filters" and "This Month" range buttons
- SHOULD display DURATION metric per row (AVG HR and LOAD are out-of-scope — model does not have them)

**Session detail** (`/history/[id]`):
- MUST render a 2x2 bento grid of metric cards at top:
  1. "Total Duration" — format: MM:SS
  2. "Intervals" — count of intervals
  3. "Completion Rate" — percentage completed
  4. "Work vs Rest" — ratio of work duration to rest duration
- MUST render interval breakdown as styled cards with left accent border color-coded by interval type
- MUST keep "Repeat" button
- MUST keep "Back to history" link

(Previously: plain list, no search/filters/metrics)

#### Scenario: History list with search

- GIVEN user types "VO2" in the search field
- WHEN results update
- THEN only sessions whose title contains "VO2" are shown

#### Scenario: Session detail with bento metrics

- GIVEN a session with 8 intervals, 6 completed
- WHEN user opens the detail page
- THEN the 4 metric cards show: total duration, "8 intervals", "75%" completion rate, work/rest ratio

### Requirement: ST-1 through ST-9 — Statistics enhancement

The `/stats` page SHALL:
- Add a "Last 30 Days Overview" subtitle under the heading
- Add a consistency heatmap (4 weeks × 7 days grid) showing training days vs rest days using session data
- Add hover tooltips on weekly volume bars showing the week's total
- Resolve session names via `getWorkout`/`getSequence` (not truncated IDs)
- Remove duplicate Export button in empty state (keep only the one in populated view)
(Previously: no heatmap, no tooltips, truncated IDs)

#### Scenario: Consistency heatmap

- GIVEN 12 sessions across the last 28 days
- WHEN user views stats
- THEN a 4×7 heatmap grid renders, with filled cells on days with sessions and empty cells on rest days

#### Scenario: Bar tooltip on hover

- GIVEN weekly volume bars render
- WHEN user hovers over a bar
- THEN a tooltip shows "Xh Ym" for that week

#### Scenario: Session name resolved

- GIVEN a session references workout "w123" with title "Heavy Pull"
- WHEN the recent sessions list renders
- THEN the name shows "Heavy Pull" not "Workout: w123"
