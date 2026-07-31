# Rep-Based Workout Mode

## Purpose

Allow workouts to operate in rep-based mode (strength training) instead of timed mode. Work intervals show exercise + target reps with manual advance. Rest intervals keep timer with "+10/+20/+30s" add-time buttons.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| RM-1 | Workout SHALL have optional `mode: 'timed' | 'reps'` field. Absent defaults to `'timed'` (legacy backward compat) | MUST |
| RM-2 | Interval SHALL have optional `reps: number` for work intervals in reps mode | MUST |
| RM-3 | Interval SHALL have optional `weight: number` for work intervals in reps mode | MAY |
| RM-4 | Interval SHALL have optional `mode: 'timed' | 'reps'` per-interval override for mixed cycles | MAY |
| RM-5 | CompletedInterval SHALL have optional `plannedReps`, `actualReps`, `weight` fields | MUST |
| RM-6 | Play mode SHALL detect `workout.mode` on load: `'reps'` → manual advance for work, timer for rest | MUST |
| RM-7 | Rep-mode work intervals SHALL display exercise + target reps, no countdown, "Complete" button | MUST |
| RM-8 | On "Complete", system SHALL show dialog inputting actualReps (default: plannedReps) + optional weight | MUST |
| RM-9 | Rest intervals in reps mode SHALL show "+10s", "+20s", "+30s" buttons alongside timer controls | MUST |
| RM-10 | Mixed cycles SHALL honor per-interval `mode` override, switching between timer and manual-advance per interval | MUST |
| RM-11 | Rep-mode workout inside a sequence SHALL fall back to timed behavior (sequences remain timed-only) | MUST |
| RM-12 | Editor SHALL show `timed`/`reps` toggle in header, changing display of work interval inputs | MUST |

## Scenarios

### Scenario: Legacy workout loads as timed
- GIVEN a workout with no `mode` field
- WHEN loaded into play
- THEN timer runs as today (timed behavior)

### Scenario: Pure reps workout
- GIVEN a workout with `mode: 'reps'`, work intervals with reps 12, 8, 10
- WHEN played
- THEN work intervals show "12 reps" + "Complete" button, no countdown
- THEN rest intervals show timer with "+10/+20/+30s" buttons
- THEN "Complete" opens dialog defaulting to 12 reps with optional weight field

### Scenario: Mixed interval modes
- GIVEN a cycle with Work(12 reps, mode='reps') + Work(30s plank, mode='timed')
- WHEN played
- THEN first interval shows "12 reps" + "Complete"
- THEN second interval shows 30s countdown timer

### Scenario: Cancel rep dialog
- GIVEN a rep-mode work interval
- WHEN user taps "Complete" then "Cancel" on dialog
- THEN CompletedInterval stores plannedReps only, actualReps absent
- THEN play advances to next interval
