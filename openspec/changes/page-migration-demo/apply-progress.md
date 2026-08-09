# Apply Progress: Page Migration Demo — Slice 3a

**Change**: page-migration-demo (PR 3 of design-system)
**Slice**: 3a — `/workouts` list (PR 3a, stacked-to-main)
**Branch**: feat/page-migration-3a
**Mode**: Strict TDD (approval-test refactor — existing suite is the RED contract)
**Engram note**: engram MCP unavailable this session (empty resource list) → apply-progress persisted to file only; engram `mem_save` pending (`topic_key: sdd/page-migration-demo/apply-progress`).

## Scope

Migrate `src/app/workouts/page.tsx` from inline styles to `ui/` primitives:
Card (DD-A override), EmptyState (DD-G h1→h2), Button (New Workout, FAB with
pill/elevated, empty CTA), IconButton (Play, DD-B sm=36px, DD-I shadow-fab).
Presentational refactor only — behavior identical (PMD-1, PMD-4). Only file
touched: `src/app/workouts/page.tsx` (+ openspec bookkeeping).

## TDD Cycle Evidence

Strict TDD active (openspec/config.yaml `strict_tdd: true`, runner vitest).
Slice 3a is a pure refactoring migration: tasks.md 3a.1 defines the existing
green `WorkoutListPage.test.tsx` (5 tests) as the approval/RED contract the
migration must preserve (strict-tdd.md "Approval Testing" pattern). No new
tests needed — every migrated behavior is already pinned by the suite.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3a.1 | `src/app/workouts/__tests__/WorkoutListPage.test.tsx` | Unit (jsdom) | ✅ 5/5 baseline (RED contract recorded) | ✅ suite = contract | ✅ 5/5 after migration | ➖ Suite covers all 5 migrated behaviors (empty CTA, grid, duration/intervals, card click→edit, FAB) | ➖ None needed |
| 3a.2 | same suite | Unit | ✅ 5/5 | ✅ | ✅ EmptyState test green | ➖ covered by "renders empty state with CTA" | ➖ None |
| 3a.3 | same suite | Unit | ✅ 5/5 | ✅ | ✅ `closest('[role="button"]')` green | ➖ covered by "navigates to workout editor on card click" | ➖ None |
| 3a.4 | same suite | Unit | ✅ 5/5 | ✅ | ✅ aria-label preserved | ➖ smoke (design 3a-4) | ➖ None |
| 3a.5 | same suite | Unit | ✅ 5/5 | ✅ | ✅ `getByLabelText(/create workout/i)` green | ➖ covered by "renders a mobile FAB" | ➖ None |
| 3a.6 | same suite | Unit | ✅ 5/5 | ✅ | ✅ route covered via FAB test | ➖ covered (design 3a-6) | ➖ None |
| 3a.7 | N/A — byte-for-byte preservation | — | — | — | ✅ verified in diff (⋮ menu, TimelinePreview, search input incl. dead `font-body-md`, Type toggle) | — | ➖ Untouched |
| 3a.8 | Gate | — | — | — | ✅ see gate evidence below | — | — |

### Test Summary
- Total tests passing: 5/5 focused; 662/662 full unit suite; 84/84 a11y; 4/4 token audit
- Layers used: Unit (jsdom) — integration/e2e not configured (config.yaml)
- Approval tests: 5 (pre-existing suite reused as contract; no test file changes)
- Pure functions created: 0 (presentational swap)

## Work Unit Evidence

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` → Test Files 1 passed (1), Tests 5 passed (5) — identical before and after migration |
| Runtime harness command/scenario and exact result | `npm run build-storybook` → "Storybook build completed successfully" (primitives compile; UI stories unchanged this slice) + `npm run test:a11y` → 12 files / 84 tests passed (full browser project incl. UI stories). Interactive `npm run dev` smoke deferred to verify phase (orchestrator) |
| Rollback boundary | Revert diff on `src/app/workouts/page.tsx` only — pure presentational swap, no other source file touched (openspec files are SDD bookkeeping) |

## Gate Evidence (3a.8)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, no errors |
| `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` | 1 file / 5 tests passed |
| `npm run test:a11y` | 12 files / 84 tests passed |
| `npm run audit:tokens` | 1 file / 4 tests passed (rule 3 scans tests — no hex/rgba introduced) |
| `npm run build-storybook` | built successfully (output `storybook-static`; chunk-size warning only) |
| Full unit suite | `npx vitest run` → 63 files / 662 tests passed |

## Deviations from Design

None — implementation matches design.md Slice 3a map exactly (DD-A/DD-B/DD-G/DD-H/DD-I).
One transient RED catch during implementation: initial card edit left the legacy
`</div>` closing tag (JSX tag must match `<Card>`) — fixed to `</Card>`, suite green.
3a.7 blocks verified byte-for-byte via `git diff`.

## Issues / Risks

- FAB override coupling (DD-A className-last): `w-14 h-14 px-0` relies on Button
  joining `className` last — verified in `Button.tsx` source; asserted by FAB test.
- EmptyState h1→h2 (DD-G): heading level drop accepted per design; EmptyState
  body uses `text-fg-2` (pre-existing documented deviation in EmptyState.tsx,
  WCAG 4.5:1) vs legacy `text-muted` — accepted, no test asserts color.
- Hover/active scale animation dropped on Play and FAB (DD-I discipline) — accepted drift.

## Line Budget

Actual changed lines vs main: `src/app/workouts/page.tsx` = **53 changed lines**
(numstat ~26 additions + ~27 deletions; budget ≤180). `.atl/` files excluded from
commits. Slice fits stacked-to-main budget — no `size:exception` needed.

## Work-unit Commits

1. `refactor(workouts): migrate workout list page to ui primitives` — `src/app/workouts/page.tsx`
2. `chore(openspec): mark page-migration-demo slice 3a complete` — `tasks.md` + this file

## Status

8/8 tasks complete (3a.1–3a.8). Ready for verify. Next slice: 3b (`/exercises` list surface).
