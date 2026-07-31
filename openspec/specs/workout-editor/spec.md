# Workout Editor

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| WE-1 | Editor SHALL render intervals as glass cards (bg-surface/80, backdrop-blur-md, border-outline-variant/30) with 4px left accent border colored by segment type, drag_indicator icon, and description text. A timeline strip SHALL render above the list for proportional visual overview, including a legend row with 5 segment color dots + labels below the bar (prepare, work, rest, rest_between_cycles, cooldown). | MUST |
| WE-2 | Add interval at any position; default duration 30s for Work, 15s for Rest/Prepare/CoolDown | MUST |
| WE-3 | Remove interval via delete button on each row | MUST |
| WE-4 | Editor SHALL render drag_indicator icon (visual affordance). Full drag-and-drop reordering SHALL work. Move up/down buttons SHALL be retained for accessibility. | MUST |
| WE-5 | Duration input SHALL use JetBrains Mono data-lg (20px), transparent bg, border-bottom only, focus glow in secondary-container/terracotta. Range [5, 600] unchanged. Interval type SHALL be changeable via Add Block grid (new intervals) or via detail sheet (existing intervals). Dropdown removed. | MUST |
| WE-6 | Work intervals SHALL use the `ExercisePicker` component (drawing from the exercise library) instead of a hardcoded exercise list or free-text input. Non-Work intervals MUST NOT show exercise picker — unchanged from previous behavior | MUST |
| WE-7 | First interval auto-set to `type: 'prepare'` when workout is empty | SHOULD |
| WE-8 | Last interval auto-set to `type: 'cooldown'` when only one interval remains | SHOULD |
| WE-9 | Warn before navigating away with unsaved changes | SHOULD |
| WE-10 | WorkoutEditor SHALL be a shared "use client" component extracted from current new/edit duplication. New page (`/workouts/new`) SHALL render WorkoutEditor with empty initial state. Edit page (`/workouts/[id]/edit`) SHALL render WorkoutEditor with workout id for data hydration. | MUST |
| WE-11 | Tap on any interval row SHALL open a bottom-sheet modal (`<dialog>`) for detail editing | MUST |
| WE-12 | The bottom-sheet SHALL use the shared `ExercisePicker` component (rich variant showing thumbnail, badges, metadata) for the exerciseId field on Work intervals. Non-Work intervals SHALL NOT show any exercise field. When an exercise is selected, the sheet SHALL display a mini preview card with expanded details (image, name, category, muscles, difficulty, force, mechanic, equipment, first 2 instructions). | MUST |
| WE-14 | Bottom-sheet SHALL have Save and Cancel actions — Save persists changes, Cancel reverts | MUST |
| WE-15 | Bottom-sheet SHALL animate as CSS slide-up from bottom; no external animation library | MUST |
| WE-16 | *(Superseded — behavior absorbed into WE-21)* Editor SHALL display a horizontal timeline strip at the top showing all intervals as proportionally-sized colored blocks with legend | MUST |
| WE-18 | Current/selected interval in timeline SHALL have a visible highlight state | MUST |
| WE-19 | Both bottom-sheet and timeline SHALL use Tailwind CSS only — no SVG, canvas, or external chart libs | MUST |
| WE-20 | Header SHALL be glass card (bg-surface/80, backdrop-blur-md, 1px border-outline-variant/30, rounded-xl) with title input (border-b-2, focus glow secondary-container) + JetBrains Mono est. duration | MUST |
| WE-21 | Timeline strip SHALL be h-4 rounded-full, bg-surface-dim, shadow-inner, segments as colored divs (seg-prepare/sky, seg-work/emerald, seg-rest/red, seg-rest-between-cycles/amber, seg-cooldown/violet); legend row below with 5 colored dots + label-caps labels | MUST |
| WE-22 | Add Block SHALL be a 2x3 (mobile) / 6-col (desktop) grid of glass cards, one per type (Prepare, Work, Rest, Rest Between Cycles, Cycle, Cool Down), each with type icon, label-caps label, top-2 border accent in segment color; hover lift effect (-translate-y-1, shadow-md) | MUST |
| WE-24 | Action bar SHALL show Discard (ghost, border-outline-variant) + Save (primary-container, save icon, ambient-shadow) buttons; mobile variant fixed bottom with surface/80 backdrop-blur-md | MUST |
| WE-25 | Shared WorkoutEditor component SHALL extract all editor state/logic from new/edit pages; new page passes empty initial state, edit page passes workout id for hydration | SHOULD |
| WL-1 | List SHALL render workouts in responsive grid: 1 col mobile (<768px), 2 col tablet (768–1024px), 3 col desktop (>1024px) | MUST |
| WL-2 | Card SHALL display title, duration, h-2 timeline preview bar (colored by segment), equipment chips (pill-shaped, bg-surface-dim, label-caps) | MUST |
| WL-3 | Empty list SHALL show illustration + "Create your first workout" CTA button linking to /workouts/new | MUST |
| WL-4 | Mobile viewport SHALL render FAB (primary-container bg, add icon, fixed bottom-right, w-14 h-14 rounded-full, hover scale-105) | MUST |
| WL-5 | Top bar SHALL show search input (w-full md:w-96, search icon inside) + filter chip row (Type, Duration, Equipment) — placeholder UI only, no functional filtering | SHOULD |
| IR-1 | IntervalRow SHALL be glass card with 4px left border accent (segment color), drag_indicator icon (text-outline-variant, cursor-grab), type icon in tinted circle bg, title input (font-body-md semibold), desc line (text-[11px]), duration input (font-data-lg, border-bottom, focus glow), group-hover action buttons (copy + delete). When `exerciseId` is set on a Work interval, the row SHALL also display an exercise preview section with: image thumbnail (32x32, rounded), exercise name (link to `/exercises/[id]`), and primary muscles chips (max 2 shown). When workout mode is `reps`, work intervals SHALL replace duration input with reps input (number min 1, font-data-lg bold primary color) | MUST |
| TS-1 | TimelineStrip SHALL be h-4, rounded-full, bg-surface-dim, shadow-inner, segments as colored divs with proportional widths; legend row below with 5 items (w-3 h-3 rounded-sm colored square + label-caps text) | MUST |
| IDS-1 | IntervalDetailSheet SHALL receive token-only migration: replace all old Burgundy tokens with Deep Nordic equivalents; no structural, behavioral, or animation changes | MUST |
| EP-13 | The timer `ExercisePanel` component SHALL accept a full `Exercise` object (not just exerciseId). It SHALL render: image gallery (scroll-snap), numbered instructions list (collapsible sections), all metadata chips (primary muscles, secondary muscles, equipment, force, mechanic, difficulty, category), and a source badge. | MUST |
| EP-14 | Both `/workouts/[id]/play` and `/sequences/[id]/play` SHALL look up the full `Exercise` object from the exercise library using the interval's `exerciseId` and pass it to `ExercisePanel`. If the exercise is not found, the panel SHALL show "Exercise not found" with the exerciseId. | MUST |
| WE-26 | Editor header SHALL render a `timed`/`reps` toggle. Switching to `reps` mode SHALL replace the duration badge with "N exercises · M total reps". Non-work intervals retain duration input | MUST |
| WE-27 | IntervalDetailSheet SHALL show "Reps" (number 1-999) and optional "Weight (kg)" fields for work intervals when workout mode is `reps`. Non-work intervals SHALL NOT show these fields regardless of mode | MUST |
| WE-28 | CycleTemplate SHALL add optional `mode?: 'timed' | 'reps'`. Builder SHALL show a mode toggle per cycle for mixed-mode cycles | MUST |

## Scenarios

### Scenario: Build a basic workout
- GIVEN an empty editor
- WHEN user adds 3 Work intervals and assigns exercises
- THEN list shows 4 intervals (Prepare + 3 Work + CoolDown auto-suggested)

### Scenario: Remove all intervals
- GIVEN a workout with 2 intervals
- WHEN user removes both
- THEN editor shows empty state with "Add interval" prompt

### Scenario: Assign exercise to Rest interval
- GIVEN a Rest interval
- WHEN user tries to select an exercise
- THEN exercise picker is hidden — Rest intervals have no exercise assignment

### Scenario: Edit duration out of bounds
- GIVEN a Work interval with default 30s
- WHEN user enters `600` or `3`
- THEN validation clamps to `[5, 600]` range

### Scenario: Tap interval opens sheet
- GIVEN a workout with 4 intervals in the editor
- WHEN user taps an interval row
- THEN a bottom-sheet slides up with editable fields pre-filled from that interval

### Scenario: Work interval shows exercise preview
- GIVEN a Work interval with exerciseId set to "ex-1" (Push Up, primaryMuscles ["Chest", "Triceps"])
- WHEN the IntervalRow renders
- THEN below the title/desc, an exercise preview shows: 32x32 thumbnail, "Push Up" linking to `/exercises/ex-1`, chips "Chest" and "Triceps"

### Scenario: Rest interval hides exercise preview
- GIVEN a Rest interval with no exerciseId
- WHEN the IntervalRow renders
- THEN no exercise preview section appears

### Scenario: Detail sheet shows rich picker and preview
- GIVEN a Work interval in the detail sheet
- WHEN user taps the exercise field
- THEN the rich ExercisePicker opens with thumbnails and metadata
- AFTER selecting "Push Up", the sheet displays a mini preview card with expanded details

### Scenario: Panel renders full exercise data
- GIVEN a timer session for a Work interval with a full Exercise object
- WHEN the interval starts and ExercisePanel renders
- THEN image gallery displays, instructions are expandable, all metadata chips render, and source badge shows

### Scenario: Panel without images
- GIVEN an Exercise object with empty images array
- WHEN ExercisePanel renders
- THEN SVG placeholder is shown instead of gallery

### Scenario: Play page passes exercise data
- GIVEN a workout with interval referencing exercise "ex-1" which exists in the library
- WHEN `/workouts/[id]/play` renders the timer
- THEN the full Exercise object for "ex-1" is passed to ExercisePanel

### Scenario: Deleted exercise shown as not found
- GIVEN a workout referencing an exercise that was deleted
- WHEN the timer play page renders
- THEN ExercisePanel shows "Exercise not found (ID: ex-999)"

### Scenario: Picker shows library exercises
- GIVEN a Work interval in IntervalForm
- WHEN user opens the exercise picker
- THEN the picker renders exercises from `workoutapp.exercises` with search and category filter

### Scenario: Quick-create from picker in IntervalForm
- GIVEN a Work interval with no exercise assigned
- WHEN user clicks "+" in the picker and creates a new exercise
- THEN the new exercise is selected and assigned immediately

### Scenario: Detail sheet shows exercise picker
- GIVEN a Work interval in the detail sheet
- WHEN user taps the exercise field
- THEN the shared ExercisePicker opens with search and filter

### Scenario: Timeline shows 10 intervals with legend
- GIVEN a workout with 10 intervals of varying durations
- WHEN the editor loads
- THEN timeline blocks are sized proportionally and fit viewport width
- AND legend row renders below the bar with 5 colored items

### Scenario: Empty workout list (WL-3a)
- GIVEN user has no saved workouts
- WHEN navigating to /workouts
- THEN empty state renders with illustration and CTA
- AND no cards appear in grid

### Scenario: Responsive grid columns (WL-1a)
- GIVEN 6 saved workouts
- WHEN viewport is 600px wide
- THEN cards render in 1 column
- WHEN viewport is 900px wide
- THEN cards render in 2 columns
- WHEN viewport is 1400px wide
- THEN cards render in 3 columns

### Scenario: Add interval via grid (WE-22a)
- GIVEN editor showing empty interval list
- WHEN user taps "Work" card in Add Block
- THEN a Work interval (30s default) appears as last item in the list

### Scenario: Interval row visual rendering (IR-1a)
- GIVEN a Work interval with 04:00 duration
- THEN row shows emerald-500 left border, directions_run icon in emerald/10 bg, editable title, 04:00 in JetBrains Mono data-lg input

### Scenario: Toggle to reps mode
- GIVEN a workout with 3 work intervals in the editor
- WHEN user toggles mode to `'reps'`
- THEN header shows "3 exercises · 0 total reps"
- THEN work interval rows show reps input (span 1-999) instead of MM:SS duration
- THEN rest/prepare/cooldown rows keep duration input

### Scenario: Toggle back to timed
- GIVEN a reps-mode workout with reps values set
- WHEN user toggles to `'timed'`
- THEN all intervals revert to duration display
- THEN reps values are preserved in the interval but hidden

### Scenario: Work interval sheet in reps mode
- GIVEN a work interval in a reps-mode workout
- WHEN IntervalDetailSheet opens
- THEN "Reps" input appears with value from interval.reps (default empty)
- THEN "Weight (kg)" optional input appears
- THEN saving writes reps and weight to the interval

### Scenario: Mixed-mode cycle in builder
- GIVEN a CycleTemplate in the builder
- WHEN user sets mode to `'reps'`
- THEN the expanded intervals from the cycle inherit that mode

### Scenario: Reps input on work row
- GIVEN a work interval with `reps: 12` in reps-mode workout
- WHEN IntervalRow renders
- THEN duration field is replaced by "12" reps input, centered, bold, primary color

### Scenario: Timed mode unchanged
- GIVEN a work interval in timed-mode workout
- WHEN IntervalRow renders
- THEN MM:SS duration input shows unchanged

### Scenario: New vs Edit mode
- GIVEN user navigates to /workouts/new
- THEN editor renders with empty interval list and "Name your workout..." placeholder
- GIVEN user navigates to /workouts/abc123/edit
- THEN editor renders with intervals and title pre-filled from stored workout
