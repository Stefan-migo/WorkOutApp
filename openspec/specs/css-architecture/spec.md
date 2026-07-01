# CSS Architecture

## Requirements

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

### Requirement: CA-2 — Spacing token rename
`--spacing-{sm,md,lg,xl,2xl}` renamed to `--spacing-{4,8,16,24,32}` to avoid shadowing Tailwind `max-w-*` utilities. `!important` removed from `@utility max-w-*`.

| ID | Description | Keyword |
|----|-------------|---------|
| CA-2a | Spacing tokens renamed to numeric values | SHOULD |
| CA-2b | `@utility max-w-*` `!important` removed after rename | MUST |

#### Scenario: Spacing renamed, `!important` removed
- GIVEN `--spacing-sm` renamed to `--spacing-4`
- WHEN the CSS is parsed
- THEN `@utility max-w-sm` has no `!important`
