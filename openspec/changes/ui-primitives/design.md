# Design: PR 2 — UI Primitives

## Technical Approach

Build `src/components/ui/` with 8 typed, token-only, dependency-free primitives (Button, IconButton, Card, Badge, Input, SearchInput, EmptyState, Dialog/Sheet) per UIP-1..8, each with a colocated CSF3 story (autodocs, args, controls) and jsdom unit tests; interactive stories carry play functions + axe checks executed under Vitest's browser project (D10). Styling exclusively via Happy Hues `var(--color-*)` utilities generated from `globals.css` `@theme`; class maps are plain `Record<variant, string>` (D11). Presentational only — no data flow changes. Delivered as stacked slices 2a–2d → `main`.

**Infra gap resolved (DD-4)**: parent D10 mandates `test.projects = [unit (jsdom), storybook (playwright chromium)]` via `@storybook/addon-vitest`, but PR 1 shipped only the a11y addon registration in `.storybook/main.ts` (verified: `vitest.config.ts` is jsdom-only; `@storybook/addon-vitest`, `@vitest/browser`, playwright absent from `package.json`/`node_modules`). This design builds the D10 infra in slice 2a — dev-only deps, satisfying the spec's "no new **runtime** dependencies" constraint.

**Inherited drift fixed (DD-6)**: `.storybook/preview.tsx` background `app` still reads `var(--color-background)` (deleted Material token) and raw hexes `#0a0e1a`/`#f8f9ff` — missed by PR 1 because it lives outside `src/` (audit rule 3 scans `src` only). Fixed minimally in 2a; not a PR 1 reopen.

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| DD-1 (D8) | Layout | Flat `src/components/ui/*.tsx` + colocated `*.stories.tsx` + `__tests__/` + `index.ts` barrel | Parent D8; SB glob `../src/**/*.stories.*` already matches |
| DD-2 (D11) | Variants | Plain `Record<variant, string>` per component; no cva, no `asChild`, no factory | Parent D11; repo pattern in `segment-styles.ts`; dead-simple class strings |
| DD-3 (D9) | Dialog | Controlled native `<dialog>`: `open`→`showModal()`, `!open`→`close()`; backdrop `e.target === ref.current`; native `cancel` (ESC) + `close` → `onOpenChange(false)`; `aria-labelledby` via `useId`; explicit `aria-modal="true"`; sheet slide gated by `motion-reduce:` | Parent D9; matches existing hand-rolled dialogs (ExerciseDeleteDialog, AddToWorkoutModal) which this replaces as the standard (UIP-8) |
| DD-4 (D10) | a11y test infra | Install dev deps `@storybook/addon-vitest`, `@vitest/browser`, `playwright`; add `test.projects = [unit, storybook]` to `vitest.config.ts`; consolidate by deleting `vitest.config.mts`; CI step `npx playwright install --with-deps chromium` | D10 is a parent contract; infra absent from PR 1 (evidence: config + node_modules). Dev-only — spec bans runtime deps only. Real chromium needed for axe contrast (UIP-3 AA) — jsdom cannot compute layout |
| DD-5 | Story verification | One colocated browser-project test (`ui-primitives.a11y.test.ts`) composes all 8 story files, runs play functions, asserts axe violations empty; exact addon-vitest API pinned at apply | UIP-7: "play runs in CI under Vitest"; axe per story via `@storybook/addon-a11y` (bundles `axe-core`) |
| DD-6 | Storybook preview bg | `preview.tsx` `app` → `var(--color-bg)`; delete stale Material var + raw hexes | Inherited drift from PR 1; stories render on correct bg so axe contrast is meaningful |
| DD-7 | Audit constraint | Stories + tests live under `src/` → audit rule 3 scans them: **zero hex/rgba anywhere** in primitives, stories, or tests; stories use only named SB backgrounds / token vars | `token-audit.test.ts` rule 3 scans ALL files (incl. `__tests__`); rule 1 scans stories too |
| DD-8 | Typography | Use ONLY defined `--text-*` utilities: `text-headline-md`, `text-body-md`, `text-label-caps`, `text-data-sm/lg`. `text-body-sm`/`headline-sm`/`label-lg` are NOT in `@theme` (existing pages use them as dead classes) | Cross-checked against `globals.css` `@theme`; primitives must not ship non-existent utilities |

## Interfaces / Contracts

All components: typed props extending `ComponentPropsWithoutRef<'button'|'input'|'dialog'|'div'>` where useful; `'use client'` **only** where hooks are used (Dialog, Input, SearchInput).

### Button / IconButton (UIP-2)

```ts
type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant   // default 'primary'
  size?: ButtonSize         // default 'md'
  pill?: boolean            // rounded-full (FAB/pill support)
  elevated?: boolean        // shadow-fab (FAB)
}
interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
  'aria-label': string      // REQUIRED — TS-enforced accessible name (UIP-2)
  size?: 'sm' | 'md'        // md default: h-11 w-11 = 44×44px (Constraint)
}
```

| Map | Classes (tokens only — all exist in `globals.css`) |
|---|---|
| Button base | `inline-flex items-center justify-center gap-2 rounded-lg font-label text-label-caps font-bold tracking-wide transition-colors focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none` |
| primary | `bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-active` |
| ghost | `text-fg-2 hover:bg-surface-warm active:bg-surface-warm/80` |
| outline | `border border-border-soft text-fg-2 hover:bg-surface-warm active:bg-surface-warm/80` |
| danger | `bg-danger text-accent-on hover:bg-danger/80` |
| SIZE | sm `h-9 px-3` · md `h-11 px-4` · lg `h-12 px-5` |
| pill / elevated | `rounded-full` / `shadow-fab` |
| IconButton | `inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none` + variant map above |

### Card / Badge (UIP-3)

```ts
interface CardProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'raised' | 'inset'
  interactive?: boolean     // hover affordance; click handling stays at call site (no asChild)
}
interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: 'neutral' | 'primary' | 'success' | 'warn' | 'danger'
        | 'segment-prepare' | 'segment-work' | 'segment-rest' | 'segment-cooldown'
}
```

| Map | Classes |
|---|---|
| Card default | `rounded-xl bg-surface border border-border-soft` |
| Card raised | `rounded-xl bg-surface border border-border shadow-card-hover` |
| Card inset | `rounded-xl bg-bg border border-border-soft` |
| Card interactive | `cursor-pointer transition-colors hover:border-border hover:shadow-card-hover` |
| Badge base | `inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label text-label-caps font-bold` |
| neutral | `bg-surface text-muted border border-border-soft` |
| primary | `bg-accent text-accent-on` |
| success / warn / danger | `bg-success/15 text-success` / `bg-warn/15 text-warn` / `bg-danger/15 text-danger` |
| segment-\* | `bg-segment-{state}/10 text-segment-{state}` (prepare/work/rest/cooldown) |

Color is never the only differentiator: Badge semantics MUST be in its text (UIP-3 scenario).

### Input / SearchInput (UIP-4)

```ts
interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'id'> {
  label: string             // visible label, never placeholder-only
  id?: string               // default useId
  error?: string            // rendered near field + aria-describedby
  leadingIcon?: ReactNode   // left slot, input gets pl-10
}
interface SearchInputProps {
  label?: string; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean; onClear?: () => void
}
```

| Map | Classes |
|---|---|
| wrapper | `flex flex-col gap-1` |
| label | `font-label text-label-caps text-muted` |
| field | `h-11 w-full rounded-lg border bg-surface px-3 font-body text-body-md text-fg-2 placeholder:text-muted transition-colors focus:border-accent focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none` + `border-border-soft` (ok) / `border-danger` (error) + `pl-10` (leadingIcon) |
| error | `font-body text-data-sm text-danger` + `aria-invalid={!!error}` `aria-describedby={errorId}` |

SearchInput composes Input with `type="search"`, default inline-SVG search leading icon, and a clear button (`aria-label="Clear search"`) rendered when `value !== ''` → `onChange('')` + refocus.

### EmptyState (UIP-5)

```ts
interface EmptyStateProps { icon?: ReactNode; title: string; body?: string; action?: ReactNode }
```
`flex flex-col items-center justify-center gap-2 py-16 text-center`; icon `text-meta`; title `font-headline text-headline-md font-semibold text-fg-2`; body `font-body text-body-md text-muted`. Single dark-warm theme (PR 1 deleted `prefers-color-scheme`) — "light and dark" scenarios satisfied by the one theme; contrast verified by browser axe (UIP-3/5).

### Dialog / Sheet (UIP-6, D9)

```ts
interface DialogProps extends ComponentPropsWithoutRef<'dialog'> {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: 'fixed' | 'sheet'   // default 'fixed'
  title: string                 // accessible name → aria-labelledby
}
```

| Map | Classes |
|---|---|
| fixed | `fixed inset-0 z-50 w-full max-w-lg m-auto rounded-2xl bg-surface border border-border text-fg-2 p-24 shadow-fab backdrop:bg-surface/80` |
| sheet | `fixed inset-0 z-50 w-full h-full m-0 ml-auto max-w-md bg-surface text-fg-2 backdrop:bg-surface/80 translate-x-full transition-transform duration-300 open:translate-x-0 motion-reduce:translate-x-0 motion-reduce:transition-none` |

Behavior: `useEffect` syncs `open`→`showModal()`/`close()`; backdrop click `e.target === ref.current` → `onOpenChange(false)`; `onCancel` (ESC) `preventDefault()` + `onOpenChange(false)`; `onClose` → `onOpenChange(false)` (idempotent); `aria-labelledby={titleId}` + `aria-modal="true"`; native `showModal` handles focus-in/restore (verified in browser play, UIP-6b). UIP-8: this becomes the app overlay standard; replacing the 3 legacy overlay patterns is PR 3 scope (spec scenario GIVEN a migrated usage — future).

## Data Flow

```
Page state ──open prop──▶ Dialog ──useEffect──▶ showModal()/close() ──▶ native <dialog>
                              ◀──onOpenChange(false)──── cancel(ESC)/close/backdrop click
Focus: showModal() traps & records trigger; close() restores (native; asserted in browser play)
```

No other data flow changes (presentational refactor).

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/ui/Button.tsx`, `IconButton.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `SearchInput.tsx`, `EmptyState.tsx`, `Dialog.tsx` | Create | Primitives (DD-1/2) |
| `src/components/ui/index.ts` | Create | Barrel; exports added per slice (D8) |
| `src/components/ui/*.stories.tsx` (×8) | Create | CSF3, `tags: ['autodocs']`, args/controls; play on Button/IconButton/Dialog (UIP-7) |
| `src/components/ui/__tests__/*.test.tsx` (×8) | Create | jsdom unit tests |
| `src/components/ui/__tests__/ui-primitives.a11y.test.ts` | Create | Browser-project: compose stories → play + axe (DD-5) |
| `vitest.config.ts` | Modify | `test.projects = [unit, storybook]` (DD-4) |
| `vitest.config.mts` | Delete | Consolidate single config (DD-4) |
| `package.json` | Modify | devDeps: `@storybook/addon-vitest`, `@vitest/browser`, `playwright` (DD-4) |
| `.github/workflows/ci.yml` | Modify | `npx playwright install --with-deps chromium` before Tests (DD-4) |
| `.storybook/preview.tsx` | Modify | `app` bg → `var(--color-bg)`; drop stale hexes (DD-6) |

## Implementation Slices (auto-chain, stacked-to-main)

Each slice: files, focused test command, runtime harness, rollback boundary, risks. Gate after each: `npx tsc --noEmit` + slice tests + `npm run audit:tokens` + `npm run build-storybook`.

| Slice | Scope | Files | Focused test | Harness | Rollback | Risks |
|---|---|---|---|---|---|---|
| **2a** (~400) | D10 infra + Button + IconButton | Modify: `vitest.config.ts`, `package.json`, `ci.yml`, `preview.tsx`; Delete: `vitest.config.mts`; Create: `Button.tsx`, `IconButton.tsx`, `index.ts` (2 exports), `Button.stories.tsx`, `IconButton.stories.tsx`, `__tests__/Button.test.tsx`, `__tests__/IconButton.test.tsx`, `__tests__/ui-primitives.a11y.test.ts` | `npx vitest run` (unit) + `npx vitest run --project storybook` | `npm run storybook` :6006 → UI/Button, UI/IconButton | Revert merge; `ui/` unused by pages — delete safe | Dev-dep install changes lockfile; chromium download in CI (new step); dual vitest config ambiguity (consolidation must keep `@` alias + globals); addon-vitest API details |
| **2b** (~340) | Card + Badge | Create: `Card.tsx`, `Badge.tsx`, `Card.stories.tsx`, `Badge.stories.tsx`, `__tests__/Card.test.tsx`, `__tests__/Badge.test.tsx`; Modify: `index.ts` | `npx vitest run src/components/ui/__tests__/Card.test.tsx src/components/ui/__tests__/Badge.test.tsx` | SB → UI/Card, UI/Badge | Revert merge | Segment-token opacity suffix (`bg-segment-*/10`) must compile under Tailwind v4 |
| **2c** (~400) | Input + SearchInput | Create: `Input.tsx`, `SearchInput.tsx`, stories ×2, tests ×2; Modify: `index.ts` | `npx vitest run src/components/ui/__tests__/Input.test.tsx src/components/ui/__tests__/SearchInput.test.tsx` | SB → UI/Input, UI/SearchInput | Revert merge | `useId` SSR hydration (harmless — single render); label/error `aria-describedby` wiring must be exact for axe |
| **2d** (~400) | EmptyState + Dialog (last — reuses Button/patterns from 2a) | Create: `EmptyState.tsx`, `Dialog.tsx`, stories ×2 (Dialog story uses stateful wrapper + trigger Button), tests ×2; Modify: `index.ts` | `npx vitest run src/components/ui/__tests__/EmptyState.test.tsx src/components/ui/__tests__/Dialog.test.tsx` + browser project | SB → UI/Dialog (open/ESC/backdrop/focus-restore play) | Revert merge | jsdom `<dialog>` support is partial (showModal/cancel OK, focus restore partial) → focus-restore asserted in browser play, not jsdom; sheet reduced-motion must be motion-reduce-gated |

Contingency: if 2d exceeds the 400-line budget, apply may split EmptyState (~180) into its own slice before Dialog — slice order preserved.

Estimation note: parent design estimated ≈1,150 total; this design lands ≈1,480–1,540 (infra ~50 + 8 primitives ~430 + 8 stories ~600 + 9 test files ~400). Per-slice budgets hold; the delta is added browser-infra + a11y test file.

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit (jsdom, `project unit`) | Render/disabled/aria per primitive; Button variants; IconButton ≥44px + required aria-label; Card variants; Badge tones; Input label association (`htmlFor`/`id`), error described-by; SearchInput clear; Dialog open/close/ESC (jsdom dialog support) | `src/components/ui/__tests__/*.test.tsx` (repo pattern: Testing Library + jest-dom, per RepCompleteDialog.test.tsx) |
| Browser (`project storybook`) | Play functions (Button click via `fn` spy; Dialog open→ESC→backdrop→focus-restore) + axe per story, violations empty | `ui-primitives.a11y.test.ts` composing stories (DD-5) |
| Contract | No Material utilities / raw hex / second accent in primitives, stories, or tests | `npm run audit:tokens` (DD-7) |
| Build | Stories compile, docs render | `npm run build-storybook` + `npx tsc --noEmit` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary (CI change is a declarative step addition, no custom shell logic).

## Migration / Rollout

No data migration. Stacked chained PRs: 2a → 2b → 2c → 2d → `main` (proposal decision 2). No page consumes `ui/` yet (migration is PR 3), so each slice is purely additive; full revert = delete `src/components/ui/` + revert infra files.

## Open Questions

- [ ] D10 infra (DD-4): the proposal's "zero new dependencies" vs in-scope D10 browser project. Resolved toward D10 (dev-only deps) — confirm at apply; runtime deps stay zero.
- [ ] Dual vitest configs (`vitest.config.ts` + `vitest.config.mts`): consolidation into `test.projects` must preserve `@` alias + `globals: true`; verify `npm test` still runs all 598 existing tests.
- [ ] Exact `@storybook/addon-vitest` test API (composeStories runner vs manual) pinned at apply — behavior contract fixed: play runs + axe empty.
- [ ] UIP-3/UIP-5 "light and dark mode" wording vs single-theme contract — satisfied by one theme + browser axe contrast; archive phase may amend scenario wording (consistent with archived DSF-3 follow-up).
