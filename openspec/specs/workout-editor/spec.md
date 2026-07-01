# Workout Editor

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| WE-1 | Editor SHALL render intervals as glass cards (bg-surface/80, backdrop-blur-md, border-outline-variant/30) with 4px left accent border colored by segment type, drag_indicator icon, and description text. A timeline strip SHALL render above the list for proportional visual overview, including a legend row with 4 segment color dots + labels below the bar. | MUST |
| WE-2 | Add interval at any position; default duration 30s for Work, 15s for Rest/Prepare/CoolDown | MUST |
| WE-3 | Remove interval via delete button on each row | MUST |
| WE-4 | Editor SHALL render drag_indicator icon (visual affordance) alongside existing move up/down buttons. Full drag-and-drop reordering is deferred. | MUST |
| WE-5 | Duration input SHALL use JetBrains Mono data-lg (20px), transparent bg, border-bottom only, focus glow in secondary-container/terracotta. Range [5, 600] unchanged. Interval type SHALL be changeable via Add Block grid (new intervals) or via detail sheet (existing intervals). Dropdown removed. | MUST |
| WE-6 | Work intervals SHALL use the `ExercisePicker` component (drawing from the exercise library) instead of a hardcoded exercise list or free-text input. Non-Work intervals MUST NOT show exercise picker — unchanged from previous behavior | MUST |
| WE-7 | First interval auto-set to `type: 'prepare'` when workout is empty | SHOULD |
| WE-8 | Last interval auto-set to `type: 'cooldown'` when only one interval remains | SHOULD |
| WE-9 | Warn before navigating away with unsaved changes | SHOULD |
| WE-10 | WorkoutEditor SHALL be a shared "use client" component extracted from current new/edit duplication. New page (`/workouts/new`) SHALL render WorkoutEditor with empty initial state. Edit page (`/workouts/[id]/edit`) SHALL render WorkoutEditor with workout id for data hydration. | MUST |
| WE-11 | Tap on any interval row SHALL open a bottom-sheet modal (`<dialog>`) for detail editing | MUST |
| WE-12 | The bottom-sheet SHALL use the shared `ExercisePicker` component for the exerciseId field on Work intervals. Non-Work intervals SHALL NOT show any exercise field | MUST |
| WE-13 | Bottom-sheet SHALL contain controls for `cycleCount`, `setCount`, `restBetweenCycles` when interval is a group/cycle | MUST |
| WE-14 | Bottom-sheet SHALL have Save and Cancel actions — Save persists changes, Cancel reverts | MUST |
| WE-15 | Bottom-sheet SHALL animate as CSS slide-up from bottom; no external animation library | MUST |
| WE-16 | *(Superseded — behavior absorbed into WE-21)* Editor SHALL display a horizontal timeline strip at the top showing all intervals as proportionally-sized colored blocks with legend | MUST |
| WE-17 | Timeline SHALL indent child intervals visually (left padding/margin/border offset) to indicate nesting | MUST |
| WE-18 | Current/selected interval in timeline SHALL have a visible highlight state | MUST |
| WE-19 | Both bottom-sheet and timeline SHALL use Tailwind CSS only — no SVG, canvas, or external chart libs | MUST |
| WE-20 | Header SHALL be glass card (bg-surface/80, backdrop-blur-md, 1px border-outline-variant/30, rounded-xl) with title input (border-b-2, focus glow secondary-container) + JetBrains Mono est. duration | MUST |
| WE-21 | Timeline strip SHALL be h-4 rounded-full, bg-surface-dim, shadow-inner, segments as colored divs (seg-prepare/sky, seg-work/emerald, seg-rest/red, seg-cooldown/violet); legend row below with 4 colored dots + label-caps labels | MUST |
| WE-22 | Add Block SHALL be 2x2 (mobile) / 4-col (desktop) grid of glass cards, one per interval type, each with type icon, label-caps label, top-2 border accent matching segment color; hover lift effect (-translate-y-1, shadow-md) | MUST |
| WE-23 | Cycle visual SHALL render left bracket (absolute, border-l-2 + border-t-2 + border-b-2, rounded-l-lg) around grouped intervals, header with name + total duration badge, repeats select (x2–x6) | MUST |
| WE-24 | Action bar SHALL show Discard (ghost, border-outline-variant) + Save (primary-container, save icon, ambient-shadow) buttons; mobile variant fixed bottom with surface/80 backdrop-blur-md | MUST |
| WE-25 | Shared WorkoutEditor component SHALL extract all editor state/logic from new/edit pages; new page passes empty initial state, edit page passes workout id for hydration | SHOULD |
| WL-1 | List SHALL render workouts in responsive grid: 1 col mobile (<768px), 2 col tablet (768–1024px), 3 col desktop (>1024px) | MUST |
| WL-2 | Card SHALL display title, duration, h-2 timeline preview bar (colored by segment), equipment chips (pill-shaped, bg-surface-dim, label-caps) | MUST |
| WL-3 | Empty list SHALL show illustration + "Create your first workout" CTA button linking to /workouts/new | MUST |
| WL-4 | Mobile viewport SHALL render FAB (primary-container bg, add icon, fixed bottom-right, w-14 h-14 rounded-full, hover scale-105) | MUST |
| WL-5 | Top bar SHALL show search input (w-full md:w-96, search icon inside) + filter chip row (Type, Duration, Equipment) — placeholder UI only, no functional filtering | SHOULD |
| IR-1 | IntervalRow SHALL be glass card with 4px left border accent (segment color), drag_indicator icon (text-outline-variant, cursor-grab), type icon in tinted circle bg, title input (font-body-md semibold), desc line (text-[11px]), duration input (font-data-lg, border-bottom, focus glow), group-hover action buttons (copy + delete) | MUST |
| TS-1 | TimelineStrip SHALL be h-4, rounded-full, bg-surface-dim, shadow-inner, segments as colored divs with proportional widths; legend row below with 4 items (w-3 h-3 rounded-sm colored square + label-caps text) | MUST |
| IDS-1 | IntervalDetailSheet SHALL receive token-only migration: replace all old Burgundy tokens with Deep Nordic equivalents; no structural, behavioral, or animation changes | MUST |

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
- AND legend row renders below the bar with 4 colored items

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

### Scenario: Add interval via bento grid (WE-22a)
- GIVEN editor showing empty interval list
- WHEN user taps "Work" card in Add Block
- THEN a Work interval (30s default) appears as last item in the list

### Scenario: Cycle grouping (WE-23a)
- GIVEN 2+ intervals in the list
- WHEN user taps "Wrap in Cycle" button below Add Block
- THEN bracket visual wraps the intervals, cycle header shows name + total duration, repeats selector defaults to x4

### Scenario: Interval row visual rendering (IR-1a)
- GIVEN a Work interval with 04:00 duration
- THEN row shows emerald-500 left border, directions_run icon in emerald/10 bg, editable title, 04:00 in JetBrains Mono data-lg input

### Scenario: New vs Edit mode
- GIVEN user navigates to /workouts/new
- THEN editor renders with empty interval list and "Name your workout..." placeholder
- GIVEN user navigates to /workouts/abc123/edit
- THEN editor renders with intervals and title pre-filled from stored workout
