# Delta for Exercise Picker

## MODIFIED Requirements

### Requirement: EP-2 — Rich option display

| ID | Description | Keyword |
|----|-------------|---------|
| EP-2 | Picker SHALL render each option as a rich card showing: image thumbnail (40x40, rounded), exercise name (bold), category badge, primary muscles chips (max 2 shown, "+N" overflow), difficulty badge, and force/mechanic badges. Grouped by category with section headers. Favorite star SHALL appear on each option. | MUST |

(Previously: Options showed name, category badge, and muscle group tags in a flat list — no images, no difficulty/force/mechanic badges, no grouping, no star)

#### Scenario: Picker shows rich cards
- GIVEN exercises with images, categories, and metadata
- WHEN user opens the picker
- THEN each option renders as a card with thumbnail, name, category, muscles chips, and badges

### Requirement: EP-3 — Multi-dimension filtering

| ID | Description | Keyword |
|----|-------------|---------|
| EP-3 | Picker SHALL support filtering by `ExerciseCategory` (dropdown or button group), force (push/pull/static), mechanic (compound/isolation), and difficulty (beginner/intermediate/advanced). Multiple filters SHALL stack (AND logic). | MUST |

(Previously: Picker supported filtering by ExerciseCategory only)

#### Scenario: Stack category + difficulty filter
- GIVEN exercises of mixed categories and difficulties
- WHEN user selects "strength" category AND "beginner" difficulty
- THEN only strength/beginner exercises appear

### Requirement: EP-4 — Free text search across names

| ID | Description | Keyword |
|----|-------------|---------|
| EP-4 | Picker SHALL support free text search across exercise names (case-insensitive substring match) — UNCHANGED from existing behavior | MUST |

(Previously: Same behavior, no change)

#### Scenario: Search text narrows results
- GIVEN 800 exercises
- WHEN user types "push"
- THEN options narrow to exercises matching "push" in name

## ADDED Requirements

### Requirement: EP-10 — Mini preview card on selection

| ID | Description | Keyword |
|----|-------------|---------|
| EP-10 | When an exercise is selected in the picker, a mini preview card SHALL appear below the search input showing: image thumbnail, name, category badge, primary muscles chips, difficulty/force/mechanic badges, equipment tags (max 3), and instructions preview (first 2 lines). A "View Full Details" link SHALL navigate to `/exercises/[id]`. | MUST |

#### Scenario: Selected exercise shows preview
- GIVEN "Push Up" is selected in the picker
- WHEN the picker closes
- THEN a mini preview card renders with thumbnail, metadata, and "View Full Details" link

### Requirement: EP-11 — Favorite star in picker

| ID | Description | Keyword |
|----|-------------|---------|
| EP-11 | Picker SHALL show a favorite star toggle on each option card and on the mini preview card. Toggling SHALL call `toggleFavorite()` from `useFavorites()` and update the star state immediately. | MUST |

#### Scenario: Star toggle from picker
- GIVEN an unfavorited exercise in the picker options
- WHEN user clicks its star icon
- THEN star fills immediately AND the exercise appears in library favorites filter

### Requirement: EP-12 — View Full Details navigation

| ID | Description | Keyword |
|----|-------------|---------|
| EP-12 | Picker SHALL include a "View Full Details" link on each option (right side) and on the mini preview card. Clicking SHALL navigate to `/exercises/[id]` in the current tab. | MUST |

#### Scenario: Navigate to detail from picker
- GIVEN the picker is open
- WHEN user clicks "View Full Details" on an option
- THEN browser navigates to `/exercises/[id]`
