# Delta for Workload Data Model

## ADDED Requirements

### Requirement: DM-17 — IntervalType

Define `IntervalType = 'prepare' | 'work' | 'rest' | 'rest_between_cycles' | 'cooldown'`.

#### Scenario: rest_between_cycles is valid
- GIVEN an Interval with `type: 'rest_between_cycles'`
- WHEN validated
- THEN it is structurally valid

### Requirement: DM-18 — Cycle (transient)

Define `Cycle { id: string, title: string, repeat: number, workDuration: number, restDuration: number, skipLastRest: boolean }`. Cycle SHALL NOT be persisted to localStorage — it exists only during creation in the Workout Builder.

#### Scenario: Cycle created with defaults
- GIVEN the builder creates a new Cycle
- WHEN inspected
- THEN repeat=4, workDuration=30, restDuration=15, skipLastRest=true

## MODIFIED Requirements

### Requirement: DM-1 — Interval type definition

Define `Interval { id, type: IntervalType, title, duration, description?, exerciseId?, order, imageUrl? }`.
(Previously: Interval included optional `children?`, `cycleCount?`, `setCount?`, `restBetweenCycles?`, `collapseTrailingRest?`, `isGenerated?`. These nesting fields are removed. Added `imageUrl` for external image references.)

#### Scenario: Create interval for each type
- GIVEN valid parameters for each interval type
- WHEN creating Interval objects for prepare, work, rest, rest_between_cycles, and cooldown
- THEN all five objects are structurally valid

#### Scenario: imageUrl on interval
- GIVEN an interval with `imageUrl: 'https://example.com/demo.png'`
- WHEN validated
- THEN it is structurally valid

### Requirement: DM-2 — Workout type definition

Define `Workout { id, name, description?, imageUrl?, intervals: Interval[], createdAt, updatedAt }`.
(Previously: Workout had no description or imageUrl.)

#### Scenario: Workout with description and imageUrl
- GIVEN a Workout with description and imageUrl set
- WHEN inspected
- THEN both optional fields are present

## REMOVED Requirements

### Requirement: DM-6 — Optional children on Interval
(Reason: No nested/cycle structures in flat model.)

### Requirement: DM-7 — Optional cycleCount on Interval (default 1)
(Reason: Cycle is a separate transient type, not an Interval field.)

### Requirement: DM-8 — Optional setCount on Interval (default 1)
(Reason: Cycle is a separate transient type, not an Interval field.)

### Requirement: DM-9 — Optional restBetweenCycles on Interval (default 0)
(Reason: Cycle is a separate transient type, not an Interval field.)

### Requirement: DM-10 — Parent interval with children is a cycle container
(Reason: Flat model has no parent/child relationship among Intervals.)

### Scenario: Interval with children forms a cycle
(Reason: Children field removed from Interval.)

### Scenario: Optional fields absent on legacy data (nesting defaults)
(Reason: children/cycleCount/setCount fields no longer exist on Interval. Migration is handled by MG-1 through MG-3.)

## UNCHANGED Requirements

The following requirements are unchanged from the main spec:

- DM-3: Exercise type definition
- DM-4: Plain .ts interfaces, no classes
- DM-5: Export all types from types.ts
- DM-11 through DM-15: Sequence, Session, CompletedInterval, WeekPlan, ProgramTemplate
- DM-16: ExerciseCategory enum
