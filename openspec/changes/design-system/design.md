# Design: Design System for WorkOutApp

## Technical Approach

Brownfield, token-first, Storybook-first extraction. Three independently revertible slices (chained PRs):

1. **Foundation** — token gap fixes in `@theme` (segment canonical values, timer tokens, shadow tokens), `SEGMENT_COLORS` drift test, TimerRing touch-up, a11y addon, Foundations docs (MDX).
2. **Primitives** — `src/components/ui/` with 8 primitives, colocated CSF3 stories (`tags: ['autodocs']`), play functions, a11y checks under Vitest.
3. **Migration demo** — `/workouts` and `/exercises` converted to primitives; three exercise overlays rebuilt on the Dialog primitive.

No new runtime dependencies. Dev-only additions: `@storybook/addon-a11y`, `@storybook/addon-vitest`, `@storybook/test`, `@playwright/test`.

Map to specs: DSF-1/2/3/5/6 (foundation), UIP-1..8 (primitives), PMD-1..4 (migration). This is a presentational refactor: **no data flow changes** — state continues to live in the pages/hooks/contexts; primitives are controlled components.

## Architecture Decisions

### D1: Folder structure — flat `ui/` + barrel

| Option | Tradeoff | Decision |
|---|---|---|
| `ui/Button/Button.tsx + Button.stories.tsx + index.ts` | Nesting, 3 files per primitive | ✗ |
| **Flat `ui/Button.tsx` + `ui/Button.stories.tsx` + `ui/index.ts`** | Matches repo (everything flat); SB glob `../src/**/*.stories.@(...)` already matches; barrel gives one import point | ✓ |

Tests go in `src/components/ui/__tests__/` (repo convention). Barrel `index.ts` re-exports all 8 primitives so pages import `from '@/components/ui'` — this also gives reviewers a single contract list (PMD-3).

### D2: `SEGMENT_COLORS` unification — TS map + drift test

| Option | Tradeoff | Decision |
|---|---|---|
| Runtime `getComputedStyle(document).getPropertyValue('--color-segment-*')` | SSR first-paint flash (empty before mount) → needs hook/effect; jsdom tests must inject CSS vars; more code | ✗ |
| **TS map with canonical hexes + vitest test parsing `globals.css`** | Hex duplicated once, but drift is caught in CI; static, zero runtime cost, TimerRing keeps reading a plain object | ✓ |

`SEGMENT_COLORS` keeps its `Record<IntervalType, string>` shape with the canonical values (lowercase, matching `@theme`): prepare `#3b82f6`, work `#10b981`, rest `#ef4444`, rest_between_cycles `#ef4444`, cooldown `#8b5cf6`. New test `src/lib/__tests__/segment-styles.test.ts` reads `globals.css`, extracts `--color-segment-*` with a regex, and asserts equality per entry (DSF-2a). `TimerRing` code is unchanged structurally; its tests update expected hexes (DSF-2b). Visible segment colors change — intended (decision #1).

### D3: Timer tokens — created NOW, single always-dark value

| Option | Tradeoff | Decision |
|---|---|---|
| Defer tokens to the future play-screen change | Foundation stays incomplete; DSF-3a unmet in this change | ✗ |
| **Create 5 tokens in `@theme` now, no light-mode override** | Satisfies DSF-3a; play screens are *unconditionally* dark (`timer-dark-bg` is unguarded — they render dark even in light OS mode), so a light variant would change appearance and violate the DSF-3 no-drift scenario | ✓ |

Values (match the current hardcoded palette exactly):

| Token | Value | Replaces |
|---|---|---|
| `--color-timer-bg` | `#091426` | `.timer-dark-bg` background |
| `--color-timer-surface` | `rgba(255,255,255,0.05)` | `glass-panel-dark` background |
| `--color-on-timer` | `#ffffff` | `text-white` |
| `--color-timer-border` | `rgba(255,255,255,0.2)` | `border-white/20` (lower-alpha usages become `border-timer-border/50`) |
| `--color-timer-muted` | `#9ca3af` | `text-gray-400` |

`.timer-dark-bg` and `.glass-panel-dark` in `globals.css` are redefined to reference these tokens. Spec DSF-3's "light-mode values" clause is interpreted as *values usable regardless of OS theme* — play screens stay dark in both (the archive phase should amend that wording). `text-gray-300` (ExercisePanel/RepCounter body) maps to `timer-muted` too — a minor delta accepted and documented.

**DSF-3b scope**: only `TimerRing` is touched by this change (for DSF-2b), so only it gets the token swaps: `text-white` → `text-timer-on`, `text-gray-400` → `text-timer-muted`, track stroke `#1E293B` → `var(--color-primary-container)` via `style={{ stroke: ... }}` (SVG presentation attributes don't resolve CSS vars). The play pages, PlayHeader, ProgressBar, RepCompleteDialog, RepCounter, TimerControls migrate in the future play-screen change.

Also add two shadow tokens to `@theme`: `--shadow-card-hover: 0 8px 30px rgba(11,28,48,0.04)` and `--shadow-fab: 0 4px 20px rgba(30,41,59,0.2)` — Tailwind v4 generates `shadow-card-hover` / `shadow-fab` utilities, replacing the arbitrary-shadow literals in the demo pages.

### D4: `audit:tokens` — extend script + vitest drift test

`audit:tokens` **exists** in `package.json` but greps for legacy shadcn-style token names (`text-fg`, `bg-accent`, ...) — it does NOT catch hardcoded hex. Plan:

- Extend the script with a second grep for hex/rgba literals **scoped to touched paths** (a whole-`src/` grep would false-fail on `globals.css`, stories backgrounds, TimerRing):
  `grep -rE '#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)' src/components/ui src/app/workouts/page.tsx src/app/exercises/page.tsx src/components/ExerciseSearchHeader.tsx || echo OK`
- Add the `segment-styles.test.ts` drift test (D2). Both run in CI via `npm test` / the script (DSF-1b, DSF-2a).

### D5: Dialog — controlled native `<dialog>`, no headless lib

| Option | Tradeoff | Decision |
|---|---|---|
| Radix/headlessui Dialog | New runtime deps, fights the native element | ✗ |
| **Native `<dialog>` + controlled `open` prop** | showModal() gives focus trap + focus restore + ESC + `::backdrop` for free; ~10 lines of effect glue | ✓ |

Mechanics: `open` → `ref.showModal()`, `!open` → `ref.close()` (guarded by `dialog.open`); backdrop click via `e.target === ref.current` (works because `::backdrop` events target the dialog element); native `cancel` (ESC) and programmatic `close()` both surface through the `close` event → `onClose`. Focus in/out and trap are native (UIP-6b satisfied with zero code). Title rendered as `<h2 id={titleId}>` linked via `aria-labelledby`; native dialog implies `role="dialog"` + `aria-modal` when shown (UIP-6c). Sheet slide animation (`0.3s ease-out`) lives in `globals.css` as a plain class (repo convention: `.glass-card`, `.timer-dark-bg`) gated by `@media (prefers-reduced-motion: no-preference)` (UIP-6d). This replaces the two duplicated inline `<style>` keyframes blocks when the editor/history sheets migrate (future change — UIP-8 holds for in-scope instances only).

### D6: Storybook tests via Vitest browser project

The SB10 Vitest addon (`@storybook/addon-vitest`, exports `storybookTest` from `@storybook/addon-vitest/vitest-plugin`) runs play functions and a11y checks in a real browser:

```
vitest.config.ts
├── test.projects = [
│     { name: 'unit', environment: 'jsdom', ...current settings... },
│     { name: 'storybook',
│       plugins: [storybookTest({ configDir: '.storybook', storybookScript: 'npm run storybook -- --no-open' })],
│       test: { browser: { enabled: true, headless: true, provider: 'playwright',
│                          instances: [{ browser: 'chromium' }] },
│               setupFiles: ['./.storybook/vitest.setup.ts'] } }
└── shared: alias '@', globals, maxWorkers
```

`@storybook/addon-a11y` registered in `.storybook/main.ts` `addons` — with the Vitest addon, axe checks run automatically per story (UIP-7). New script `"test:stories": "vitest run --project storybook"`. `@playwright/test` + `npx playwright install chromium` (dev-only; first-run download).

### D7: No variants factory, no `asChild`, no cva

Plain `Record<variant, string>` class maps per primitive (repo already does this in `segment-styles.ts`). `asChild`/slot mechanics skipped — no link-styled-button use case in the demo pages or play screens; add when one appears. `'use client'` only where hooks are used (Input/SearchInput via `useId`, Dialog via refs/effects); Button/IconButton/Card/Badge/EmptyState are hook-free.

## Interfaces / Contracts

```ts
// ui/Button.tsx
type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant   // default 'primary'
  size?: ButtonSize         // default 'md'
  pill?: boolean            // rounded-full
  fab?: boolean             // 56px round + shadow-fab; page owns `fixed` positioning via className
  loading?: boolean         // disabled + spinner, aria-busy
  leftIcon?: string         // Material Symbols name
  rightIcon?: string
}
// primary: bg-primary-btn text-on-primary-btn hover:bg-primary-btn-hover
// ghost:   text-on-surface hover:bg-surface-dim
// outline: border border-outline-variant/50 text-on-surface hover:bg-surface-dim
// danger:  bg-error text-on-error hover:bg-error-container hover:text-on-error-container
// common:  inline-flex items-center gap-2 rounded-lg, disabled:opacity-40 disabled:cursor-not-allowed,
//          focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none
// sizes: sm px-3 py-1.5 text-sm | md px-4 py-3.5 font-label-caps (44px touch) | lg px-6 py-3 font-medium
```

```ts
// ui/IconButton.tsx
interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: string          // Material Symbols name
  label: string         // REQUIRED → aria-label (a11y fails without it, UIP-2)
  variant?: 'ghost' | 'filled' | 'outline'   // default 'ghost'
  filled?: boolean      // fontVariationSettings "'FILL' 1"
}
// fixed w-11 h-11 (44×44 ≥ touch target), rounded-full
```

```ts
// ui/Card.tsx
type CardVariant = 'filled' | 'elevated' | 'outlined' | 'glass'
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant   // default 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'   // default 'md' (p-16)
}
// presentational only (no fetch/routing); rounded-xl
// filled:  bg-surface border border-outline-variant/30 hover:shadow-card-hover (transition-shadow)
// elevated: bg-surface ambient-shadow | outlined: bg-transparent border-outline-variant/50
// glass:    glass-card (bg-surface + backdrop-blur)
```

```ts
// ui/Badge.tsx
type BadgeVariant = 'neutral' | 'primary' | 'error'
  | 'segment-prepare' | 'segment-work' | 'segment-rest' | 'segment-cooldown'
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant   // default 'neutral'
  size?: 'sm' | 'md'       // default 'sm' (text-label-caps 10px, px-2 py-0.5); md = text-xs px-2.5 py-1
}
// colors: bg-{v}/10 text-{v} (neutral: bg-surface-container text-on-surface-variant)
// meaning conveyed in text — color is never the only differentiator (UIP-3)
```

```ts
// ui/Input.tsx
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string          // visible label + htmlFor/id (useId when id omitted)
  error?: string         // below field, text-error, role="alert", aria-describedby
  hint?: string          // helper below field, aria-describedby
  leftIcon?: string      // Material Symbols name
  id?: string
}
// ui/SearchInput.tsx
interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {}
// Input type="search" + search icon + clear ✕ button (rendered when value → onChange(''))
```

```ts
// ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: string          // Material Symbols name, 48px
  title: string
  description?: string
  action?: React.ReactNode
}
// centered column, token colors, max-w-sm
```

```ts
// ui/Dialog.tsx
interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  variant?: 'fixed' | 'sheet'   // default 'fixed'
  footer?: React.ReactNode
  children: React.ReactNode
}
// fixed: <dialog> m-auto rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto
// sheet: .ui-dialog-sheet in globals.css — bottom-anchored, rounded-t-2xl, max-w-2xl(32rem), 85vh,
//        slide-up 0.3s ease-out gated by prefers-reduced-motion; backdrop bg-black/40
// always renders an X IconButton (escape route) in the header
```

## Data Flow

```
Page state ──open/onClose──▶ Dialog ──showModal()/close()──▶ native <dialog>
                                  ◀──cancel/close event────┘ (focus trap/restore native)
```

No other data flow changes; overlays move from imperative `dialogRef`+`showModal()` calls to declarative `open` state.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/globals.css` | Modify | +5 timer tokens, +2 shadow tokens, `.ui-dialog-sheet` + keyframes, `.timer-dark-bg`/`.glass-panel-dark` → var() refs |
| `src/lib/segment-styles.ts` | Modify | `SEGMENT_COLORS` → canonical hexes (lowercase) |
| `src/components/TimerRing.tsx` | Modify | `text-white`→`text-timer-on`, `text-gray-400`→`text-timer-muted`, track → `var(--color-primary-container)` |
| `src/components/__tests__/TimerRing.test.tsx` | Modify | expected hexes → canonical |
| `src/lib/__tests__/segment-styles.test.ts` | Create | DSF-2a drift test (parses globals.css) |
| `package.json` | Modify | `audit:tokens` hex grep, `test:stories` script, devDeps |
| `.storybook/main.ts` | Modify | `addons: ['@storybook/addon-a11y']`, stories glob + `../src/docs/**/*.mdx` |
| `src/docs/Foundations/{Tokens,Typography,Colors}.mdx` | Create | DSF-5 docs pages listing `@theme` values + usage |
| `vitest.config.ts` | Modify | projects: `unit` (jsdom) + `storybook` (browser) |
| `.storybook/vitest.setup.ts` | Create | jest-dom for storybook project |
| `src/components/ui/{Button,IconButton,Card,Badge,Input,SearchInput,EmptyState,Dialog}.tsx` | Create | 8 primitives |
| `src/components/ui/*.stories.tsx` | Create | 8 CSF3 stories, `tags: ['autodocs']`, play functions on interactive ones |
| `src/components/ui/__tests__/*.test.tsx` | Create | RTL unit tests |
| `src/components/ui/index.ts` | Create | barrel |
| `src/app/workouts/page.tsx` | Modify | PMD-1 migration |
| `src/app/exercises/page.tsx` | Modify | PMD-2 migration |
| `src/components/ExerciseSearchHeader.tsx` | Modify | search → SearchInput, buttons → Button (FilterSelect untouched) |
| `src/components/ExerciseFormDialog.tsx` | Modify | internal `<dialog>` → Dialog fixed; API `dialogRef` → `open`/`onClose` |
| `src/components/ExerciseDeleteDialog.tsx` | Modify | same |
| `src/components/AddToWorkoutModal.tsx` | Modify | same |
| `src/app/exercises/[id]/page.tsx` | Modify | ~15 lines: `dialogRef`/`showModal` → `open` state (delete-confirm overlay lives here — PMD-2d) |
| Tests for above (`ExerciseSearchHeader.test`, `ExerciseFormDialog.test`, `ExerciseDeleteDialog.test`, page tests) | Modify/verify | keep green (overlay tests mock components; assertions still pass) |

## Migration / Rollout

**/workouts** (`page.tsx`, 208 lines):
- L54–70 empty state → `EmptyState` (icon `fitness_center`, "No workouts yet", action `Button` "Create Workout")
- L76–85 search input → `SearchInput`; L87–93 "New Workout" → `Button sm primary leftIcon="add"`; L94–103 Type filter → `Button pill` (variant primary/outline by active state)
- L112–118 card → `Card filled` (keeps role/tabIndex/onClick via props passthrough); arbitrary hover shadow → Card's `hover:shadow-card-hover`
- L121–167 ⋮ menu **stays inline** (PMD-1 non-goal); L170–176 card quick-play (36px round) stays inline (below primitive coverage — note for future pass)
- L199–205 FAB → `Button fab` + `className="fixed bottom-24 right-24 md:hidden z-50"`; arbitrary FAB shadow → `shadow-fab`
- `TimelinePreview` unchanged (already token-based)

**/exercises** (`page.tsx`, 347 lines):
- L192–202 / L204–212 empty states → `EmptyState` ×2 (second: title-only, icons `star`/`search_off`)
- L241–317 card → `Card filled` + `Badge` (category, force, mechanic, difficulty, muscle chips → neutral), star → `IconButton filled`, quick-assign → `IconButton`
- L327–337 `ExerciseFormDialog`, L339–344 `AddToWorkoutModal` → controlled `open` state
- Header underline search → `SearchInput` box style (documented visual unification); All/Favorites toggle stays inline (SegmentedControl is a future primitive); `FilterSelect` untouched (PMD-2)

**Overlay components** → `Dialog fixed` with the `dialogRef`→`open`/`onClose` API change (both list and detail pages updated). `RepCompleteDialog` (Spanish strings, fixed-div modal) is a play-screen file → **deferred** to the future change (DSF-4 applies to touched files only).

Rollout: 3 chained stacked-to-main PRs (foundation → primitives → migration). Each slice additive/revertible independently (delete `ui/` folder; per-file reverts; segment swap is one commit).

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit (jsdom) | Primitive rendering + variants; Dialog open/close/ESC/backdrop/focus-restore (showModal polyfill per existing repo pattern); Input error announced; SearchInput clear | `vitest` project `unit`, RTL + jest-dom |
| Storybook | Play functions (Dialog open→ESC close; Input type + error; SearchInput type→clear; Button click) run in a real browser; axe a11y checks per story | project `storybook`, `@storybook/addon-vitest` + Playwright chromium + `@storybook/addon-a11y` |
| Drift/audit | `SEGMENT_COLORS` === `--color-segment-*`; zero hex/rgba literals in touched paths | `segment-styles.test.ts` + `audit:tokens` |
| Regression | Existing suites (incl. page tests) keep passing; overlay tests updated for the `open` prop | `npm test` |

## Estimation (for sdd-tasks)

| Component | Impl | Story (incl. play fns) | RTL test | Slice |
|---|---|---|---|---|
| Button | 105 | 90 | 45 | 2a |
| IconButton | 40 | 35 | 25 | 2a |
| Card | 35 | 35 | 20 | 2a |
| Badge | 45 | 45 | 25 | 2a |
| Input | 85 | 65 | 50 | 2b |
| SearchInput | 40 | 35 | 35 | 2b |
| EmptyState | 30 | 30 | 20 | 2b |
| Dialog | 135 | 105 | 90 | 2c |
| index.ts | 10 | — | — | 2a |
| Foundation (tokens, docs, config) | ~150 changed | — | ~80 new | 1 |
| Migration (2 pages + 3 overlays + [id] page + tests) | ~350–450 changed | — | — | 3 |

Primitives slice ≈ 1,150 lines → **exceeds the 400-line budget**; the slice must itself chain (2a/2b/2c above) or be accepted as `size:exception`. Forecast: `400-line budget risk: High`, `Chained PRs recommended: Yes`.

## Open Questions

- None blocking. Spec-clarification notes to record at archive: (1) DSF-3 "light-mode values" → single always-dark values; (2) `text-gray-300` merges into `timer-muted`; (3) exercises hero search drops its underline style; (4) workout-card quick-play (36px) and All/Favorites toggle remain inline (uncovered by this primitive set).
