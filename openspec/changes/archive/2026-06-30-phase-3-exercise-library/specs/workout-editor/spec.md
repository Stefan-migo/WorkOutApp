# Delta — Workout Editor

## MODIFIED Requirements

### WE-6: Assign exercise via ExercisePicker on Work intervals

Work intervals SHALL use the `ExercisePicker` component (drawing from the exercise library) instead of a hardcoded exercise list or free-text input. Non-Work intervals MUST NOT show exercise picker — unchanged from previous behavior.
(Previously: "Assign exercise to Work intervals only — non-Work intervals MUST NOT show exercise picker")

#### Scenario: Picker shows library exercises
- GIVEN a Work interval in IntervalForm
- WHEN user opens the exercise picker
- THEN the picker renders exercises from `workoutapp.exercises` with search and category filter

#### Scenario: Quick-create from picker in IntervalForm
- GIVEN a Work interval with no exercise assigned
- WHEN user clicks "+" in the picker and creates a new exercise
- THEN the new exercise is selected and assigned immediately

### WE-12: Detail sheet uses ExercisePicker for exerciseId

The bottom-sheet SHALL use the shared `ExercisePicker` component for the exerciseId field on Work intervals. Non-Work intervals SHALL NOT show any exercise field.
(Previously: "Bottom-sheet SHALL contain fields: title, duration, description, exerciseId (Work intervals only)")

#### Scenario: Detail sheet shows exercise picker
- GIVEN a Work interval in the detail sheet
- WHEN user taps the exercise field
- THEN the shared ExercisePicker opens with search and filter

## REMOVED Requirements

### WE-6 (implicit): Hardcoded exercise list

(Reason: Exercise selection now draws from persistent library via ExercisePicker component)
(Migration: Replace `getExercises()` import with `useExercises()` hook + ExercisePicker component)
