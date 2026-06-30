# Delta for Workload Data Model

## ADDED Requirements

### Requirement: DM-14 — WeekPlan and DayAssignment types

The system MUST define a `WeekPlan` type with fields `{ id, title?, startDate (ISO Monday), days: DayAssignment[7], createdAt, updatedAt }`. The system MUST define a `DayAssignment` type with fields `{ workoutId?, sequenceId?, notes? }`. At least one of `workoutId` or `sequenceId` MAY be null (rest day), but the system SHALL NOT validate mutual exclusivity.

#### Scenario: Create WeekPlan for current week

- GIVEN no WeekPlan exists for the week containing a given date
- WHEN `getWeekPlan(date)` is called
- THEN a new WeekPlan with 7 empty DayAssignments is created and returned

#### Scenario: WeekPlan startDate is ISO Monday

- GIVEN any arbitrary date
- WHEN creating a WeekPlan
- THEN `startDate` is midnight UTC of the preceding Monday (ISO 8601 week start)

#### Scenario: DayAssignment with only notes

- GIVEN a day with no workoutId and no sequenceId
- WHEN the DayAssignment is created with notes only
- THEN it is valid and does not throw

### Requirement: DM-15 — ProgramTemplate type

The system MUST define a `ProgramTemplate` type with fields `{ id, title, description?, days: DayAssignment[7], createdAt, updatedAt }`. A template is a reusable snapshot of a week's assignments.

#### Scenario: Empty template

- GIVEN a template with all 7 days unassigned
- WHEN queried
- THEN `days` is an array of 7 DayAssignments with all optional fields absent
