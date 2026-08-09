# Tasks: UI Primitives (PR 2 — design-system)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,480–1,540 (infra ~50 + 8 primitives ~430 + 8 stories ~600 + 9 test files ~400) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Stacked slices 2a → 2b → 2c → 2d (per design line 158) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

User-approved exception: none needed — auto-chain policy; each slice stays ≤400 lines.

## Suggested Work Units (each a chained PR, stacked to `main` in order)

| Unit | Goal | Files | Focused test command | Runtime harness | Rollback boundary | Line budget |
|------|------|-------|----------------------|-----------------|-------------------|-------------|
| 2a | D10 infra + preview fix + Button + IconButton | `vitest.config.ts` (mod), `package.json` (mod), `ci.yml` (mod), `.storybook/preview.tsx` (mod), delete `vitest.config.mts`; create `Button.tsx`, `IconButton.tsx`, `index.ts`, `Button.stories.tsx`, `IconButton.stories.tsx`, `__tests__/Button.test.tsx`, `__tests__/IconButton.test.tsx`, `__tests__/ui-primitives.a11y.test.ts` | `npx vitest run src/components/ui/__tests__/Button.test.tsx src/components/ui/__tests__/IconButton.test.tsx` + `npx vitest run --project storybook` | `npm run storybook` :6006 → UI/Button, UI/IconButton | Revert merge; `ui/` unused by pages (PR 3 consumes) — delete safe | ≤400 |
| 2b | Card + Badge | Create `Card.tsx`, `Badge.tsx`, `Card.stories.tsx`, `Badge.stories.tsx`, `__tests__/Card.test.tsx`, `__tests__/Badge.test.tsx`; modify `index.ts`, `ui-primitives.a11y.test.ts` | `npx vitest run src/components/ui/__tests__/Card.test.tsx src/components/ui/__tests__/Badge.test.tsx` | SB → UI/Card, UI/Badge | Revert merge | ≤340 |
| 2c | Input + SearchInput | Create `Input.tsx`, `SearchInput.tsx`, stories ×2, tests ×2; modify `index.ts`, `ui-primitives.a11y.test.ts` | `npx vitest run src/components/ui/__tests__/Input.test.tsx src/components/ui/__tests__/SearchInput.test.tsx` | SB → UI/Input, UI/SearchInput | Revert merge | ≤400 |
| 2d | EmptyState + Dialog (last — reuses 2a Button/patterns) | Create `EmptyState.tsx`, `Dialog.tsx`, stories ×2, tests ×2; modify `index.ts`, `ui-primitives.a11y.test.ts` | `npx vitest run src/components/ui/__tests__/EmptyState.test.tsx src/components/ui/__tests__/Dialog.test.tsx` + `npx vitest run --project storybook` | SB → UI/Dialog (open/ESC/backdrop/focus-restore play) | Revert merge | ≤400 |

Contingency: if 2d exceeds budget, split EmptyState (~180) into its own slice before Dialog — order preserved.

## Slice 2a — D10 infra + Button + IconButton (PR 2a)

- [ ] **2a.1** RED — `src/components/ui/__tests__/Button.test.tsx` (UIP-2): native `<button>`; 4 variants (`primary`/`ghost`/`outline`/`danger`) assert exact DD-2 class maps; sizes sm/md/lg → `h-9 px-3`/`h-11 px-4`/`h-12 px-5`; `pill` → `rounded-full`; `elevated` → `shadow-fab`; disabled → `disabled:opacity-50 disabled:pointer-events-none` + `disabled` attr. Fails (no component).
- [ ] **2a.2** RED — `src/components/ui/__tests__/IconButton.test.tsx` (UIP-2 + touch-target constraint): ≥44×44 (`h-11 w-11`); variant map; disabled inert. TS-level RED: omitting `aria-label` must fail `npx tsc --noEmit` (UIP-2).
- [ ] **2a.3** GREEN — `src/components/ui/Button.tsx`: base + variant maps per design (DD-1/2); typography ONLY `font-label text-label-caps` (DD-8); zero hex/rgba (DD-7).
- [ ] **2a.4** GREEN — `src/components/ui/IconButton.tsx`: `'aria-label': string` required prop; size `sm`|`md` (md = 44×44).
- [ ] **2a.5** `src/components/ui/index.ts` — export Button, IconButton (D8 barrel, 2 exports).
- [ ] **2a.6** `Button.stories.tsx` + `IconButton.stories.tsx` — CSF3, `tags: ['autodocs']`, args/controls; play fn on Button (fn spy) per UIP-7; backgrounds only named SB values (DD-7).
- [ ] **2a.7** D10 infra (DD-4): add devDeps `@storybook/addon-vitest`, `@vitest/browser`, `playwright`; `vitest.config.ts` → `test.projects = [unit (jsdom), storybook (playwright chromium)]` keeping `@` alias + `globals: true` + `maxWorkers`; delete `vitest.config.mts`; `ci.yml` add `npx playwright install --with-deps chromium` before Tests step. Verify `npm test` still runs all 598 existing tests (design open Q2).
- [ ] **2a.8** RED — `src/components/ui/__tests__/ui-primitives.a11y.test.ts` (DD-5/UIP-7): compose 2a stories, run play fns, assert axe violations empty under storybook project. Fails until 2a.6/2a.7 land; extended in 2b–2d.
- [ ] **2a.9** DD-6 — `.storybook/preview.tsx`: `app` bg `var(--color-background)` → `var(--color-bg)`; delete `#0a0e1a`/`#f8f9ff` + stale Material var (drift fix; not a PR 1 reopen).
- [ ] **2a.10** Gate: `npx tsc --noEmit` + unit + `--project storybook` + `npm run audit:tokens` (DD-7: rule 3 scans `__tests__`, rules 1/4 scan stories) + `npm run build-storybook`.

## Slice 2b — Card + Badge (PR 2b)

- [x] **2b.1** RED — `__tests__/Card.test.tsx` (UIP-3): `default`/`raised`/`inset` variant class maps; `interactive` → `cursor-pointer` + hover classes; presentational only (no fetch/router). Fails.
- [x] **2b.2** RED — `__tests__/Badge.test.tsx` (UIP-3): all tones incl. `segment-*`; semantic text conveys meaning — color never sole differentiator (scenario).
- [x] **2b.3** GREEN — `Card.tsx` (DD-2 maps: `bg-surface`/`shadow-card-hover`/`bg-bg`; DD-7/8).
- [x] **2b.4** GREEN — `Badge.tsx` (neutral/primary/success/warn/danger + 4 segment tones; `bg-segment-*/10` opacity suffix must compile under Tailwind v4).
- [x] **2b.5** `Card.stories.tsx` + `Badge.stories.tsx` — CSF3 autodocs; variants via controls (UIP-3 cycling scenario).
- [x] **2b.6** `index.ts` +2 exports.
- [x] **2b.7** Extend `ui-primitives.a11y.test.ts` with Card/Badge stories.
- [x] **2b.8** Gate: tsc + slice tests + `--project storybook` + `audit:tokens` + `build-storybook`.

## Slice 2c — Input + SearchInput (PR 2c)

- [x] **2c.1** RED — `__tests__/Input.test.tsx` (UIP-4): visible label (never placeholder-only); `htmlFor`/`id` association; error renders near field + `aria-invalid` + `aria-describedby`; `leadingIcon` → `pl-10`. Fails.
- [x] **2c.2** RED — `__tests__/SearchInput.test.tsx` (UIP-4): `type="search"`; clear affordance `aria-label="Clear search"` visible when `value !== ''`; click → `onChange('')` + refocus. Fails.
- [x] **2c.3** GREEN — `Input.tsx` (`'use client'` for `useId`; DD-2/7/8 maps: `text-label-caps` label, `text-body-md` field, `text-data-sm` error).
- [x] **2c.4** GREEN — `SearchInput.tsx` (composes Input; inline-SVG search icon).
- [x] **2c.5** `Input.stories.tsx` + `SearchInput.stories.tsx` — CSF3 autodocs; error state story (UIP-4 announced scenario).
- [x] **2c.6** `index.ts` +2 exports.
- [x] **2c.7** Extend `ui-primitives.a11y.test.ts` (label association + error `aria-describedby` wiring must be axe-exact).
- [x] **2c.8** Gate: tsc + slice tests + storybook project + audit + build-storybook. (Risk: `useId` SSR hydration — harmless single render.)

## Slice 2d — EmptyState + Dialog/Sheet (PR 2d)

- [x] **2d.1** RED — `__tests__/EmptyState.test.tsx` (UIP-5): optional icon/title/body/action render; token colors. Fails.
- [x] **2d.2** RED — `__tests__/Dialog.test.tsx` (UIP-6, jsdom): `open` → `showModal()`, close → `close()`; ESC/cancel + backdrop → `onOpenChange(false)`; `aria-modal="true"` + labelled title. jsdom `<dialog>` is partial — focus-restore NOT asserted here (UIP-6b → browser play in 2d.7). Fails.
- [x] **2d.3** GREEN — `EmptyState.tsx` (`text-headline-md` title, `text-body-md` body, `text-meta` icon — DD-8).
- [x] **2d.4** GREEN — `Dialog.tsx` (DD-3, D9): controlled native `<dialog>`; backdrop `e.target === ref.current`; `onCancel` preventDefault + `onOpenChange(false)`; `onClose` idempotent; `aria-labelledby` via `useId`; `fixed`/`sheet` variants; sheet slide `motion-reduce:translate-x-0 motion-reduce:transition-none` (UIP-6d).
- [x] **2d.5** `EmptyState.stories.tsx` + `Dialog.stories.tsx` — Dialog story: stateful wrapper + trigger Button (reuses 2a).
- [x] **2d.6** `index.ts` +2 exports (complete barrel, UIP-1).
- [x] **2d.7** Extend `src/components/ui/__tests__/ui-primitives.a11y.test.ts`: browser play open → ESC → backdrop → focus-restore (UIP-6b asserted in browser, NOT jsdom) + axe per story.
- [x] **2d.8** Gate: tsc + slice tests + `--project storybook` + audit + build-storybook.

## Dependency Order (for apply)

2a (infra + Button/IconButton — everything depends on D10 config and barrel) → 2b → 2c → 2d (Dialog last: reuses Button/patterns; jsdom dialog partial). Each PR merges to `main` in order; per-PR gate identical (tsc + slice tests + storybook project + `audit:tokens` + `build-storybook`).

Non-goals (do NOT implement): page migration to primitives (PR 3 `page-migration-demo`); remaining 13 inventory primitives (DropdownMenu, SegmentedControl, ListRow, RingGauge, ProgressBar, TimelineStrip, FilterSelect, PageHeader, DateDayBlock, MetricStat, ConfirmDialog, icon wrapper, TypeIcon); shadcn/ui; Radix; Chromatic; Storybook test-runner; theme toggle; light theme; cva/`asChild` factories (D11); any runtime dependency (spec Constraints).
