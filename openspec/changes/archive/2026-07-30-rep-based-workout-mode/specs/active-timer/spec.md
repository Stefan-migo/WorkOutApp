# Delta for Active Timer

## ADDED Requirements

### Requirement: AT-22 — Rep-mode detection on load

Play page SHALL detect `workout.mode` at load. If `'reps'` OR any interval has `mode: 'reps'`, the timer SHALL handle work intervals as manual-advance with no countdown. Non-rep intervals keep existing timer behavior.

#### Scenario: Detect reps workout
- GIVEN a workout with `mode: 'reps'`
- WHEN play page loads
- THEN first work interval renders exercise + reps, no timer ring, "Complete" button visible
- THEN rest intervals render timer ring normally

### Requirement: AT-23 — Manual advance for rep work

Rep-mode work intervals SHALL NOT run the timer. UI SHALL show exercise name + target reps prominently. A "Complete" button SHALL skip the timer and advance to the next interval.

#### Scenario: Complete advances
- GIVEN play on a rep-mode work interval
- WHEN user taps "Complete"
- THEN interval is marked completed in session
- THEN play advances to next interval (rest or next work)

### Requirement: AT-24 — Post-completion rep dialog

On "Complete", system SHALL show a dialog: "How many reps?" (default: plannedReps) and "Weight (kg)?" (optional number). "Save" stores actualReps/weight and advances. "Cancel" advances without actual data.

#### Scenario: Save actual reps/weight
- GIVEN a work interval with plannedReps=12
- WHEN "Complete" → enter 10 reps + 20kg → "Save"
- THEN CompletedInterval stores plannedReps=12, actualReps=10, weight=20

#### Scenario: Cancel skips recording
- GIVEN a work interval with plannedReps=12
- WHEN "Complete" → "Cancel"
- THEN CompletedInterval stores plannedReps only, actualReps and weight absent

### Requirement: AT-25 — +10/+20/+30s buttons on rest intervals

Rest and rest_between_cycles intervals in reps-mode workouts SHALL render three buttons: "+10s", "+20s", "+30s" below the 3-button controls. Each SHALL call `useTimer.addTime(n)`.

#### Scenario: Add time to rest
- GIVEN rest interval at 00:30 in reps-mode workout
- WHEN user taps "+10s"
- THEN timeLeft becomes 00:40

#### Scenario: Add time clips at max
- GIVEN rest interval at 00:55 (duration 60s)
- WHEN user taps "+10s"
- THEN timeLeft clips to 01:00 (duration cap)

### Requirement: AT-26 — Per-interval mode switching

Play page SHALL check `interval.mode` on each interval. If set, it overrides `workout.mode` for that interval. Switching between timed and rep mode per interval SHALL update the UI (timer ring ↔ exercise + reps) dynamically.

#### Scenario: Mixed cycle switching
- GIVEN intervals [Work(12 reps, mode='reps'), Work(30s, mode='timed')]
- WHEN playing first interval
- THEN UI shows reps mode (exercise + reps + "Complete")
- WHEN advancing to second
- THEN UI shows timed mode (timer ring + countdown)
