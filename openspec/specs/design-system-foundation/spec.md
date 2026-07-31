# Design System Foundation Specification

## Purpose

Establishes the `@theme` token layer in `src/app/globals.css` as the single source of truth for styling: fixes the drift between `SEGMENT_COLORS` and segment tokens, adds semantic tokens for the dark timer screens, and ships Storybook foundations docs plus the a11y addon. Reinforces CA-1 in `openspec/specs/css-architecture/spec.md` for every touched file.

## Constraints

- `@theme` tokens MUST be the only color source; hardcoded hex and arbitrary color utilities MUST NOT appear in touched files.
- Dark mode MUST stay OS-driven (`prefers-color-scheme`); no manual toggle.
- No new runtime dependencies (dev-only allowed).
- User-facing strings and docs MUST be English.

## Non-Goals

- Chromatic, `@storybook/addon-designs`, `@storybook/test-runner`, dark-mode toggle UI.
- Remaining 13 inventory primitives and non-demo pages (future changes).

## Requirements

### Requirement: DSF-1 — Tokens are the single source of truth

Every visible color in touched code MUST come from a `@theme` token (`var(--color-*)` or its generated utility).

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-1a | Touched files use tokens only | MUST |
| DSF-1b | `audit:tokens` script exists and passes on touched files | MUST |

#### Scenario: Token audit passes
- GIVEN files migrated by this change
- WHEN `audit:tokens` runs
- THEN it reports zero hardcoded color violations

### Requirement: DSF-2 — Segment palette canonicalized to @theme

`SEGMENT_COLORS` in `src/lib/segment-styles.ts` MUST equal the `@theme` segment tokens (prepare blue, work green, rest red, cooldown violet). `TimerRing` and its tests MUST use the canonical values. Visible segment colors WILL change; the change is intended.

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-2a | `SEGMENT_COLORS` equals token values | MUST |
| DSF-2b | `TimerRing` + tests updated | MUST |

#### Scenario: No drift
- GIVEN `src/lib/segment-styles.ts`
- WHEN comparing `SEGMENT_COLORS` to `--color-segment-*`
- THEN each entry matches its token

#### Scenario: Render matches tokens
- GIVEN the TimerRing story in light and dark mode
- THEN the SVG stroke equals the token value per interval type

### Requirement: DSF-3 — Semantic tokens for timer dark screens

Dark play-screen files (play pages, TimerRing, TimerControls, RepCounter, RepCompleteDialog, PlayHeader, ProgressBar) MUST replace hardcoded dark utilities (`text-white`, `text-gray-*`, `bg-white`, `border-white/*`, arbitrary shadows) with tokens. `--color-timer-surface`, `--color-timer-on`, `--color-timer-border` MUST be added to `@theme`, with light-mode values.

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-3a | Timer tokens exist in `@theme` | MUST |
| DSF-3b | Touched dark-screen files use them | MUST |

#### Scenario: Dark screen tokenized
- GIVEN a migrated play screen
- WHEN inspecting text, surface, border styles
- THEN they reference `--color-timer-*` tokens

#### Scenario: No visual drift
- GIVEN the same play screen before and after migration
- WHEN rendered in dark mode
- THEN appearance is identical

### Requirement: DSF-4 — i18n cleanup in touched files

Spanish user-facing strings in touched files MUST be converted to English.

#### Scenario: Spanish string encountered
- GIVEN a touched file with a Spanish UI string (e.g. RepCompleteDialog)
- WHEN the file is migrated
- THEN the string renders in English

### Requirement: DSF-5 — Storybook foundations docs

Storybook MUST ship MDX documentation pages for tokens, typography, and colors showing `@theme` values and consumption examples.

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-5a | Tokens, Typography, Colors pages exist | MUST |
| DSF-5b | Pages list names, values, usage | SHOULD |

#### Scenario: Docs reachable
- GIVEN Storybook running
- WHEN opening Foundations
- THEN the three pages render current `@theme` values

### Requirement: DSF-6 — a11y addon enabled

`@storybook/addon-a11y` MUST be installed (dev-only) and registered in `.storybook/main.ts` so every story runs accessibility checks.

#### Scenario: a11y results visible
- GIVEN any story
- WHEN opening the Accessibility panel
- THEN results render
