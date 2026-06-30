# Local Persistence — Delta

## ADDED Requirements

**Requirement: LP-9 — Persist sequences**
The system MUST save/lists sequences under key `workoutapp.sequences` using the same try/catch SSR-safe pattern from LP-1.
(New key — extends storage surface)

**Requirement: LP-10 — Persist sessions**
The system MUST append sessions under key `workoutapp.sessions` using the same pattern.
(New key — extend storage surface, append-only)

### Scenario: Load sequences on app start
- GIVEN 2 saved sequences in localStorage
- WHEN the sequence list page loads
- THEN both sequences appear with workout count and total duration

### Scenario: Corrupted sequences key
- GIVEN `workoutapp.sequences` contains invalid JSON
- WHEN the sequence list loads
- THEN list is empty, no error thrown
