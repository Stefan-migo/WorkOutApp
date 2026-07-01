# Spec: Phase 3 — Architecture Hardening

## Domain: TypeScript Configuration (NEW)

### Requirement: TC-1 — Enable strict TS flags
`tsconfig.json` MUST add `noUnusedLocals: true`, `noUnusedParameters: true`, and `noUncheckedIndexedAccess: true`. All resulting compilation errors MUST be fixed before the change is complete.

| ID | Description | Keyword |
|----|-------------|---------|
| TC-1a | `noUnusedLocals` MUST be `true` | MUST |
| TC-1b | `noUnusedParameters` MUST be `true` | MUST |
| TC-1c | `noUncheckedIndexedAccess` MUST be `true` | MUST |
| TC-1d | All TS compilation errors from these flags MUST be resolved | MUST |

#### Scenario: Flags enabled
- GIVEN `tsconfig.json`
- WHEN the file is read
- THEN `noUnusedLocals`, `noUnusedParameters`, and `noUncheckedIndexedAccess` are set to `true`

#### Scenario: No compilation errors after fix
- GIVEN the three flags enabled
- WHEN `tsc --noEmit` runs
- THEN exit code is 0 (no errors)

## Domain: Error Boundary (NEW)

### Requirement: EB-1 — Global error boundary
A React error boundary component MUST catch rendering errors in the component tree and show a fallback UI instead of white-screening.

| ID | Description | Keyword |
|----|-------------|---------|
| EB-1a | `ErrorBoundary` class component MUST be created at `src/components/ErrorBoundary.tsx` | MUST |
| EB-1b | `ErrorBoundary` MUST catch rendering errors and display a fallback UI with error message | MUST |
| EB-1c | `ErrorBoundary` MUST log errors to `console.error` for diagnostics | MUST |
| EB-1d | `src/app/layout.tsx` MUST wrap its children with `ErrorBoundary` | MUST |

#### Scenario: Component crash shows fallback
- GIVEN a component inside ErrorBoundary throws during render
- WHEN the error occurs
- THEN fallback UI renders with the error message instead of the crashed tree
- AND the error is logged via `console.error`

#### Scenario: Normal render unaffected
- GIVEN all children render without errors
- WHEN the app renders
- THEN the normal children appear with no fallback

## Domain: CSS Architecture (NEW)

### Requirement: CA-1 — Use CSS design tokens instead of hardcoded values
`globals.css` MUST replace hardcoded color values with theme variables. Duplicate definitions MUST be removed.

| ID | Description | Keyword |
|----|-------------|---------|
| CA-1a | Body `background-color: #f8f9ff` MUST become `var(--color-background)` | MUST |
| CA-1b | Body `color: #0b1c30` MUST become `var(--color-on-background)` | MUST |
| CA-1c | Duplicate `--font-*` definitions MUST be deduplicated (keep one copy) | MUST |
| CA-1d | `.glass-card` MUST use `var(--color-surface)` and `var(--color-outline-variant)` | MUST |

#### Scenario: Body uses CSS variables
- GIVEN the rendered page
- WHEN inspecting body styles
- THEN `background-color` is `var(--color-background)` and `color` is `var(--color-on-background)`

### Requirement: CA-2 — Optional spacing token rename (MAY)
`--spacing-{sm,md,lg,xl,2xl}` MAY be renamed to `--spacing-{4,8,16,24,32}` to avoid shadowing Tailwind `max-w-*` utilities. If renamed, `!important` MUST be removed from `@utility max-w-*`.

| ID | Description | Keyword |
|----|-------------|---------|
| CA-2a | Spacing tokens SHOULD be renamed to numeric values | SHOULD |
| CA-2b | `@utility max-w-*` `!important` MUST be removed after rename | MUST |

#### Scenario: Spacing renamed, `!important` removed
- GIVEN `--spacing-sm` renamed to `--spacing-4`
- WHEN the CSS is parsed
- THEN `@utility max-w-sm` has no `!important`

## Domain: Local Persistence (DELTA)

### MODIFIED: LP-8 — SSR-safe try/catch with lazy init + quota warning

`useLocalStorage` MUST use a lazy initializer for `useState` to read localStorage synchronously on mount, avoiding a flash of default state. On storage quota errors, a warning MUST be logged.
(Previously: `localStorage` calls wrapped in try/catch for SSR and quota errors — plain `useState(initialValue)` with no warning on quota errors)

| ID | Description | Keyword |
|----|-------------|---------|
| LP-8a | `useState` MUST use a callback initializer that reads from `localStorage` | MUST |
| LP-8b | On `localStorage` quota error, `console.warn('Storage quota exceeded for key:', key)` MUST fire | MUST |

#### Scenario: Lazy init reads stored value
- GIVEN `localStorage` has `workoutapp.workouts` = `[{"id":"w1"}]`
- WHEN `useLocalStorage('workoutapp.workouts', [])` initializes
- THEN state is `[{"id":"w1"}]` without rendering the default first

#### Scenario: Quota error is logged
- GIVEN `localStorage` is full
- WHEN `useLocalStorage` tries to write
- THEN `console.warn('Storage quota exceeded for key:', key)` fires

## Non-Requirements

- No behavioral changes — all changes are additive or strictly equivalent
- No visual changes — CSS tokens resolve to the same values as their hardcoded equivalents
- No new features
- ErrorBoundary does NOT replace existing error handling — it supplements it
