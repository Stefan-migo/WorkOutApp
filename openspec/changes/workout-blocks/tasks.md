# Tasks: Workout Blocks (design-system v2 — Storybook-first)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1,030 total (A WorkoutCard+RepCounter ~450–500 + B PlayScreen+WorkoutComplete ~450–530) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Stacked slices A → B (per design line 5, proposal decision) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

User-approved exception: proposal accepts ≤500 changed lines per slice (documented exception); if a slice still exceeds, split at apply (design line 168 contingency — per-component story file split, ui-primitives precedent).

## Suggested Work Units (each a chained PR, stacked to `main` in order)

| Unit | Goal | Files | Focused test command | Runtime harness | Rollback boundary | Line budget |
|------|------|-------|----------------------|-----------------|-------------------|-------------|
| A | WorkoutCard + RepCounter redesign + a11y/config | Create `blocks/WorkoutCard.tsx`, `WorkoutCard.stories.tsx`, `__tests__/WorkoutCard.test.tsx`, `mock-data.ts`, `__tests__/blocks.a11y.test.ts`; modify `RepCounter.tsx`, `RepCounter.stories.tsx`, `vitest.config.ts`, `vitest.browser.config.ts` | `npx vitest run src/components/blocks/__tests__/WorkoutCard.test.tsx src/components/__tests__/RepCounter.test.tsx` | `npm run storybook` :6006 → Blocks/WorkoutCard, Blocks/RepCounter | Revert merge; delete `src/components/blocks/`; revert 2 config files; RepCounter revert restores file | ≤500 (exception) |
| B | PlayScreen + WorkoutComplete + a11y extension | Create `blocks/PlayScreen.tsx`, `PlayScreen.stories.tsx`, `__tests__/PlayScreen.test.tsx`, `WorkoutComplete.tsx`, `WorkoutComplete.stories.tsx`, `__tests__/WorkoutComplete.test.tsx`; modify `__tests__/blocks.a11y.test.ts` | `npx vitest run src/components/blocks/__tests__/PlayScreen.test.tsx src/components/blocks/__tests__/WorkoutComplete.test.tsx` | `npm run storybook` :6006 → Blocks/PlayScreen, Blocks/WorkoutComplete | Revert merge; delete the 6 new files; revert a11y extension | ≤500 (exception) |

Contingency: if A or B exceeds ~500, split the story file per component into its own leading slice at apply (design line 168) — order preserved.

## Per-Slice Gates (design lines 131–138; common: `npx tsc --noEmit` + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`)

| Slice | Slice tests (RED-first order) |
|-------|-------------------------------|
| A | `npx vitest run src/components/blocks/__tests__/WorkoutCard.test.tsx src/components/__tests__/RepCounter.test.tsx` (legacy RepCounter suite must stay green) |
| B | `npx vitest run src/components/blocks/__tests__/PlayScreen.test.tsx src/components/blocks/__tests__/WorkoutComplete.test.tsx` |

## Slice A — WorkoutCard + RepCounter (PR A)

Goal: interactive WorkoutCard (DD-1 sibling structure) + in-place RepCounter redesign (DD-2) + a11y compose infra (DD-6); behavior of RepCounter's 5 pinned tests preserved byte-for-byte (DD-5, WB-2d).
Files: per unit table above.
Focused test: `npx vitest run src/components/blocks/__tests__/WorkoutCard.test.tsx src/components/__tests__/RepCounter.test.tsx`.
Runtime harness: `npm run storybook` :6006 → Blocks/WorkoutCard, Blocks/RepCounter (autodocs + play). Rollback: revert merge (additive; RepCounter revert restores file). Line budget: ≤500 (exception; split at apply).

- [x] **A.1** RED — `src/components/blocks/__tests__/WorkoutCard.test.tsx` (WB-1, jsdom): title/duration meta/"N intervals" render; TimelinePreview `null` at 0 intervals; `role="button"` click + Enter → `onOpen` once; Play + ⋮ menu 4 actions fire; Play click does NOT fire `onOpen`. Fails (no component).
- [x] **A.2** RED (baseline) — run `npx vitest run src/components/__tests__/RepCounter.test.tsx` on current main; record the 5-assertion baseline green (WB-2d contract; file byte-identical, never edited — DD-5).
- [x] **A.3** GREEN — `src/components/blocks/WorkoutCard.tsx` (DD-1, WB-1): `'use client'`; relative wrapper; Card `role="button" tabIndex={0}` + Play IconButton (`Play {title}`, `absolute bottom-4 right-4 shadow-fab`) + ⋮ menu trigger (`aria-haspopup="menu" aria-expanded`) as absolute SIBLINGS — no nested interactive descendants, zero `stopPropagation`; click/Enter → `onOpen`; internal TimelinePreview (`SEGMENT_BG_80` from `@/lib/segment-styles`, `(i.duration/total)*100%` widths, `null` at total 0); menu `useState`; 4 actions (Play `text-accent`, Edit/Preview `text-fg-2`, Delete `text-danger`); token-only classes.
- [x] **A.4** GREEN — `src/components/RepCounter.tsx` (DD-2, WB-2): legacy white pill (`bg-timer-on text-accent`) → `<Button variant="primary" pill size="lg" className="px-12" aria-label="Complete set">Complete</Button>`; token-only (`text-fg-2`/`text-muted`, `font-display-timer` verified tokens, `headline-lg` name); drop `'use client'`; props unchanged.
- [x] **A.5** Verify — `npx vitest run src/components/__tests__/RepCounter.test.tsx`: all 5 assertions pass unchanged (WB-2d, DD-5).
- [x] **A.6** `src/components/blocks/mock-data.ts` (WB-5): `MOCK_TIMED_INTERVALS` (prepare 180 / work 30 / rest 30 / cooldown 120), `MOCK_REPS_INTERVALS` (work gains `reps: 10, weight: 60, exerciseId: 'ex1'`), `MOCK_WORKOUTS` (`w1 Morning HIIT` timed, `w2 Strength Circuit` mode `'reps'`) — full `types/workout` shapes; no colors (audit rule 3 safe).
- [x] **A.7** `src/components/blocks/WorkoutCard.stories.tsx` (WB-1/WB-5): CSF3 `tags: ['autodocs']`, `layout: 'centered'`, `backgrounds: { default: 'app' }`, `a11y: { test: 'error' }`, `<main>` decorator, `fn()` callbacks; Default / EmptyIntervals ("0 intervals", strip intact) / RepsWorkout; play: card click → onOpen once, Enter → onOpen, Play → onPlay NOT onOpen.
- [x] **A.8** `src/components/RepCounter.stories.tsx` (DD-5, WB-5): in-place retitle `Blocks/RepCounter`; autodocs, `<main>`, app bg, `fn()`; Default + NoWeight variants; play: Complete → onComplete once.
- [x] **A.9** `src/components/blocks/__tests__/blocks.a11y.test.ts` (DD-6, PR A portion): `ui-primitives.a11y.test.ts` pattern (testStory + explicit axe, exclude `.sb-wrapper/#storybook-docs/#storybook-highlights-root`); WorkoutCard + RepCounter stories, axe violations empty.
- [x] **A.10** Config (DD-6): `vitest.config.ts` `exclude` += `src/components/blocks/__tests__/blocks.a11y.test.ts`; `vitest.browser.config.ts` `STORYBOOK_COMPONENT_PATHS` = both a11y files joined with `;` (verified `split(';')`).
- [x] **A.11** Gate — `npx tsc --noEmit` + slice tests (above) + `npm run test:a11y` + `npm run audit:tokens` (rule 3 scans tests/stories) + `npm run build-storybook`.

## Slice B — PlayScreen + WorkoutComplete (PR B)

Goal: presentational PlayScreen (DD-3 prop freeze, no TimerDisplay/page logic) + WorkoutComplete (DD-4) + a11y extension.
Files: per unit table above.
Focused test: `npx vitest run src/components/blocks/__tests__/PlayScreen.test.tsx src/components/blocks/__tests__/WorkoutComplete.test.tsx`.
Runtime harness: `npm run storybook` :6006 → Blocks/PlayScreen, Blocks/WorkoutComplete (play fns). Rollback: revert merge; delete the 6 new files; revert a11y extension. Line budget: ≤500 (exception; split at apply).

- [ ] **B.1** RED — `src/components/blocks/__tests__/PlayScreen.test.tsx` (WB-3, jsdom): 4 surfaces render (ring/controls/progress bar/set row); paused → Resume control visible; reps branch → RepCounter present, no Pause control; TimerDisplay string absent. Fails (no component).
- [ ] **B.2** GREEN — `src/components/blocks/PlayScreen.tsx` (DD-3, WB-3): prop freeze — TimerRing (`timeLeft`/`duration`/`intervalType`/`label`/`nextLabel`) + TimerControls (`status`/`onPause`/`onResume`/`onSkip`/`onRestart`/`onPrevious?`/`onAddTime?`/`showAddTime?`) verbatim + `setIndex`/`setCount`/`totalProgress`/`progressPercent` + reps branch (`isRepsMode`/`exerciseName?`/`reps?`/`weight?`/`onComplete?`); layout mirrors play page L287–370 (2-col `lg:flex-row`, left title-only panel, right ring+controls OR RepCounter, progress row with `ProgressBar` + `Set {setIndex + 1} of {setCount}`); NO TimerDisplay, NO page logic; no `'use client'` (no hooks).
- [ ] **B.3** RED — `src/components/blocks/__tests__/WorkoutComplete.test.tsx` (WB-4, jsdom): title + summary render interval count and total time; Play Again + Back Home fire `onPlayAgain`/`onBackHome`. Fails.
- [ ] **B.4** GREEN — `src/components/blocks/WorkoutComplete.tsx` (DD-4, WB-4): h1 title with `title?` default "Workout Complete!"; summary ×2 (`{intervals} interval{s} completed`, `Total time: {totalTimeMinutes} min`); `<Button variant="primary" onClick={onPlayAgain}>Play Again</Button>` + `<Button variant="ghost" onClick={onBackHome}>Back Home</Button>`.
- [ ] **B.5** `src/components/blocks/PlayScreen.stories.tsx` (WB-3/WB-5): Running / Paused / RepsMode / AddTime variants; play: Running Pause → onPause, RepsMode Complete → onComplete; autodocs, `<main>`, app bg, `fn()` callbacks.
- [ ] **B.6** `src/components/blocks/WorkoutComplete.stories.tsx` (WB-4/WB-5): Default / CustomTitle; play: Play Again → onPlayAgain, Back Home → onBackHome; autodocs, `<main>`, app bg, `fn()` callbacks.
- [ ] **B.7** Extend `src/components/blocks/__tests__/blocks.a11y.test.ts` with PlayScreen + WorkoutComplete stories (ui-primitives per-slice pattern); axe violations empty.
- [ ] **B.8** Gate — `npx tsc --noEmit` + slice tests (above) + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`.

## Dependency Order (for apply)

A (WorkoutCard + RepCounter — establishes `blocks/` dir, `mock-data.ts`, a11y file + config; B composes RepCounter) → B (PlayScreen + WorkoutComplete — composes TimerRing/TimerControls/ProgressBar/RepCounter, extends a11y file). Each PR merges to `main` in order; per-PR gate identical (`npx tsc --noEmit` + slice tests + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`).

Non-goals (do NOT implement): page wiring / page migration (future change); DropdownMenu, RingGauge, ProgressBar, PageHeader primitives (deferred to `ui/`); TimerDisplay composition (orphaned — WB-3d); timer-era PlayHeader, ExercisePanel, RepCompleteDialog; exercises / sequences / history blocks; any other page; no new runtime/dev dependencies.
