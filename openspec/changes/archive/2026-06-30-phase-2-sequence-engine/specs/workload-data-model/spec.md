# Workload Data Model — Delta

## ADDED Requirements

**Requirement: DM-11 — Sequence type**
The system MUST define `Sequence { id, title, description?, workoutIds[], createdAt, updatedAt }`.
(Previously: Sequence did not exist — only Workout and Interval were defined)

**Requirement: DM-12 — Session type**
The system MUST define `Session { id, sequenceId?, workoutId?, startedAt, completedAt?, intervals: CompletedInterval[] }`.
(Previously: no session tracking existed)

**Requirement: DM-13 — CompletedInterval type**
The system MUST define `CompletedInterval { intervalId, title, type, plannedDuration, actualDuration, completed }`.
(Previously: no completed-interval tracking existed)
