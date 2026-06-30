# Phase 2 — Sequence Engine: Specs

## Workload Data Model — Delta

### ADDED Types

**Requirement: DM-11 — Sequence type**
The system MUST define `Sequence { id, title, description?, workoutIds[], createdAt, updatedAt }`.
(Previously: Sequence did not exist — only Workout and Interval were defined)

**Requirement: DM-12 — Session type**
The system MUST define `Session { id, sequenceId?, workoutId?, startedAt, completedAt?, intervals: CompletedInterval[] }`.
(Previously: no session tracking existed)

**Requirement: DM-13 — CompletedInterval type**
The system MUST define `CompletedInterval { intervalId, title, type, plannedDuration, actualDuration, completed }`.
(Previously: no completed-interval tracking existed)

## Local Persistence — Delta

### ADDED Requirements

**Requirement: LP-9 — Persist sequences**
The system MUST save/lists sequences under key `workoutapp.sequences` using the same try/catch SSR-safe pattern from LP-1.
(New key — extends storage surface)

**Requirement: LP-10 — Persist sessions**
The system MUST append sessions under key `workoutapp.sessions` using the same pattern.
(New key — extend storage surface, append-only)

#### Scenario: Load sequences on app start
- GIVEN 2 saved sequences in localStorage
- WHEN the sequence list page loads
- THEN both sequences appear with workout count and total duration

#### Scenario: Corrupted sequences key
- GIVEN `workoutapp.sequences` contains invalid JSON
- WHEN the sequence list loads
- THEN list is empty, no error thrown

## Sequence Engine — New Spec

**Purpose**: Pure functions that compute sequence navigation state — consumed by the sequence player, no side effects.

| ID | Description | Keyword |
|----|-------------|---------|
| SE-1 | Compute total rounds = workoutIds.length × repeatCount | MUST |
| SE-2 | Return workout ID + round number for a given index | MUST |
| SE-3 | Return next workout ID given current index; null if done | MUST |
| SE-4 | Detect if sequence is complete (index >= totalRounds) | MUST |
| SE-5 | Return progress as `{ current, total, percent }` | MUST |

#### Scenario: 3 workouts × 2 repeats yields 6 rounds
- GIVEN `{ workoutIds: [a,b,c], repeatCount: 2 }`
- WHEN `getTotalRounds(seq)` is called
- THEN result is 6

#### Scenario: Progress at round 3 of 6
- GIVEN a sequence with totalRounds=6, currentIndex=3
- WHEN `getProgress(seq, 3)` is called
- THEN `{ current: 4, total: 6, percent: 66 }`

## Sequence Editor — New Spec

**Purpose**: Create sequences by selecting saved workouts.

| ID | Description | Keyword |
|----|-------------|---------|
| ED-1 | Form with title (required), description (optional), repeatCount (1-99) | MUST |
| ED-2 | Picklist of saved workouts; filter by name | MUST |
| ED-3 | Add workouts to sequence; reorder via drag or move up/down | MUST |
| ED-4 | Remove workout from sequence list | MUST |
| ED-5 | Validate: no duplicate workout IDs, at least 1 workout | MUST |
| ED-6 | Save creates `Sequence` with unique ID, timestamps, persists to `workoutapp.sequences` | MUST |
| ED-7 | On save, navigate to `/sequences/[id]/play` | SHOULD |

#### Scenario: Create sequence with 3 workouts, repeat=2
- GIVEN 5 saved workouts
- WHEN user picks 3, sets repeatCount=2, saves
- THEN sequence persists with 3 workoutIds, repeatCount=2, and non-null timestamps

#### Scenario: Duplicate workout rejected
- GIVEN 2 saved workouts A and B
- WHEN user adds A, then adds A again
- THEN UI shows validation error, save disabled

#### Scenario: Empty sequence rejected
- GIVEN no workouts selected
- WHEN user clicks save
- THEN UI shows "At least 1 workout required", save disabled

## Sequence Player — New Spec

**Purpose**: Iterate through a sequence's workouts, running each workout's timer.

| ID | Description | Keyword |
|----|-------------|---------|
| SP-1 | Load current workout from localStorage by ID at each transition | MUST |
| SP-2 | Run workout timer using `useTimer` and `flattenWorkout` | MUST |
| SP-3 | On workout completion, show brief summary (duration, intervals done) | MUST |
| SP-4 | Auto-advance to next workout after a 5s countdown | MUST |
| SP-5 | Skip-to-next-workout button during active timer | MUST |
| SP-6 | After all rounds complete, log Session to `workoutapp.sessions` | MUST |
| SP-7 | Display progress: "Workout N of M" + progress bar | MUST |
| SP-8 | Re-fetch workout from localStorage at each workout boundary | MUST |

#### Scenario: Complete all 6 rounds
- GIVEN sequence with 2 workouts × 3 repeats
- WHEN player iterates through all 6 rounds
- THEN each round fetches fresh workout data, `Session` logged with 6 workouts' intervals

#### Scenario: Skip to next
- GIVEN workout A is running
- WHEN user taps "Skip to next"
- THEN workout A stops, summary shown, auto-countdown starts for workout B

#### Scenario: Complete last round
- GIVEN at last workout of last round
- WHEN user completes it
- THEN session saved to `workoutapp.sessions`, player shows "Sequence complete"

## Session History — New Spec

**Purpose**: Log and review completed workout/sequence sessions.

| ID | Description | Keyword |
|----|-------------|---------|
| SH-1 | List sessions ordered by startedAt descending | MUST |
| SH-2 | Each entry shows: date, type (workout/sequence), duration, name | MUST |
| SH-3 | Session detail page shows all intervals with planned vs actual duration | MUST |
| SH-4 | "Repeat" button on session detail loads source workouts and starts timer | MUST |
| SH-5 | Repeat re-fetches workouts from localStorage (no snapshot) | MUST |
| SH-6 | Append-only — no delete in MVP | MUST NOT |

#### Scenario: Session logged after single workout
- GIVEN a single workout played standalone
- WHEN timer completes
- THEN a Session with `type: 'workout'`, 0s `sequenceId`, workoutId set, intervals populated

#### Scenario: Session logged after sequence
- GIVEN a sequence of 3 workouts completes
- THEN a Session with `type: 'sequence'`, sequenceId set, all intervals from all workouts

#### Scenario: Repeat loads current data
- GIVEN a session from yesterday where workout intervals have since been edited
- WHEN user taps "Repeat"
- THEN the player loads the CURRENT version of the workout from localStorage
