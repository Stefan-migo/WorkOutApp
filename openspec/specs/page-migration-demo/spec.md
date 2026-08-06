# Page Migration Demo Specification

## Purpose

Demonstrates the design system on two simple pages — `/workouts` (list) and `/exercises` — converting them from inline styles to `ui/` primitives and tokens. Proves the migration workflow before the remaining pages are converted in future changes.

## Constraints

- Migrated pages MUST use primitives and tokens exclusively; no inline styles or hardcoded colors.
- Behavior MUST be preserved (search, filter, navigation, dialogs keep working).
- Touched strings MUST be English.
- Diff per page SHOULD stay small (≤400 changed lines per PR slice).

## Non-Goals

- Migrating the remaining pages (dashboard, sequences, history, calendar, stats, editors, play screens beyond foundation token work, auth, layouts) — future changes.
- A shared DropdownMenu primitive — the workout-card ⋮ menu MAY stay inline or use a minimal local menu.

## Requirements

### Requirement: PMD-1 — /workouts list migrated

The `/workouts` page MUST use Card for workout cards, EmptyState for the no-workouts case, and Button for the FAB and primary actions. The card overflow (⋮) menu MAY remain inline.

| ID | Description | Keyword |
|----|-------------|---------|
| PMD-1a | Workout cards use Card | MUST |
| PMD-1b | Empty list uses EmptyState | MUST |
| PMD-1c | FAB/primary actions use Button | MUST |

#### Scenario: Empty workouts list
- GIVEN a user with no saved workouts
- WHEN opening /workouts
- THEN EmptyState renders with a "create workout" action

#### Scenario: Populated list
- GIVEN saved workouts
- WHEN opening /workouts
- THEN cards render the same info as before (name, meta, timeline preview)

### Requirement: PMD-2 — /exercises migrated

The `/exercises` page MUST use SearchInput for search, Card for the exercise grid, EmptyState for no results, and Dialog/Sheet for the form, delete confirmation, and add-to-workout overlays. The duplicated `FilterSelect` definitions MUST NOT be duplicated further; consolidating it is a future change, and touching it MUST preserve behavior.

| ID | Description | Keyword |
|----|-------------|---------|
| PMD-2a | Search uses SearchInput | MUST |
| PMD-2b | Exercise cards use Card | MUST |
| PMD-2c | No results uses EmptyState | MUST |
| PMD-2d | Overlays use Dialog/Sheet | MUST |

#### Scenario: Search behavior preserved
- GIVEN the /exercises page
- WHEN typing a query in SearchInput
- THEN the list filters as before

#### Scenario: No results
- GIVEN a query with no matches
- THEN EmptyState renders a clear message

#### Scenario: Delete confirmation
- GIVEN a user deleting an exercise
- THEN a Dialog confirms the destructive action before deletion

### Requirement: PMD-3 — Primitive usage rule

Migrated pages MUST use only primitives that exist in `src/components/ui/` with stories (see ui-primitives spec) and MUST NOT introduce new inline patterns the primitives already cover.

#### Scenario: No new inline patterns
- GIVEN a migrated page diff
- WHEN reviewing it
- THEN no new hardcoded colors or duplicated patterns appear

### Requirement: PMD-4 — No behavioral regression

Migration MUST NOT change functionality: navigation, filtering, favorite toggles, and dialog flows behave identically, and existing tests MUST keep passing.

#### Scenario: Regression check
- GIVEN migrated pages
- WHEN running the test suite and a manual smoke test
- THEN no failures occur and flows behave as before
