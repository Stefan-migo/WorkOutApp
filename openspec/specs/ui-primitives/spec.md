# UI Primitives Specification

## Purpose

Defines shared `src/components/ui/` primitives (Button, IconButton, Card, Badge, Input, SearchInput, EmptyState, Dialog/Sheet) replacing 30+ hand-rewritten instances, three modal patterns, duplicated CSS. Token-driven, typed, story-covered, dependency-free, accessible.

## Constraints

- Token-only styling; no hardcoded colors.
- No new runtime dependencies (no Radix).
- Dialog on native `<dialog>`.
- Touch targets ≥44×44px.
- Strings in English.

## Non-Goals

- Remaining inventory primitives (DropdownMenu, SegmentedControl, ListRow, RingGauge, ProgressBar, TimelineStrip, FilterSelect, PageHeader, DateDayBlock, MetricStat, ConfirmDialog, icon wrapper, TypeIcon) — future changes.
- Feature-level components inside `src/components/ui/`.

## Requirements

### Requirement: UIP-1 — Primitive set exists

`src/components/ui/` MUST contain the eight primitives with typed props and a colocated CSF3 story each (autodocs, args, controls).

#### Scenario: Storybook lists primitives
- GIVEN Storybook running
- WHEN opening the UI section
- THEN every primitive renders with docs

### Requirement: UIP-2 — Button and IconButton

Button MUST render a native `<button>` exposing `variant` (`primary` | `ghost` | `outline` | `danger`), `size`, and FAB/pill support; disabled MUST be visually distinct and inert. IconButton MUST be ≥44×44px and require an accessible name.

#### Scenario: Unlabeled IconButton fails a11y
- GIVEN an IconButton without a label
- WHEN the a11y addon runs
- THEN a violation is reported

### Requirement: UIP-3 — Card and Badge

Card MUST provide token-based surface variants (default/raised/inset) and be presentational only (no data fetching or routing). Badge MUST be a token-styled chip with semantic variants (`segment-*`, `primary`, `error`); color MUST NOT be the only differentiator.

#### Scenario: Card variants in dark mode
- GIVEN the Card story
- WHEN cycling variants
- THEN each uses surface tokens with AA contrast

#### Scenario: Badge meaning beyond color
- GIVEN a color-coded Badge
- WHEN read by a screen reader
- THEN the type is conveyed in its text

### Requirement: UIP-4 — Input and SearchInput

Input MUST render a visible label (not placeholder-only), support an error message near the field, and associate label and field (`htmlFor`/`id`). SearchInput MUST wrap Input with `type="search"` and a clear affordance.

#### Scenario: Labeled field
- GIVEN an Input story
- THEN label and field are associated

#### Scenario: Error announced
- GIVEN an Input with an error
- THEN the message renders near the field, announced

### Requirement: UIP-5 — EmptyState

EmptyState MUST render an optional icon, title, message, and optional action, with token colors in light and dark mode.

#### Scenario: Empty state with action
- GIVEN a page with no items
- WHEN EmptyState renders with an action
- THEN title, message, and action render

### Requirement: UIP-6 — Dialog and Sheet

Dialog MUST be native `<dialog>` with `fixed` and `sheet` variants.

| ID | Description | Keyword |
|----|-------------|---------|
| UIP-6a | ESC/backdrop close | MUST |
| UIP-6b | Focus in on open, restored on close | MUST |
| UIP-6c | `aria-modal` + labelled title | MUST |
| UIP-6d | Reduced-motion respected | MUST |

#### Scenario: ESC close
- GIVEN an open Dialog
- WHEN pressing ESC
- THEN it closes, focus restored

#### Scenario: Backdrop close
- GIVEN an open Dialog
- WHEN clicking the backdrop
- THEN it closes

#### Scenario: Reduced motion
- GIVEN `prefers-reduced-motion`
- WHEN opening the sheet
- THEN the slide is reduced or disabled

### Requirement: UIP-7 — Play functions and a11y checks

Interactive primitives MUST include play functions exercising the interaction; their stories MUST pass a11y checks under Vitest.

#### Scenario: Play runs in CI
- GIVEN the Dialog play function
- WHEN Vitest runs
- THEN open/close completes, checks pass

### Requirement: UIP-8 — Modal consolidation standard

Dialog/Sheet MUST become the app-wide overlay standard, replacing the three current overlay patterns for instances in this change's scope; the rest remain for future changes.

#### Scenario: Sheet replaces duplicated CSS
- GIVEN a migrated bottom-sheet usage
- THEN it uses the sheet variant; duplicated keyframes removed
