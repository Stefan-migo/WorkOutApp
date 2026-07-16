# Delta for Workout Editor

## MODIFIED Requirements

### Requirement: IR-1 — IntervalRow with exercise preview

| ID | Description | Keyword |
|----|-------------|---------|
| IR-1 | IntervalRow SHALL be glass card with 4px left border accent (segment color), drag_indicator icon (text-outline-variant, cursor-grab), type icon in tinted circle bg, title input (font-body-md semibold), desc line (text-[11px]), duration input (font-data-lg, border-bottom, focus glow), group-hover action buttons (copy + delete). When `exerciseId` is set on a Work interval, the row SHALL also display an exercise preview section with: image thumbnail (32x32, rounded), exercise name (link to `/exercises/[id]`), and primary muscles chips (max 2 shown). | MUST |

(Previously: No exercise preview section in IntervalRow)

#### Scenario: Work interval shows exercise preview
- GIVEN a Work interval with exerciseId set to "ex-1" (Push Up, primaryMuscles ["Chest", "Triceps"])
- WHEN the IntervalRow renders
- THEN below the title/desc, an exercise preview shows: 32x32 thumbnail, "Push Up" linking to `/exercises/ex-1`, chips "Chest" and "Triceps"

#### Scenario: Rest interval hides exercise preview
- GIVEN a Rest interval with no exerciseId
- WHEN the IntervalRow renders
- THEN no exercise preview section appears

### Requirement: WE-12 — DetailSheet with rich ExercisePicker

| ID | Description | Keyword |
|----|-------------|---------|
| WE-12 | The bottom-sheet SHALL use the shared `ExercisePicker` component (rich variant showing thumbnail, badges, metadata) for the exerciseId field on Work intervals. Non-Work intervals SHALL NOT show any exercise field. When an exercise is selected, the sheet SHALL display a mini preview card with expanded details (image, name, category, muscles, difficulty, force, mechanic, equipment, first 2 instructions). | MUST |

(Previously: Bottom-sheet used the shared ExercisePicker component without specifying rich variant or mini preview card)

#### Scenario: Detail sheet shows rich picker and preview
- GIVEN a Work interval in the detail sheet
- WHEN user taps the exercise field
- THEN the rich ExercisePicker opens with thumbnails and metadata
- AFTER selecting "Push Up", the sheet displays a mini preview card with expanded details

## ADDED Requirements

### Requirement: EP-13 — ExercisePanel accepts full Exercise object

| ID | Description | Keyword |
|----|-------------|---------|
| EP-13 | The timer `ExercisePanel` component SHALL accept a full `Exercise` object (not just exerciseId). It SHALL render: image gallery (scroll-snap), numbered instructions list (collapsible sections), all metadata chips (primary muscles, secondary muscles, equipment, force, mechanic, difficulty, category), and a source badge. | MUST |

#### Scenario: Panel renders full exercise data
- GIVEN a timer session for a Work interval with a full Exercise object
- WHEN the interval starts and ExercisePanel renders
- THEN image gallery displays, instructions are expandable, all metadata chips render, and source badge shows

#### Scenario: Panel without images
- GIVEN an Exercise object with empty images array
- WHEN ExercisePanel renders
- THEN SVG placeholder is shown instead of gallery

### Requirement: EP-14 — Full Exercise passed from play pages

| ID | Description | Keyword |
|----|-------------|---------|
| EP-14 | Both `/workouts/[id]/play` and `/sequences/[id]/play` SHALL look up the full `Exercise` object from the exercise library using the interval's `exerciseId` and pass it to `ExercisePanel`. If the exercise is not found, the panel SHALL show "Exercise not found" with the exerciseId. | MUST |

#### Scenario: Play page passes exercise data
- GIVEN a workout with interval referencing exercise "ex-1" which exists in the library
- WHEN `/workouts/[id]/play` renders the timer
- THEN the full Exercise object for "ex-1" is passed to ExercisePanel

#### Scenario: Deleted exercise shown as not found
- GIVEN a workout referencing an exercise that was deleted
- WHEN the timer play page renders
- THEN ExercisePanel shows "Exercise not found (ID: ex-999)"
