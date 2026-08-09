# Apply Progress — workout-blocks (Slices A + B: complete)

Change: `workout-blocks` | PRs: A (merged #14) + B (this branch, last of chain) | Branch: `feat/workout-blocks-a` → `feat/workout-blocks-b` → `main`
Mode: **Strict TDD** (strict_tdd: true, vitest) | Persistence: hybrid (openspec + engram)
Line budget: ≤500/slice (approved exception; B forecast ≤530) — **A: 488 changed lines vs main** (466+22) | **B: 524 changed lines vs main** (523+1, within ≤530 exception, no split needed)

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

## Slice B tasks

| Task | Status | Notes |
|------|--------|-------|
| B.1 RED — PlayScreen.test.tsx | ✅ | 10 tests; RED confirmed (import of missing `PlayScreen` failed) |
| B.2 GREEN — PlayScreen.tsx | ✅ | DD-3 prop freeze; 2-col layout mirrors page L287–370; reps branch swaps RepCounter; no TimerDisplay, no hooks, no 'use client' |
| B.3 RED — WorkoutComplete.test.tsx | ✅ | 6 tests; RED confirmed (module missing) |
| B.4 GREEN — WorkoutComplete.tsx | ✅ | DD-4 h1 + summary ×2 + Play Again (primary) + Back Home (ghost) |
| B.5 PlayScreen.stories.tsx | ✅ | Running / Paused / RepsMode / AddTime; play: Pause → onPause, Complete → onComplete; autodocs, <main>, app bg, fn() |
| B.6 WorkoutComplete.stories.tsx | ✅ | Default / CustomTitle; play: Play Again → onPlayAgain, Back Home → onBackHome; autodocs, <main>, app bg, fn() |
| B.7 blocks.a11y.test.ts extension | ✅ | +PlayScreen (4) +WorkoutComplete (2) storyCases; 104/104 browser axe green (16 files) |
| B.8 Gate | ✅ | tsc + slice tests + a11y + tokens + build-storybook all pass; full unit 689/66 |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| B.1/B.2 PlayScreen | `src/components/blocks/__tests__/PlayScreen.test.tsx` | Unit (jsdom) | N/A (new) | ✅ Written (import fails) | ✅ 10/10 | ✅ 4 cases (timeLeft 5→00:05, progressPercent 25, setIndex 3→Set 4 of 4, intervals pluralize via WorkoutComplete) | ✅ Clean (props-in/callbacks-out, no hooks) |
| B.3/B.4 WorkoutComplete | `src/components/blocks/__tests__/WorkoutComplete.test.tsx` | Unit (jsdom) | N/A (new) | ✅ Written (module missing) | ✅ 6/6 | ✅ 3 cases (1 interval plural, custom values 3/7, custom title) | ✅ Clean (default-param title) |
| B.7 a11y compose | `src/components/blocks/__tests__/blocks.a11y.test.ts` | Browser (chromium axe) | ✅ 92/92 (slice A baseline) | N/A (compose infra) | ✅ 104/104 (16 files) | ✅ 6 block stories added | ✅ per ui-primitives pattern |

### Test Summary
- **Total tests written**: 16 slice B jsdom (10 PlayScreen + 6 WorkoutComplete) + 6 a11y story cases
- **Total tests passing**: 689 unit (66 files, +16 vs slice A 673/64) + 104 browser axe
- **Layers used**: Unit (16), Browser/axe (6 stories)
- **Approval tests** (refactoring): None — no refactoring tasks (both blocks new)
- **Pure functions created**: 0 (blocks strictly presentational per DD-3/DD-4)

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command + result | `npx vitest run src/components/blocks/__tests__/PlayScreen.test.tsx src/components/blocks/__tests__/WorkoutComplete.test.tsx` → 16/16 passed |
| Runtime harness | `npm run test:a11y` (chromium) → 104/104 axe green (16 files); `npm run build-storybook` → success |
| Rollback boundary | Revert merge of PR B; delete the 6 new files (`PlayScreen.tsx`, `PlayScreen.stories.tsx`, `__tests__/PlayScreen.test.tsx`, `WorkoutComplete.tsx`, `WorkoutComplete.stories.tsx`, `__tests__/WorkoutComplete.test.tsx`); revert the blocks.a11y.test.ts extension |

## Deviations from design

1. **Slice A (DD-2 contrast fix, design risk line 165 contingency)**: `text-muted` fails axe AA on the app background (3.74:1 < 4.5:1 — `muted #ada19c` vs `bg #55423d`). Applied in-block fix `text-fg-2/70` (5.21:1, token-based). WorkoutCard's muted meta passes because it sits on Card `bg-surface`. RepCounter is a block, not a timer component — timer components untouched.
2. **Slice A**: removed legacy `HeavySet` RepCounter story variant to match the design stories table (Default + NoWeight only).
3. **Slice A test locator note**: `getByText('6:00')` exact-match fails because the meta `<p>` concatenates direct text nodes; used regex matchers (`/6:00/`, `/4 intervals/`).
4. **Slice B (design risk line 166 — timer-era components enter a11y suite)**: ProgressBar's internal `label` (`text-timer-muted`) fails AA on the app bg (3.82:1 < 4.5:1, same muted token math). Fix is block-side composition only: PlayScreen renders `ProgressBar` WITHOUT the `label` prop (bar keeps `role="progressbar"` with fallback `aria-label="Progress"`; the block's own "Total Progress" + `{progressPercent}%` row remains). Timer component internals NOT edited (out of scope). **Escalated finding** — pre-existing, out-of-scope.
5. **Slice B (same finding)**: `nextLabel` NOT passed in PlayScreen stories (TimerRing renders it with internal `text-timer-muted` — fails AA on app bg). Block fully supports `nextLabel` per DD-3 prop freeze; jsdom test verifies forwarding. TimerRing internals NOT edited (out of scope). **Escalated finding** — pre-existing, out-of-scope.
6. **Slice B**: block-owned secondary labels ("Total Progress", "Set X of Y", WorkoutComplete summary ×2) use `text-fg-2/70` (slice A precedent) instead of design's `text-muted` — same contrast rationale, in-block fix per design contingency.

## Commits (Slice A: 6, work-unit, conventional, no AI attribution)

```
bf5b8dc test(blocks): RED WorkoutCard jsdom contract (WB-1)
d274855 feat(blocks): WorkoutCard with sibling Play + overflow menu (DD-1)
ecd7b21 refactor(ui): RepCounter Button primary pill redesign (DD-2)
9c5cb5c feat(blocks): mock data + WorkoutCard/RepCounter stories (WB-5)
9fbcba7 test(blocks): browser a11y compose suite for block stories (DD-6)
6476aed fix(ui): RepCounter secondary text contrast on app bg (DD-6)
```

## Commits (Slice B: 7, work-unit, conventional, no AI attribution)

```
957197f test(blocks): RED PlayScreen jsdom contract (WB-3)
0afdd89 feat(blocks): PlayScreen composing timer surfaces (DD-3)
1db65db test(blocks): RED WorkoutComplete jsdom contract (WB-4)
370c37e feat(blocks): WorkoutComplete with Play Again and Back Home (DD-4)
41eecee docs(blocks): PlayScreen and WorkoutComplete stories (WB-5)
2c0e5cb test(blocks): extend browser a11y suite with PlayScreen + WorkoutComplete (DD-6)
{chore(openspec): mark slice B complete + apply-progress}
```

`.atl/` files (pre-existing working-tree modifications) NOT committed.

## Gate results (A.11 / B.8)

| Command | Slice A | Slice B |
|---|---|---|
| `npx tsc --noEmit` | ✅ clean | ✅ clean |
| slice tests | ✅ 15/15 | ✅ 16/16 |
| `npm run test:a11y` | ✅ 92/92 (14 files) | ✅ 104/104 (16 files) |
| `npm run audit:tokens` | ✅ 4/4 | ✅ 4/4 |
| `npm run build-storybook` | ✅ success | ✅ success |
| `npx vitest run` (full unit) | ✅ 673 / 64 files | ✅ 689 / 66 files |

## Next steps

- Slice B is the LAST PR in the chain — open stacked PR `feat/workout-blocks-b` → `main` (PR #15) targeting main after PR A merged.
- After merge: sdd-verify phase (full suite + a11y + tokens + build) against the merged state.
