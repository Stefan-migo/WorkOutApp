# Sequence Player

**Purpose**: Iterate through a sequence's workouts, running each workout's timer.

## Requirements

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

## Scenarios

### Scenario: Complete all 6 rounds
- GIVEN sequence with 2 workouts × 3 repeats
- WHEN player iterates through all 6 rounds
- THEN each round fetches fresh workout data, `Session` logged with 6 workouts' intervals

### Scenario: Skip to next
- GIVEN workout A is running
- WHEN user taps "Skip to next"
- THEN workout A stops, summary shown, auto-countdown starts for workout B

### Scenario: Complete last round
- GIVEN at last workout of last round
- WHEN user completes it
- THEN session saved to `workoutapp.sessions`, player shows "Sequence complete"
