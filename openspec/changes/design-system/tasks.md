# Tasks: Design System for WorkOutApp

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,900–2,100 (design estimates: foundation ~300, primitives ~1,150, migration ~350–450 + tests) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2a → PR 2b → PR 2c → PR 2d → PR 3 (stacked to main, in order) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Note: the primitives slice (~1,150 lines per design) cannot be split into 3 PRs ≤400 — adjusted to 4 slices (2a–2d). PR 3 is borderline (~350–450); apply must monitor and split into 3a (`/workouts`) / 3b (`/exercises` + overlays) if it approaches 400.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: tokens, drift test, a11y addon, MDX docs | PR 1 | base main; additive, one-commit segment revert |
| 2 | Button + IconButton + barrel | PR 2a | base main after PR 1; additive (delete `ui/` to revert) |
| 3 | Card + Badge + EmptyState | PR 2b | base main after PR 2a |
| 4 | Input + SearchInput + Vitest browser infra | PR 2c | base main after PR 2b; infra additive, dev-only |
| 5 | Dialog/Sheet (fixed + sheet) | PR 2d | base main after PR 2c; play + a11y run via 2c infra |
| 6 | `/workouts` + `/exercises` migration, overlays → Dialog | PR 3 | base main after PR 2d; per-file reverts; split 3a/3b if >400 |

All slices keep the repo green independently: tsc + scoped vitest + storybook build.

## PR 1 — design-system-foundation

- [x] **T1.1** Add 5 timer tokens (`--color-timer-bg #091426`, `--color-timer-surface rgba(255,255,255,0.05)`, `--color-timer-on #ffffff`, `--color-timer-border rgba(255,255,255,0.2)`, `--color-timer-muted #9ca3af`) + 2 shadow tokens (`--shadow-card-hover`, `--shadow-fab`) to `@theme` in `src/app/globals.css`; redefine `.timer-dark-bg`/`.glass-panel-dark` → var() refs. No unit test (CSS; covered by T1.2 drift test + build). Done: `npx tsc --noEmit` clean, `npm run build-storybook` OK.
- [x] **T1.2** RED — write `src/lib/__tests__/segment-styles.test.ts` (DSF-2a): regex-parse `globals.css` `--color-segment-*` and assert `SEGMENT_COLORS` matches per `IntervalType`. Run `npx vitest run src/lib/__tests__/segment-styles.test.ts` → fails (current hexes drift).
- [x] **T1.3** GREEN — `src/lib/segment-styles.ts`: `SEGMENT_COLORS` → canonical lowercase hexes (prepare `#3b82f6`, work `#10b981`, rest/rest_between_cycles `#ef4444`, cooldown `#8b5cf6`). Same command → passes.
- [x] **T1.4** RED — `src/components/__tests__/TimerRing.test.tsx`: update expected stroke hexes to canonical. Run `npx vitest run src/components/__tests__/TimerRing.test.tsx` → fails.
- [x] **T1.5** GREEN — `src/components/TimerRing.tsx` (DSF-2b/DSF-3b): `text-white`→`text-timer-on`, `text-gray-400`→`text-timer-muted`, track `stroke="#1E293B"`→`var(--color-primary-container)` via `style` (SVG pres. attrs don't resolve vars). Dep: T1.1. Same command → passes.
- [x] **T1.6** Extend `audit:tokens` in `package.json` (DSF-1b/D4): append scoped hex grep `grep -rE '#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)' src/components/ui src/app/workouts/page.tsx src/app/exercises/page.tsx src/components/ExerciseSearchHeader.tsx || echo OK` (keep `|| echo OK`; `ui/` doesn't exist until PR 2a). Done: `npm run audit:tokens` exits 0.
- [x] **T1.7** Install `@storybook/addon-a11y` (dev); register in `.storybook/main.ts` `addons` + add `../src/docs/**/*.mdx` to stories glob (DSF-6). Done: `npm run build-storybook` OK.
- [x] **T1.8** Create `src/docs/Foundations/{Tokens,Typography,Colors}.mdx` listing current `@theme` values + usage examples (DSF-5). Done: `npm run build-storybook` OK.
- [x] **T1.9** PR 1 gate: `npx tsc --noEmit`; `npx vitest run src/lib/__tests__/segment-styles.test.ts src/components/__tests__/TimerRing.test.tsx`; `npm run audit:tokens`; `npm run build-storybook`; grep touched files for Spanish UI strings (DSF-4 — `RepCompleteDialog` is deferred to future play-screen change, verify only).

Commits (work units): `feat(tokens): add timer and shadow tokens to @theme` → `fix(segment-styles): canonicalize SEGMENT_COLORS to @theme tokens with drift test` → `refactor(TimerRing): use timer tokens` → `chore(audit): scope audit:tokens hex check to touched paths` → `docs(storybook): add a11y addon and Foundations MDX pages`.

## PR 2a — Button + IconButton + barrel

- [ ] **T2.1** RED — `src/components/ui/__tests__/Button.test.tsx` (UIP-2): native button, variant/size classes, pill/fab, disabled inert + distinct, `loading` → disabled + `aria-busy`. Run `npx vitest run src/components/ui/__tests__/Button.test.tsx` → fails (missing).
- [ ] **T2.2** GREEN — `src/components/ui/Button.tsx` (D7: plain `Record<variant,string>` maps, `leftIcon`/`rightIcon` Material Symbols, hook-free → no `'use client'`). Same command → passes.
- [ ] **T2.3** `src/components/ui/Button.stories.tsx` — CSF3 autodocs, args/controls, play fn (click). Done: renders in `npm run build-storybook`; play executes once 2c infra lands.
- [ ] **T2.4** RED — `src/components/ui/__tests__/IconButton.test.tsx`: `w-11 h-11` (≥44×44), renders `aria-label` (UIP-2). Run `npx vitest run src/components/ui/__tests__/IconButton.test.tsx` → fails.
- [ ] **T2.5** GREEN — `src/components/ui/IconButton.tsx` (`icon` + required `label` → `aria-label`). Same command → passes.
- [ ] **T2.6** `src/components/ui/IconButton.stories.tsx` — autodocs; include an unlabeled variant demonstrating the UIP-2 a11y violation (visible in Accessibility panel).
- [ ] **T2.7** Create `src/components/ui/index.ts` barrel re-exporting Button + IconButton.
- [ ] **T2.8** PR 2a gate: `npx tsc --noEmit`; `npx vitest run src/components/ui/__tests__/Button.test.tsx src/components/ui/__tests__/IconButton.test.tsx`; `npm run build-storybook`.

Commits: `feat(ui): add Button primitive with stories, tests, and barrel` → `feat(ui): add IconButton primitive with stories and tests`.

## PR 2b — Card + Badge + EmptyState

- [ ] **T2b.1** RED — `Card.test.tsx` (UIP-3): variants filled/elevated/outlined/glass + padding classes; presentational passthrough. Run `npx vitest run src/components/ui/__tests__/Card.test.tsx` → fails.
- [ ] **T2b.2** GREEN — `src/components/ui/Card.tsx` (hover:shadow-card-hover on filled). Same command → passes.
- [ ] **T2b.3** `Card.stories.tsx` — variant cycling incl. dark-mode story.
- [ ] **T2b.4** RED — `Badge.test.tsx` (UIP-3): variant classes (neutral/primary/error/segment-*), sizes, meaning conveyed in text. Run `npx vitest run src/components/ui/__tests__/Badge.test.tsx` → fails.
- [ ] **T2b.5** GREEN — `src/components/ui/Badge.tsx`. Same command → passes.
- [ ] **T2b.6** `Badge.stories.tsx` — segment variants with textual labels (color never sole differentiator).
- [ ] **T2b.7** RED — `EmptyState.test.tsx` (UIP-5): icon/title/message/action render. Run `npx vitest run src/components/ui/__tests__/EmptyState.test.tsx` → fails.
- [ ] **T2b.8** GREEN — `src/components/ui/EmptyState.tsx` (centered column, token colors, max-w-sm). Same command → passes.
- [ ] **T2b.9** `EmptyState.stories.tsx` — with and without action.
- [ ] **T2b.10** PR 2b gate: tsc; `npx vitest run src/components/ui/__tests__/`; `npm run build-storybook`; update `index.ts` with 3 exports.

Commits: `feat(ui): add Card primitive with stories and tests` → `feat(ui): add Badge primitive with stories and tests` → `feat(ui): add EmptyState primitive with stories and tests`.

## PR 2c — Input + SearchInput + Vitest browser infra

- [ ] **T2c.1** Infra (UIP-7/D6): add devDeps `@storybook/addon-vitest`, `@storybook/test`, `@playwright/test`; `vitest.config.ts` → `test.projects` = `unit` (jsdom, current settings) + `storybook` (plugins `storybookTest({configDir: '.storybook'})`, browser `{enabled, headless, provider:'playwright', instances:[{browser:'chromium'}]}`, setupFiles `./.storybook/vitest.setup.ts`); create `.storybook/vitest.setup.ts` (`@testing-library/jest-dom/vitest`); script `"test:stories": "vitest run --project storybook"`; run `npx playwright install chromium` (dev-only, first-run download). Done: `npx vitest run --project unit src/components/__tests__/TimerRing.test.tsx` (existing suite unaffected) + `npm run build-storybook`. Risk: chromium download may fail on Windows/CI — the browser project is additive; if flaky, keep storybook tests as local verification, unit tests remain the gate.
- [ ] **T2c.2** RED — `Input.test.tsx` (UIP-4): label↔field association (`htmlFor`/`id`, `useId`), `error` → `role="alert"` + `aria-describedby`, hint. Run `npx vitest run src/components/ui/__tests__/Input.test.tsx` → fails.
- [ ] **T2c.3** GREEN — `src/components/ui/Input.tsx` (`'use client'` for `useId`). Same command → passes.
- [ ] **T2c.4** `Input.stories.tsx` — autodocs; play fn (type + error).
- [ ] **T2c.5** RED — `SearchInput.test.tsx`: `type="search"`, clear ✕ appears with value, `onChange('')`. Run `npx vitest run src/components/ui/__tests__/SearchInput.test.tsx` → fails.
- [ ] **T2c.6** GREEN — `src/components/ui/SearchInput.tsx` (wraps Input, search icon + clear). Same command → passes.
- [ ] **T2c.7** `SearchInput.stories.tsx` — play fn (type → clear).
- [ ] **T2c.8** PR 2c gate: tsc; `npx vitest run src/components/ui/__tests__/`; `npx vitest run --project storybook` (all stories incl. 2a Button play); `npm run build-storybook`; update `index.ts`.

Commits: `test(storybook): add vitest browser project for play functions and a11y` → `feat(ui): add Input primitive with stories and tests` → `feat(ui): add SearchInput primitive with stories and tests`.

## PR 2d — Dialog/Sheet

- [ ] **T2d.1** RED — `Dialog.test.tsx` (UIP-6a–d): `open`→`showModal`, ESC (`cancel` event) → `onClose`, backdrop click (`e.target === ref`), focus restored, title `aria-labelledby`, sheet variant class; use repo showModal polyfill pattern (see `WorkoutEditor.test.tsx`). Run `npx vitest run src/components/ui/__tests__/Dialog.test.tsx` → fails.
- [ ] **T2d.2** GREEN — `src/components/ui/Dialog.tsx` (D5): controlled `open`/`onClose` effect, native `cancel` + `close` events, `fixed` (m-auto max-w-lg) + `sheet` variants, header with X IconButton. Same command → passes.
- [ ] **T2d.3** Add `.ui-dialog-sheet` class + slide keyframes to `src/app/globals.css` gated by `@media (prefers-reduced-motion: no-preference)` (UIP-6d). No unit test (CSS).
- [ ] **T2d.4** `Dialog.stories.tsx` — fixed + sheet; play fn (open → ESC → close, focus restored). Done: `npx vitest run --project storybook` runs the play + a11y checks.
- [ ] **T2d.5** PR 2d gate: tsc; `npx vitest run src/components/ui/__tests__/Dialog.test.tsx`; `npx vitest run --project storybook`; `npm run build-storybook`; update `index.ts`.

Commits: `feat(ui): add Dialog/Sheet primitive with stories, tests, and play`.

## PR 3 — page-migration-demo

- [ ] **T3.1** Migrate `src/app/workouts/page.tsx` (PMD-1): empty state → `EmptyState` (icon `fitness_center`, "No workouts yet", action Button "Create Workout"); search → `SearchInput`; "New Workout" → `Button sm primary leftIcon="add"`; type filter → `Button pill`; card → `Card filled` (keep role/tabIndex/onClick passthrough); FAB → `Button fab` + `className="fixed bottom-24 right-24 md:hidden z-50"` + `shadow-fab`. ⋮ menu and 36px quick-play stay inline (PMD-1 non-goal, `ponytail:` comment). Test-first: baseline `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` (green pre-migration) → migrate → adjust queries → same command green. Dep: PR 2a–2c (Button, Card, EmptyState, SearchInput).
- [ ] **T3.2** Overlay API change (PMD-2d, D5): `src/components/ExerciseFormDialog.tsx`, `ExerciseDeleteDialog.tsx`, `AddToWorkoutModal.tsx` — drop `dialogRef` prop + internal `<dialog>`, accept `open`/`onClose` and render `Dialog fixed`. Test-first: update `ExerciseFormDialog.test.tsx` + `ExerciseDeleteDialog.test.tsx` to the `open` prop API → `npx vitest run src/components/__tests__/ExerciseFormDialog.test.tsx src/components/__tests__/ExerciseDeleteDialog.test.tsx`; then implement. Dep: PR 2d.
- [ ] **T3.3** `src/app/exercises/[id]/page.tsx` (~15 lines): delete-confirm overlay `dialogRef`/`showModal` → `open` state. Test-first: update `src/app/exercises/[id]/__tests__/page.test.tsx` → `npx vitest run src/app/exercises/[id]/__tests__/page.test.tsx`; then implement. Dep: T3.2.
- [ ] **T3.4** Migrate `src/app/exercises/page.tsx` (PMD-2) + `src/components/ExerciseSearchHeader.tsx`: empty states ×2 → `EmptyState` (icons `star`/`search_off`); card grid → `Card filled` + `Badge` (neutral chips) + star `IconButton filled` + quick-assign `IconButton`; overlays wired via `open` state (T3.2 API); search → `SearchInput`; `FilterSelect` untouched; All/Favorites toggle inline. Test-first: baseline `npx vitest run src/app/exercises/__tests__/ExercisesPage.test.tsx src/components/__tests__/ExerciseSearchHeader.test.tsx` → migrate → adjust queries → same commands green. Dep: T3.1? no — Dep: T3.2, PR 2a–2d.
- [ ] **T3.5** Colocate minimal stories for extracted page components (WorkoutCard / ExerciseCard) if extraction created named components (PMD-3 proof). Done: `npx vitest run --project storybook` + `npm run build-storybook`.
- [ ] **T3.6** PR 3 gate (PMD-3/PMD-4): `npx tsc --noEmit`; `npm run audit:tokens` (scoped hex grep now covers migrated paths — must pass); touched suites `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx src/app/exercises/__tests__/ExercisesPage.test.tsx src/components/__tests__/ExerciseSearchHeader.test.tsx src/components/__tests__/ExerciseFormDialog.test.tsx src/components/__tests__/ExerciseDeleteDialog.test.tsx src/app/exercises/[id]/__tests__/page.test.tsx`; `npm run build-storybook`; manual smoke `npm run dev` (search/filter/navigation/dialogs). If diff approaches 400 → split 3a (`/workouts`) / 3b (`/exercises` + overlays).

Commits: `feat(workouts): migrate list page to ui primitives` → `refactor(exercises): switch overlays to controlled Dialog API` → `feat(exercises): migrate list page to ui primitives` → `test(storybook): add page component stories` (if T3.5 produced files).

## Dependency Order (for apply)

PR 1 → PR 2a → PR 2b → PR 2c → PR 2d → PR 3 (each merges to main in order; stacked-to-main). Intra-PR: T1.1 before T1.5; T2.1 before T2.3; T3.2 before T3.3 before T3.4. Non-goals (do NOT implement): shadcn/ui, Chromatic, addon-designs, test-runner, dark toggle, remaining 13 primitives.
