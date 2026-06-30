# Delta for Workout Editor

## ADDED Requirements

### Workout List Page

| ID | Description | Pri | Keyword |
|----|-------------|-----|---------|
| WL-1 | List SHALL render workouts in responsive grid: 1 col mobile (<768px), 2 col tablet (768–1024px), 3 col desktop (>1024px) | P0 | MUST |
| WL-2 | Card SHALL display title, duration, h-2 timeline preview bar (colored by segment), equipment chips (pill-shaped, bg-surface-dim, label-caps) | P0 | MUST |
| WL-3 | Empty list SHALL show illustration + "Create your first workout" CTA button linking to /workouts/new | P0 | MUST |
| WL-4 | Mobile viewport SHALL render FAB (primary-container bg, add icon, fixed bottom-right, w-14 h-14 rounded-full, hover scale-105) | P0 | MUST |
| WL-5 | Top bar SHALL show search input (w-full md:w-96, search icon inside) + filter chip row (Type, Duration, Equipment) — placeholder UI only, no functional filtering | P1 | SHOULD |

### Workout Editor Additions

| ID | Description | Pri | Keyword |
|----|-------------|-----|---------|
| WE-20 | Header SHALL be glass card (bg-surface/80, backdrop-blur-md, 1px border-outline-variant/30, rounded-xl) with title input (border-b-2, focus glow secondary-container) + JetBrains Mono est. duration | P0 | MUST |
| WE-21 | Timeline strip SHALL be h-4 rounded-full, bg-surface-dim, shadow-inner, segments as colored divs (seg-prepare/sky, seg-work/emerald, seg-rest/red, seg-cooldown/violet); legend row below with 4 colored dots + label-caps labels | P0 | MUST |
| WE-22 | Add Block SHALL be 2x2 (mobile) / 4-col (desktop) grid of glass cards, one per interval type, each with type icon, label-caps label, top-2 border accent matching segment color; hover lift effect (-translate-y-1, shadow-md) | P0 | MUST |
| WE-23 | Cycle visual SHALL render left bracket (absolute, border-l-2 + border-t-2 + border-b-2, rounded-l-lg) around grouped intervals, header with name + total duration badge, repeats select (x2–x6) | P0 | MUST |
| WE-24 | Action bar SHALL show Discard (ghost, border-outline-variant) + Save (primary-container, save icon, ambient-shadow) buttons; mobile variant fixed bottom with surface/80 backdrop-blur-md | P0 | MUST |
| WE-25 | Shared WorkoutEditor component SHALL extract all editor state/logic from new/edit pages; new page passes empty initial state, edit page passes workout id for hydration | P1 | SHOULD |

### Component Visual Requirements

| ID | Description | Pri | Keyword |
|----|-------------|-----|---------|
| IR-1 | IntervalRow SHALL be glass card with 4px left border accent (segment color), drag_indicator icon (text-outline-variant, cursor-grab), type icon in tinted circle bg, title input (font-body-md semibold), desc line (text-[11px]), duration input (font-data-lg, border-bottom, focus glow), group-hover action buttons (copy + delete) | P0 | MUST |
| TS-1 | TimelineStrip SHALL be h-4, rounded-full, bg-surface-dim, shadow-inner, segments as colored divs with proportional widths; legend row below with 4 items (w-3 h-3 rounded-sm colored square + label-caps text) | P0 | MUST |
| IDS-1 | IntervalDetailSheet SHALL receive token-only migration: replace all old Burgundy tokens with Deep Nordic equivalents; no structural, behavioral, or animation changes | P0 | MUST |

### Scenarios

**WL-3a: Empty workout list**
- GIVEN user has no saved workouts
- WHEN navigating to /workouts
- THEN empty state renders with illustration and CTA
- AND no cards appear in grid

**WL-1a: Responsive grid columns**
- GIVEN 6 saved workouts
- WHEN viewport is 600px wide
- THEN cards render in 1 column
- WHEN viewport is 900px wide
- THEN cards render in 2 columns
- WHEN viewport is 1400px wide
- THEN cards render in 3 columns

**WE-22a: Add interval via bento grid**
- GIVEN editor showing empty interval list
- WHEN user taps "Work" card in Add Block
- THEN a Work interval (30s default) appears as last item in the list

**WE-23a: Cycle grouping**
- GIVEN 2+ intervals in the list
- WHEN user taps "Wrap in Cycle" button below Add Block
- THEN bracket visual wraps the intervals, cycle header shows name + total duration, repeats selector defaults to x4

**IR-1a: Interval row visual rendering**
- GIVEN a Work interval with 04:00 duration
- THEN row shows emerald-500 left border, directions_run icon in emerald/10 bg, editable title, 04:00 in JetBrains Mono data-lg input

## MODIFIED Requirements

### WE-1: Display interval list with timeline preview

Editor SHALL render intervals as glass cards (bg-surface/80, backdrop-blur-md, border-outline-variant/30) with 4px left accent border colored by segment type, drag_indicator icon, and description text. Timeline SHALL include a legend row with 4 segment color dots + labels below the bar.
(Previously: flat styled list without glass card, drag handle, or timeline legend)

#### Scenario: Timeline shows 10 intervals with legend
- GIVEN a workout with 10 intervals of varying durations
- WHEN the editor loads
- THEN timeline blocks are sized proportionally and fit viewport width
- AND legend row renders below the bar with 4 colored items

### WE-4: Reorder intervals

Editor SHALL render drag_indicator icon (visual affordance) alongside existing move up/down buttons. Full drag-and-drop reordering is deferred.
(Previously: move up/down buttons only)

### WE-5: Edit duration and type

Duration input SHALL use JetBrains Mono data-lg (20px), transparent bg, border-bottom only, focus glow in secondary-container/terracotta. Range [5, 600] unchanged. Interval type SHALL be changeable via Add Block grid (new intervals) or via detail sheet (existing intervals). Dropdown removed.
(Previously: type via dropdown, standard input for duration)

### WE-10: Editor page structure

WorkoutEditor SHALL be a shared "use client" component extracted from current new/edit duplication. New page (`/workouts/new`) SHALL render WorkoutEditor with empty initial state. Edit page (`/workouts/[id]/edit`) SHALL render WorkoutEditor with workout id for data hydration.
(Previously: new and edit pages had independent editor code)

#### Scenario: New vs Edit mode
- GIVEN user navigates to /workouts/new
- THEN editor renders with empty interval list and "Name your workout..." placeholder
- GIVEN user navigates to /workouts/abc123/edit
- THEN editor renders with intervals and title pre-filled from stored workout

### WE-16: Timeline with segment colors — superseded

(Behavior absorbed into WE-21. Timeline now requires legend and shadow-inner styling as specified in WE-21.)

## REMOVED Requirements

### IntervalForm component — removed

(Reason: Replaced by Add Block bento grid WE-22. The dropdown-based interval type selector is superseded by visual type cards.)
(Migration: No migration needed — WE-22 covers the replacement. Default durations per type remain unchanged.)
