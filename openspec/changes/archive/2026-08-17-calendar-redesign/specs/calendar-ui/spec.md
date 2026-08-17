# Calendar UI Specification

## Purpose

Layout, responsive behavior, and visual conventions of the `/calendar` page: unified header, two-zone desktop layout, mobile stacking without redundant panels, month overview with assignment density and direct day assignment, subtle today treatment, and a compact "next up" one-liner.

## Requirements

### Requirement: CU-1 — Layout structure

The `/calendar` page MUST present a unified header containing week navigation (◀, week label, ▶), a "Today" control, and template save/apply actions. On desktop the page MUST NOT exceed 2 visual zones (main week view plus one contextual sidebar). All cards on the page MUST use a single consistent card style.

#### Scenario: Desktop two-zone layout

- GIVEN the page rendered at desktop width
- WHEN the layout is measured
- THEN at most 2 visual zones appear (main + one sidebar)

#### Scenario: Template actions in header

- GIVEN the page rendered
- WHEN the user looks for "Save as template" and template apply actions
- THEN they are located in the header actions row

### Requirement: CU-2 — Responsive mobile behavior

On mobile the page MUST stack sections vertically without redundant panels: the week view and month overview MUST NOT duplicate the same upcoming-assignment list. Primary content (week view) MUST be reachable without scrolling past secondary panels. The system SHOULD make the month overview and templates collapsible on mobile.

#### Scenario: Mobile stacking without redundancy

- GIVEN a narrow viewport
- WHEN the page renders
- THEN no two visible panels render the same upcoming-assignment list

#### Scenario: Month overview collapsed by default on mobile

- GIVEN a narrow viewport
- WHEN the page initially renders
- THEN the month overview occupies collapsed height until expanded

### Requirement: CU-3 — Month overview with density and direct assignment

The month overview MUST render the displayed month's weeks and MUST indicate, per day, whether assignments exist (assignment density). Activating a day MUST open the DayAssignmentModal for that date (direct assignment). Activating a week MUST select that week in the main view. Density derivation MUST be a testable pure function.

#### Scenario: Density indicator for assigned day

- GIVEN a month day that has an assignment
- WHEN the month overview renders
- THEN that day shows a density indicator distinct from unassigned days

#### Scenario: Direct assignment from month overview

- GIVEN the month overview visible
- WHEN the user activates an unassigned day
- THEN the DayAssignmentModal opens for that date
- AND assigning a workout marks that day as having an assignment

#### Scenario: Edge — day in adjacent month

- GIVEN a month-grid cell belonging to the adjacent month
- WHEN the overview renders
- THEN the cell is visually de-emphasized and does not report density for the displayed month

### Requirement: CU-4 — Today treatment

Today MUST be visually distinguished by an accent ring or border, MUST NOT use a full accent fill, and the treatment MUST remain legible for both assigned and rest days.

#### Scenario: Today with rest day

- GIVEN today is unassigned
- WHEN the calendar renders
- THEN today shows a "Rest" badge with an accent ring/border, not a filled accent button

### Requirement: CU-5 — Next-up one-liner

The focus card MUST include a single-line "next up" element describing the next upcoming assignment (derived by a testable pure function). The standalone UpcomingList panel MUST NOT exist.

#### Scenario: Next-up shown in focus card

- GIVEN at least one future assignment in the displayed week or later
- WHEN the focus card renders
- THEN a one-line summary shows the next assignment's day, title, and duration

#### Scenario: No upcoming assignment

- GIVEN no assignments at or after the current moment
- WHEN the focus card renders
- THEN the next-up line shows an empty/rest state instead of omitting the element
