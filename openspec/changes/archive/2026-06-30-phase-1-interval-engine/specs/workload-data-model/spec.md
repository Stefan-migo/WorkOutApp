# Delta for Workload Data Model

## ADDED Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| DM-6 | `Interval` gains optional `children?: Interval[]` for nested/cycle structures | MUST |
| DM-7 | `Interval` gains optional `cycleCount?: number` defaulting to 1 — repetitions of a cycle group | MUST |
| DM-8 | `Interval` gains optional `setCount?: number` defaulting to 1 — sets within each cycle | MUST |
| DM-9 | `Interval` gains optional `restBetweenCycles?: number` defaulting to 0 — rest inserted between cycles | MUST |
| DM-10 | A parent interval (`children` present and non-empty) is a cycle container — its own `duration` is ignored; children define effective duration | MUST |

## MODIFIED Requirements

### Requirement: Define `Interval { id, type, title, duration, description?, exerciseId?, order }`

The type now supports nesting. Fields `children`, `cycleCount`, `setCount`, `restBetweenCycles` are optional with safe defaults.
(Previously: Interval was a flat leaf type with no nesting fields)

#### Scenario: Interval with children forms a cycle
- GIVEN an Interval with 2 children and `cycleCount=3`, `setCount=1`
- WHEN imported by any consumer
- THEN the interval is structurally valid and its children form a 3-cycle

#### Scenario: Optional fields absent on legacy data
- GIVEN an Interval loaded from localStorage (before this change)
- WHEN `children`, `cycleCount`, `setCount` are absent
- THEN they resolve to `undefined`, `1`, `1`, `0` respectively — no crash

## REMOVED Requirements

None.

## RENAMED Requirements

None.
