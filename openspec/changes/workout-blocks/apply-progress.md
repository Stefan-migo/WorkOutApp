# Apply Progress — workout-blocks (Slice A: WorkoutCard + RepCounter)

Change: `workout-blocks` | PR: A (stacked-to-main, first of 2) | Branch: `feat/workout-blocks-a`
Mode: **Strict TDD** (strict_tdd: true, vitest) | Persistence: hybrid (openspec + engram)
Line budget: ≤500 (approved exception) — **actual 488 changed lines vs main** (466+22)

## Slice A tasks

| Task | Status | Notes |
|------|--------|-------|
| A.1 RED — WorkoutCard.test.tsx | ✅ | 10 tests; RED confirmed (import of missing `WorkoutCard` failed) |
| A.2 RED baseline — RepCounter legacy | ✅ | 5/5 green on current main (file byte-identical to HEAD: md5 `213bb5f5…`) |
| A.3 GREEN — WorkoutCard.tsx | ✅ | DD-1 sibling structure; zero stopPropagation |
| A.4 GREEN — RepCounter.tsx | ✅ | DD-2 Button primary pill; 'use client' dropped; props unchanged |
| A.5 Verify — legacy suite | ✅ | 5/5 pass unchanged after redesign |
| A.6 mock-data.ts | ✅ | WB-5 shapes; no colors |
| A.7 WorkoutCard.stories.tsx | ✅ | autodocs, <main>, app bg, a11y error, play fns |
| A.8 RepCounter.stories.tsx | ✅ | retitled Blocks/RepCounter, Default + NoWeight |
| A.9 blocks.a11y.test.ts | ✅ | ui-primitives pattern; 92/92 browser axe green |
| A.10 Config | ✅ | unit exclude + STORYBOOK_COMPONENT_PATHS `;` join (verified split(';') in addon-vitest) |
| A.11 Gate | ✅ | tsc + slice tests + a11y + tokens + build-storybook all pass |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| A.1/A.3 WorkoutCard | `src/components/blocks/__tests__/WorkoutCard.test.tsx` | Unit (jsdom) | N/A (new) | ✅ Written (import fails) | ✅ 10/10 | ✅ 4 cases (pluralize 1/0, strip null at 0, segment width math 50%) | ✅ Clean (menuAction closure) |
| A.2/A.4/A.5 RepCounter redesign | `src/components/__tests__/RepCounter.test.tsx` (untouched) | Unit (approval) | ✅ 5/5 baseline | N/A (approval — behavior unchanged) | ✅ 5/5 after refactor | ➖ Single (legacy contract) | ✅ In-place DD-2 swap |
| A.9 a11y compose | `src/components/blocks/__tests__/blocks.a11y.test.ts` | Browser (chromium axe) | N/A (new) | N/A (compose infra) | ✅ 92/92 (14 files) | ✅ 5 block stories | ✅ per ui-primitives pattern |

### Test Summary
- **Total tests written**: 10 (WorkoutCard jsdom) + 5 a11y story cases (2 blocks × 5 stories)
- **Total tests passing**: 673 unit (64 files, +10 vs baseline 663) + 92 browser axe
- **Layers used**: Unit (10), Browser/axe (5 stories)
- **Approval tests** (refactoring): 5 (legacy RepCounter suite, byte-identical)
- **Pure functions created**: 0 (components are presentational; TimelinePreview folded per DD-1)

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command + result | `npx vitest run src/components/blocks/__tests__/WorkoutCard.test.tsx src/components/__tests__/RepCounter.test.tsx` → 15/15 passed |
| Runtime harness | `npm run test:a11y` (chromium) → 92/92 axe green; `npm run build-storybook` → success |
| Rollback boundary | Revert merge of PR A; delete `src/components/blocks/`; revert `vitest.config.ts` + `vitest.browser.config.ts`; RepCounter revert restores `src/components/RepCounter.tsx` |

## Deviations from design

1. **DD-2 contrast fix (design risk line 165 contingency)**: `text-muted` for the "reps" suffix and weight line fails axe AA on the app background (3.74:1 < 4.5:1 — verified by ratio computation: `muted #ada19c` vs `bg #55423d`). WorkoutCard's muted meta passes only because it sits on Card `bg-surface` (#271c19, darker). Applied the design's own "fix in-block" path: `text-fg-2/70` (5.21:1, token-based, keeps secondary hierarchy). RepCounter is a block, not a timer component — timer components untouched.
2. **RepCounter story**: removed the legacy `HeavySet` variant to match the design stories table (Default + NoWeight only).
3. **Test locator note**: `getByText('6:00')` exact-match fails because the meta `<p>` concatenates direct text nodes (`6:004 intervals`); used regex matchers (`/6:00/`, `/4 intervals/`) — behavior assertions unchanged.

## Commits (6, work-unit, conventional, no AI attribution)

```
bf5b8dc test(blocks): RED WorkoutCard jsdom contract (WB-1)
d274855 feat(blocks): WorkoutCard with sibling Play + overflow menu (DD-1)
ecd7b21 refactor(ui): RepCounter Button primary pill redesign (DD-2)
9c5cb5c feat(blocks): mock data + WorkoutCard/RepCounter stories (WB-5)
9fbcba7 test(blocks): browser a11y compose suite for block stories (DD-6)
6476aed fix(ui): RepCounter secondary text contrast on app bg (DD-6)
```

`.atl/` files (pre-existing working-tree modifications) NOT committed.

## Gate results (A.11)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean |
| slice tests (WorkoutCard + RepCounter) | ✅ 15/15 |
| `npm run test:a11y` | ✅ 92/92 (14 files) |
| `npm run audit:tokens` | ✅ 4/4 |
| `npm run build-storybook` | ✅ success |
| `npx vitest run` (full unit) | ✅ 673 passed / 64 files (baseline 663/63) |

## Next steps

- Slice B (PlayScreen + WorkoutComplete) per tasks.md — extends `blocks.a11y.test.ts` (A.9 pattern).
- PR A: open stacked PR `feat/workout-blocks-a` → main (first of chain); slice B branches off this branch.
