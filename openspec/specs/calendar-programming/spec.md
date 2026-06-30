# Calendar Programming Specification

## Purpose

Weekly schedule planning for workouts and sequences. Users view/manage a 7-day week grid, assign workouts or sequences to specific days, save weekly plans as templates, and apply saved templates.

## Requirements

### Requirement: CP-1 — Week calendar grid

The system MUST render a `/calendar` page with a 7-column Mon–Sun grid. Each day cell MUST display the assigned workout/sequence title, total duration (via `flattenWorkout()`), or a "Rest" badge if unassigned. Navigation MUST include ◀ Previous Week, a week label (e.g. "Mar 30 – Apr 5"), and Next Week ▶. Default view SHALL be the current ISO week.

#### Scenario: Navigate to next week

- GIVEN the calendar showing the current week
- WHEN user clicks "Next Week"
- THEN the grid shifts forward 7 days and displays that week's assignments

#### Scenario: Rest day cell

- GIVEN a day with no workoutId or sequenceId
- WHEN the calendar renders
- THEN that day shows a "Rest" badge

#### Scenario: Duration uses flattenWorkout

- GIVEN a day assigned to a workout with cycles/sets
- WHEN the calendar renders that day
- THEN the displayed duration matches `flattenWorkout()` expanded time

### Requirement: CP-2 — Day assignment modal

The system MUST open a native `<dialog>` modal when the user clicks a day cell. The modal MUST contain a workout selector (radio/select), a sequence selector, a notes textarea, and three buttons: Assign, Clear, Cancel. Assign MUST persist the selection. Clear MUST remove the day's assignment. Cancel MUST close without changes.

#### Scenario: Assign workout to a day

- GIVEN the modal open for an empty Monday
- WHEN user selects a workout, optionally adds notes, and clicks Assign
- THEN the Monday cell shows the workout title and duration

#### Scenario: Clear existing assignment

- GIVEN a day with an assigned workout
- WHEN user opens the modal and clicks Clear
- THEN the assignment is removed and the day reverts to "Rest"

#### Scenario: Cancel modal

- GIVEN the modal open with unsaved changes
- WHEN user clicks Cancel (or presses Escape)
- THEN the modal closes and no state changes are persisted

### Requirement: CP-3 — Templates

The system MUST allow saving the current week's assignments as a `ProgramTemplate`. The system MUST list saved templates in a sidebar with an "Apply" button per template. Applying a template MUST copy its 7 day assignments into the current week plan (flat copy, no live sync). The system MUST allow deleting templates.

#### Scenario: Save week as template

- GIVEN a week with 3 assigned days
- WHEN user clicks "Save as template" and enters a title
- THEN a new ProgramTemplate with those 7 day assignments is persisted

#### Scenario: Apply template to empty week

- GIVEN an empty target week and a saved template with workouts on Mon/Wed/Fri
- WHEN user clicks "Apply" on that template
- THEN Mon/Wed/Fri receive copies of the template's assignments; remaining days stay empty

#### Scenario: Deleting a template

- GIVEN a saved template
- WHEN user clicks delete on that template
- THEN the template is removed from storage and the sidebar updates

#### Scenario: Template is flat copy

- GIVEN a template applied to Week A, then the original workout is deleted
- WHEN Week A renders
- THEN the day reference is stale (workoutId points to deleted data) — the system SHOULD show "(deleted)" in that case

### Requirement: CP-4 — ProgramTemplate data model

The system MUST define a `ProgramTemplate` type with fields `{ id, title, description?, days: DayAssignment[7], createdAt, updatedAt }`. The system MUST expose save, list, apply, and delete operations.

#### Scenario: Template tracks creation time

- GIVEN a newly saved template
- WHEN retrieved from storage
- THEN `createdAt` and `updatedAt` are set to the save timestamp
