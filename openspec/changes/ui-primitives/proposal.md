# Proposal: PR 2 — UI Primitives

## Intent

PR 1 (foundation) delivered the Happy Hues token layer, but pages still hand-roll 30+ button instances, 3 coexisting modal patterns, and duplicated CSS. This change builds `src/components/ui/` — 8 token-driven, typed, dependency-free primitives (Button, IconButton, Card, Badge, Input, SearchInput, EmptyState, Dialog/Sheet) per UIP-1..8, with CSF3 stories and a11y checks, replacing ad-hoc patterns with one standard.

## Scope

### In Scope
- 8 primitives in `src/components/ui/` (D8 flat layout) + barrel `index.ts`, typed props
- Colocated CSF3 stories: autodocs, args, controls; play functions on interactive primitives (UIP-7)
- a11y checks per story under Vitest via SB browser project (D10)
- Native `<dialog>` controlled base, `fixed`/`sheet` variants (D9); token styling per D11 maps
- Plain `Record<variant, string>` class maps — no cva/`asChild` (D11)

### Out of Scope
- Page migration — PR 3 (`page-migration-demo`)
- Remaining inventory primitives (future changes): DropdownMenu, SegmentedControl, ListRow, RingGauge, ProgressBar, TimelineStrip, FilterSelect, PageHeader, DateDayBlock, MetricStat, ConfirmDialog, icon wrapper, TypeIcon
- Feature-level components in `ui/`; shadcn/ui; Radix; Chromatic; SB test-runner; theme toggle / light theme

## Capabilities

### New Capabilities
- `ui-primitives`: spec exists at `openspec/specs/ui-primitives/spec.md` (UIP-1..8) — reuse verbatim; sdd-spec confirms coverage, no rewrite

### Modified Capabilities
- None

## Approach

Contract = existing `ui-primitives` spec + parent design D8–D11 (`openspec/changes/design-system/design.md`). Storybook-first: each primitive ships with a CSF3 story; interactive stories carry play functions run via Vitest (D10). Styling only from Happy Hues tokens per D11 contracts (Button/IconButton/Card/Badge/Dialog maps, `focus-visible:focus-ring` per D4). Zero new dependencies.

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Spec: reuse vs rewrite | Reuse existing spec — authored for exactly this change |
| 2 | Chain: stacked-to-main vs feature-branch | Stacked-to-main — PR 1 convention (PR #6 → `main`); slices merge in order |
| 3 | Delivery: ≈1,150 lines vs 400-line budget | Auto-chain slices 2a–2d (parent design line 341) |

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/components/ui/` | New | primitives + stories + `__tests__/` + `index.ts` (D8) |
| `.storybook/` | Verify only | a11y addon + story glob already registered (D10) |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Dialog a11y (focus trap, ESC, restore) | Med | native `<dialog>` + play functions + axe per story (UIP-6/7) |
| Stacked-slice diff drift | Med | merge each slice to `main` in order; clean per-slice diff |
| Token drift in primitives | Low | `audit:tokens` contract-lock still gates `src` |

## Rollback Plan

Additive: delete `src/components/ui/` — no pages consume it yet (migration is PR 3). Per-slice revert via merge reversal.

## Dependencies

None new. Storybook 10.5.5 + `@storybook/addon-a11y` installed in PR 1. Parent design.md D8–D11 as contract.

## Success Criteria

- [ ] 8 primitives ship with stories; play + a11y checks green under Vitest
- [ ] Token-only styling; no runtime deps
- [ ] `npx tsc --noEmit`, `npm test`, `npm run build-storybook` green
- [ ] Slices 2a–2d each within the 400-line review budget
