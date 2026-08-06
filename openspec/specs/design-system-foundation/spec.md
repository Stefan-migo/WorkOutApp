# Design System Foundation Specification

## Purpose

Establishes the `@theme` token layer in `src/app/globals.css` as the single source of truth for styling. The app's sole palette is the Happy Hues dark-warm contract: the Material 3 token families are replaced in full, the `prefers-color-scheme` variant is removed (single dark-warm theme in all OS modes), segment and timer tokens are remapped onto the palette, all Material-derived utilities migrate to role tokens, and Storybook ships token/typography/color docs plus the a11y addon. Reinforces CA-1 in `openspec/specs/css-architecture/spec.md` for every touched file.

## Constraints

- `@theme` `--color-*` tokens MUST be the only color source; the Happy Hues set below is the SOLE palette. The Material 3 token families (`primary`/`secondary`/`tertiary`/`surface-container*`/`error`/`background`/`outline*`/`inverse*`/`sidebar*`/`primary-btn*` and the original `timer-*` values) MUST be removed from `@theme`, not kept as aliases.
- The app MUST render the single dark-warm palette in every mode: no `prefers-color-scheme` variant and no manual theme toggle.
- Never: raw hex outside the token block (sole exception: `layout.tsx` `themeColor`, a literal mirror of `--color-bg`); a second accent (no blue/purple anywhere); more than 2 visible accent uses per screen (links count); pure `#000`/`#fff`; re-inventing semantic colors in Storybook.
- No new runtime dependencies (dev-only allowed).
- User-facing strings and docs MUST be English.

## Non-Goals

- Chromatic, `@storybook/addon-designs`, `@storybook/test-runner`, theme toggle UI, light theme.
- Remaining inventory primitives and future design-system work (later changes).

## Requirements

### Requirement: DSF-1 — Tokens are the single source of truth (sole palette)

The Happy Hues dark-warm palette below is the ONLY color contract. Every visible color in the app MUST come from a `@theme` token (`var(--color-*)` or its generated utility).

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#55423d` | Page canvas |
| `--color-surface` | `#271c19` | Raised panel: cards, modals, inputs |
| `--color-surface-warm` | `color-mix(in srgb, #ffc0ad 14%, #55423d)` | Hover/tinted glass |
| `--color-fg` | `#fffffe` | Headings |
| `--color-fg-2` | `#fff3ec` | Body copy (cream) |
| `--color-muted` | `color-mix(in srgb, #fff3ec 62%, #271c19)` | Secondary text (≥4:1 on surface) |
| `--color-meta` | `#e78fb5` | Kickers/captions |
| `--color-border` | `color-mix(in srgb, #fff3ec 24%, #55423d)` | Hairline |
| `--color-border-soft` | `color-mix(in srgb, #fff3ec 12%, #55423d)` | Soft hairline |
| `--color-accent` | `#ffc0ad` | Sole emphasis ink (salmon) |
| `--color-accent-on` | `#271c19` | Text on accent fill (never white on salmon) |
| `--color-accent-hover` | `color-mix(in oklab, var(--color-accent), white 8%)` | Accent hover |
| `--color-accent-active` | `color-mix(in oklab, var(--color-accent), white 14%)` | Accent active |
| `--color-success` | `#9dbf9c` | Sage state |
| `--color-warn` | `#e6a651` | Amber state |
| `--color-danger` | `#e07a7f` | Rosy-red state |
| `--color-focus-ring` | `0 0 0 4px rgba(255, 192, 173, 0.28)` | Focus ring |

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-1a | Sole palette: Material families removed from `@theme` (REPLACED, not extended) | MUST |
| DSF-1b | `audit:tokens` passes on all touched/migrated files | MUST |
| DSF-1c | Accent discipline: ≤2 visible accent uses per screen (links count); accent never a page wash; `accent-on` accompanies any accent fill; no second accent (blue/purple) | MUST |
| DSF-1d | No pure `#000`/`#fff`; `layout.tsx` `themeColor` equals the `--color-bg` value (`#55423d`) as the sole out-of-block literal mirror | MUST |

#### Scenario: Token audit passes
- GIVEN files migrated by this change
- WHEN `audit:tokens` runs
- THEN it reports zero hardcoded color violations outside `@theme` and the `themeColor` mirror

#### Scenario: Material tokens gone
- GIVEN the rebuilt `@theme` block
- WHEN scanning for `--color-primary`, `--color-surface-container*`, `--color-error`, original `--color-timer-*` values
- THEN none remain; only the palette above plus font/spacing/size/shadow tokens

#### Scenario: themeColor mirrors bg
- GIVEN `src/app/layout.tsx`
- WHEN rendering the app shell
- THEN `themeColor` is `#55423d` (browser chrome matches the page canvas)

### Requirement: DSF-2 — Segment palette mapped onto the palette

Interval segment colors are state/information colors (not emphasis). They MUST map onto existing semantic tokens plus in-palette `color-mix` derivations — no new hexes, no blue/purple. `SEGMENT_COLORS` in `src/lib/segment-styles.ts` MUST equal the `@theme` segment tokens; `TimerRing` and its tests MUST use the canonical values. Visible segment colors WILL change; the change is intended.

| Segment token | Value |
|---|---|
| `--color-segment-prepare` | `color-mix(in srgb, var(--color-warn) 45%, var(--color-surface))` |
| `--color-segment-work` | `var(--color-success)` |
| `--color-segment-rest` | `var(--color-danger)` |
| `--color-segment-cooldown` | `color-mix(in srgb, var(--color-danger) 45%, var(--color-surface))` |

(Rationale: reuses the palette's state tokens — preserves green-work/red-rest conventions in warm hues; amber-prepare follows the traffic-light convention; the 45% surface mix keeps the four states visually distinct without a second hue family.)

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-2a | `SEGMENT_COLORS` equals `--color-segment-*` (drift test updated) | MUST |
| DSF-2b | `TimerRing` + tests use canonical values | MUST |

#### Scenario: No drift
- GIVEN `src/lib/segment-styles.ts`
- WHEN comparing `SEGMENT_COLORS` to `--color-segment-*`
- THEN each entry matches its token (including `rest_between_cycles` = rest)

#### Scenario: Render matches tokens
- GIVEN the TimerRing story in any OS mode
- THEN the SVG stroke equals the token value per interval type

#### Scenario: Segments stay distinct
- GIVEN the four interval types rendered on `--color-bg`
- THEN prepare, work, rest, cooldown are pairwise distinguishable

### Requirement: DSF-3 — Timer tokens alias the palette

Play-screen files (play pages, TimerRing, TimerControls, RepCounter, RepCompleteDialog, PlayHeader, ProgressBar) MUST use tokens, never hardcoded dark utilities. `--color-timer-*` tokens MUST exist in `@theme` as value-aliases of the palette:

| Timer token | Aliases |
|---|---|
| `--color-timer-bg` | `var(--color-bg)` |
| `--color-timer-surface` | `var(--color-surface-warm)` |
| `--color-timer-on` | `var(--color-fg)` |
| `--color-timer-muted` | `var(--color-muted)` |
| `--color-timer-border` | `var(--color-border)` |
| `--color-timer-track` | `var(--color-surface)` |

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-3a | Timer tokens exist in `@theme` as palette aliases | MUST |
| DSF-3b | Touched dark-screen files use them | MUST |

#### Scenario: Dark screen tokenized
- GIVEN a migrated play screen
- WHEN inspecting text, surface, border, ring-track styles
- THEN they reference `--color-timer-*` tokens

#### Scenario: No visual drift
- GIVEN the same play screen before and after migration
- WHEN rendered in any OS mode (no light variant exists)
- THEN appearance is identical

### Requirement: DSF-4 — i18n cleanup in touched files

Spanish user-facing strings in touched files MUST be converted to English.

#### Scenario: Spanish string encountered
- GIVEN a touched file with a Spanish UI string (e.g. RepCompleteDialog)
- WHEN the file is migrated
- THEN the string renders in English

### Requirement: DSF-5 — Storybook foundations docs

Storybook MUST ship MDX documentation pages for tokens, typography, and colors. The Colors page MUST document the Happy Hues tokens: names, values, roles, the accent discipline (DSF-1c), and usage examples. Typography MUST follow the contract: body and display Inter, mono SF Mono (warmth from cream/rose, not pink type). Docs MUST NOT re-invent semantic colors (no new hexes in docs or stories).

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-5a | Tokens, Typography, Colors pages exist | MUST |
| DSF-5b | Pages list names, values, roles, accent discipline, usage | SHOULD |

#### Scenario: Docs reachable
- GIVEN Storybook running
- WHEN opening Foundations
- THEN the three pages render current `@theme` values

#### Scenario: Colors page matches palette
- GIVEN the Colors page
- WHEN reading any token row
- THEN the documented value equals its `@theme` definition

### Requirement: DSF-6 — a11y addon enabled

`@storybook/addon-a11y` MUST be installed (dev-only) and registered in `.storybook/main.ts` so every story runs accessibility checks.

#### Scenario: a11y results visible
- GIVEN any story
- WHEN opening the Accessibility panel
- THEN results render

### Requirement: DSF-7 — Components migrate to role tokens

All existing components using Material-derived utilities MUST be migrated to the new role tokens per the normative mapping below (≈40 files: `text-on-surface` ×336, `bg-surface-container` ×123, `border-outline-variant` ×99, `text-on-primary` ×59, plus `text-on-background`, `bg-primary-btn`, `text-on-primary-btn`, `text-on-surface-variant`, `bg-error`/`text-error`, `ring-primary`/`ring-secondary`, sidebar tokens, and the rest). `audit:tokens` MUST pass on every migrated file. `layout.tsx` `themeColor` updates per DSF-1d.

| Old (Material) | New role token |
|---|---|
| `bg-background` | `bg` |
| `text-on-background`, `text-on-surface` | `fg-2` |
| `text-on-surface-variant` | `muted` |
| `bg-surface`, `bg-surface-container*` | `surface` |
| `hover:bg-surface-container*` | `surface-warm` |
| `border-outline-variant` (default) | `border` |
| `border-outline-variant/10..30` | `border-soft` |
| `bg-primary`, `bg-primary-btn`, `bg-primary/90` | `accent` |
| `text-primary`, `hover:text-primary`, `text-secondary` | `accent` |
| `text-on-primary`, `text-on-primary-btn` | `accent-on` |
| `bg-primary-btn-hover` | `accent-hover` |
| `bg-error`, `text-error` | `danger` |
| `text-on-error` (saturated fills) | `accent-on` |
| `ring-primary`, `ring-secondary` (focus) | `focus-ring` |
| `bg-sidebar` / `text-on-sidebar*` | `surface` / `fg-2` / `muted` |
| `text-on-primary-dark-bg` | `fg-2` |

(Any other Material role token not listed maps to its closest analog: surface for fills, fg-2 for text, muted for secondary text, border for outlines, accent for emphasis/links, danger for errors.)

| ID | Description | Keyword |
|----|-------------|---------|
| DSF-7a | All Material-derived utilities replaced per mapping | MUST |
| DSF-7b | `audit:tokens` passes on all migrated files | MUST |

#### Scenario: Old token absent
- GIVEN a migrated component file
- WHEN scanning for Material-derived utilities
- THEN none remain; only role-token utilities

#### Scenario: Audit green after migration
- GIVEN all migrated files
- WHEN `audit:tokens` runs
- THEN it exits clean on the full migrated set
