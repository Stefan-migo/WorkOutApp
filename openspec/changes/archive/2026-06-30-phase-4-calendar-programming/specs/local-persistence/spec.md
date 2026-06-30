# Delta for Local Persistence

## ADDED Requirements

### Requirement: LP-11 — Persist week plans under workoutapp.weekPlans

The system MUST persist `WeekPlan[]` under localStorage key `workoutapp.weekPlans` using the same SSR-safe try/catch pattern from LP-1. Loading MUST return an empty array on missing or corrupt data. `getWeekPlan(date)` SHALL return the existing WeekPlan for that week or create and persist a new one.

#### Scenario: Save and reload week plan

- GIVEN a week with 3 assigned days
- WHEN user navigates away and back to `/calendar`
- THEN the same assignments render on the correct week

#### Scenario: Corrupt weekPlans key

- GIVEN `workoutapp.weekPlans` contains invalid JSON
- WHEN the calendar loads
- THEN a new empty WeekPlan is created for the current week (no crash)

#### Scenario: getWeekPlan creates on miss

- GIVEN no WeekPlan exists for the week of 2026-07-06
- WHEN the page loads for that week
- THEN a new plan with 7 empty days is persisted under `workoutapp.weekPlans`

### Requirement: LP-12 — Persist templates under workoutapp.programTemplates

The system MUST persist `ProgramTemplate[]` under localStorage key `workoutapp.programTemplates` using the same pattern from LP-1. Save, delete, and list operations MUST be supported. Loading MUST return an empty array on missing or corrupt data.

#### Scenario: Save and list templates

- GIVEN 2 saved templates
- WHEN the calendar sidebar lists templates
- THEN both appear with their title and day count

#### Scenario: Delete template

- GIVEN a saved template
- WHEN deleted
- THEN it no longer appears in the sidebar list

#### Scenario: Corrupt programTemplates key

- GIVEN `workoutapp.programTemplates` contains invalid JSON
- WHEN the calendar sidebar loads
- THEN the list is empty, no error thrown
