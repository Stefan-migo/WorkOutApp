# Delta for Exercise Library

## ADDED Requirements

### Requirement: EL-12 — Add-to-workout flow from exercise card

The system MUST, when the user clicks "Add to Workout" on an exercise card, navigate to `/workouts/new` with the selected exercise pre-populated as a single-interval workout. The pre-populated interval SHALL use the exercise name as its title and SHALL default to `work` type with 60s duration.

(Previously: the button navigated to an empty new workout without adding the exercise — misleading UX.)

#### Scenario: Add exercise creates prepopulated workout

- GIVEN an exercise "Push Up" exists in the library
- WHEN user clicks "Add to Workout" on the Push Up card
- THEN the system navigates to `/workouts/new`
- AND the new workout contains one interval with title "Push Up", type `work`, duration 60s, and `exerciseId` referencing the clicked exercise

#### Scenario: Multiple add-to-workout calls create separate workouts

- GIVEN two exercises "Push Up" and "Squat"
- WHEN user clicks "Add to Workout" on Push Up, then on Squat
- THEN two separate navigations to `/workouts/new` occur
- AND each new workout contains exactly one interval (the respective exercise)
