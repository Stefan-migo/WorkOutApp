# Delta for Exercise Library

## MODIFIED Requirements

### Requirement: EL-11 — Exercise row display

| ID | Description | Keyword |
|----|-------------|---------|
| EL-11 | Each exercise card SHALL render a compact layout with: image thumbnail (48x48, rounded, object-cover), name (truncated to one line), star/favorite toggle, difficulty badge, force badge, mechanic badge, and primary muscles chips (max 3 shown, "+N" overflow). Category badge SHALL appear in the top-right corner. | MUST |

(Previously: Each row showed name, category badge, difficulty badge, force badge, mechanic badge, and primary muscles chips — no image thumbnail or star toggle)

#### Scenario: Existing card shows previous fields plus new fields
- GIVEN an exercise with 2 images, name "Push Up", category "strength", difficulty "beginner", force "push", mechanic "compound", primaryMuscles ["Chest", "Triceps", "Shoulders"]
- WHEN the library renders
- THEN the card shows: a 48x48 image thumbnail, name truncated, filled/outline star, "beginner" badge, "push" badge, "compound" badge, "Chest", "Triceps", "+1" chips, and "strength" category badge top-right

## ADDED Requirements

### Requirement: EL-15 — Collapsible filter sections

| ID | Description | Keyword |
|----|-------------|---------|
| EL-15 | The filter bar SHALL support collapsible sections or a sticky bar that remains visible when scrolling large result sets (800+ items). Each filter group (Category, Force, Mechanic, Difficulty, Favorites) SHALL be collapsible via a chevron toggle. Active filter count badge SHALL show on collapsed groups. | MUST |

#### Scenario: Filter bar sticks on scroll
- GIVEN 800 exercises rendered
- WHEN user scrolls down the page
- THEN the filter bar remains sticky at the top of the exercise list

### Requirement: EL-16 — Category section headers

| ID | Description | Keyword |
|----|-------------|---------|
| EL-16 | The library grid SHALL group exercises by category with collapsible section headers. Each header SHALL display the category name and exercise count (e.g., "Strength (342)"). Headers SHALL be sticky within the scroll container. | MUST |

#### Scenario: Categories grouped with counts
- GIVEN 342 strength and 158 cardio exercises
- WHEN the library renders
- THEN two sections appear: "Strength (342)" and "Cardio (158)" with their respective exercises grouped below

### Requirement: EL-17 — Responsive grid density

| ID | Description | Keyword |
|----|-------------|---------|
| EL-17 | The exercise grid SHALL be responsive: 2 columns on mobile (<768px), 3 columns on tablet (768–1024px), 4 columns on desktop (>1024px). Gap SHALL scale proportionally (md:gap-4, lg:gap-6). | MUST |

#### Scenario: Grid adapts to viewport
- GIVEN a browser at 1400px width
- WHEN the library renders 12 exercises
- THEN they appear in a 4-column grid (3 rows)
- WHEN viewport resizes to 900px
- THEN they rearrange to 3-column grid (4 rows)
- WHEN viewport resizes to 600px
- THEN they rearrange to 2-column grid (6 rows)
