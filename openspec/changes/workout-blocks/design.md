# Design: Workout Blocks — Design System v2 (Storybook-first)

## Technical Approach

Build 4 presentational blocks — WorkoutCard, RepCounter, PlayScreen, WorkoutComplete — composed exclusively from `ui/` primitives + Happy Hues tokens, each with a CSF3 story (autodocs, `<main>` decorator, app background, mock data), a jsdom test, and inclusion in the browser axe suite. Strict TDD RED-first per block. Two stacked PRs → `main` in order (ui-primitives precedent): **A** WorkoutCard + RepCounter (~450–500 lines), **B** PlayScreen + WorkoutComplete (~450–530). Blocks are pure "props in, callbacks out" — no `useTimer`, phase state, or page logic; TimerDisplay is never composed (WB-3d, spec Constraint). Pages stay untouched (WB-6).

**WB-1e resolved (DD-1)**: axe's `nested-interactive` rule (verified in `node_modules/axe-core/axe.js` L28022–28028 + L26291–26333) applies to any role with `childrenPresentational: true` (`button` qualifies) and fails when ANY widget-role focusable descendant exists. Event propagation (`stopPropagation`) is irrelevant to the rule. The page test contract (`WorkoutListPage.test.tsx` L108: `screen.getByText('Morning HIIT').closest('[role="button"]')`) requires `role="button"` to stay on the card surface. Therefore Play/menu buttons are rendered as **DOM siblings** of the Card inside a `relative` block wrapper — the Card's descendants stay non-interactive, so axe passes with zero `stopPropagation` anywhere.

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| DD-1 (WB-1e) | Interactive card w/ nested controls | Wrapper `<div className="relative">` holds Card `role="button" tabIndex={0}` (click/Enter → `onOpen`) + Play IconButton + ⋮ menu as absolutely-positioned siblings; menu open state is block-local `useState` ('use client') | role=button demanded by page test contract; axe nested-interactive forbids widget focusable descendants (verified axe-core); siblings sidestep both — no event hacks |
| DD-2 (WB-2) | RepCounter redesign CONFIRMED | Legacy white pill (`bg-timer-on text-accent`) → `<Button variant="primary" pill size="lg" className="px-12" aria-label="Complete set">Complete</Button>`; token-only colors (`text-fg-2`/`text-muted`, not timer aliases) | user-confirmed (proposal log); `text-fg-2` AA on app bg per Badge deviation precedent (tinted tones use `text-fg-2`); timer-on/timer-muted are DSF-3 aliases of fg/muted — same render, design-system v2 drops alias usage in new code |
| DD-3 (WB-3) | PlayScreen prop freeze | Props mirror TimerRing + TimerControls verbatim + `setIndex`/`setCount`/`totalProgress`/`progressPercent` + reps branch (`isRepsMode`/`exerciseName`/`reps`/`weight`/`onComplete`); layout mirrors play page L287–370 (2-col `lg:flex-row`, left panel title-only, right ring+controls or RepCounter, progress row); NO TimerDisplay, NO page logic | proposal open question resolved at design; block does zero math — page passes precomputed values; ExercisePanel composition deferred to page wiring (future) |
| DD-4 (WB-4) | WorkoutComplete actions | Play Again (primary) + Back Home (ghost) only; "New Workout" deferred | spec WB-4 lists only these two; current page auto-redirects to `/history` — no target for a third CTA in this change |
| DD-5 | RepCounter stays in place | Redesign `src/components/RepCounter.tsx` in place; legacy test `src/components/__tests__/RepCounter.test.tsx` untouched (5 assertions byte-identical); story edited in place, retitled `Blocks/RepCounter` | proposal Affected Areas lists RepCounter.tsx as Modify, not move; WB-2d "five tests pass unchanged" is the hard scenario — zero-touch test file is the strongest guarantee; blocks/ convention applies to the 3 NEW blocks |
| DD-6 (WB-5) | a11y compose | New `src/components/blocks/__tests__/blocks.a11y.test.ts` following `ui-primitives.a11y.test.ts` pattern (testStory + explicit axe, `--project`-style browser run); `vitest.browser.config.ts` sets `STORYBOOK_COMPONENT_PATHS` to both a11y files joined with `;` (verified addon-vitest `split(';')` — plugin index.js L2502–2504); unit config `exclude` += blocks file | axe needs real chromium (jsdom cannot compute contrast); per-slice extension mirrors ui-primitives DD-5 |
| DD-7 | Menu pattern | Dropdown = plain buttons in a panel (page precedent L123–160); trigger IconButton `aria-haspopup="menu" aria-expanded` | page precedent; ARIA menu roving-tabindex is out of scope; axe passes with buttons |

## Interfaces / Contracts

### WorkoutCard (WB-1)

```ts
// 'use client' — internal menu useState
interface WorkoutCardProps {
  workout: { id: string; title: string; intervals: { type: IntervalType; duration: number }[] }  // subset: full Workout satisfies it
  onOpen: () => void; onPlay: () => void; onEdit: () => void; onPreview: () => void; onDelete: () => void
}
```

Structure (DD-1): wrapper `relative` → Card `interactive role="button" tabIndex={0}` `className="p-16 flex flex-col gap-4"` with onClick/onKeyDown(Enter) → `onOpen`; sibling Play `IconButton variant="primary" size="sm" aria-label={\`Play ${title}\`} className="absolute bottom-4 right-4 shadow-fab"` → `onPlay`; sibling ⋮ wrapper `absolute top-4 right-4 z-40` with trigger IconButton (`aria-label="Workout options"`, `aria-haspopup="menu"`, `aria-expanded`) + conditional dropdown panel (`bg-surface border border-border-soft rounded-xl shadow-lg py-4 min-w-[180px]`) with 4 buttons: Play (`text-accent`), Edit/Preview (`text-fg-2`), Delete (`text-danger`), `w-full flex items-center gap-8 px-16 py-8 text-body-md text-left hover:bg-surface` → respective callbacks.

| Element | Classes |
|---|---|
| Title h3 | `font-headline-md text-headline-md font-bold text-fg-2` |
| Meta p | `font-data-sm text-data-sm text-muted flex items-center gap-2` + `formatDuration(total)` + `{n} interval{s}` (pluralize) |
| TimelinePreview (internal, folded) | `h-2 w-full bg-surface rounded-full overflow-hidden flex`; segments `h-full ${SEGMENT_BG_80[i.type]}` width `(i.duration/total)*100%`; `null` when total=0 (page L15–29 verbatim, imported `SEGMENT_BG_80` from `@/lib/segment-styles`) |

### RepCounter (WB-2) — redesigned in place

```ts
interface RepCounterProps { exerciseName: string; reps: number; weight?: number; onComplete: () => void }  // unchanged
```

| Element | Classes |
|---|---|
| Name | `font-headline-lg text-headline-lg text-fg-2 text-center` |
| Reps display | `font-display-timer-mobile text-display-timer-mobile md:font-display-timer md:text-display-timer text-fg-2 tabular-nums` — verified in `@theme` globals.css L76–84 (real tokens 64px/84px, w700); render confirmed |
| "reps" suffix | `font-body-md text-body-md text-muted ml-2` |
| Weight (conditional) | `font-body-lg text-body-lg text-muted` (`{weight} kg`, only when `weight !== undefined`) |
| Complete | `<Button variant="primary" pill size="lg" className="px-12" aria-label="Complete set">Complete</Button>` — Button token contract keeps label-caps type; big affordance = lg height + pill + px-12 (no text-* override fights the base map) |

`'use client'` removed (no hooks). Legacy test untouched → WB-2a–2d green (tests assert `getByText('10')`, `/80/`, `queryByText(/kg/)`, button role/name, click → assertions unaffected by token swap).

### PlayScreen (WB-3)

```ts
interface PlayScreenProps {           // mirror of composed timer components (DD-3)
  // TimerRing
  timeLeft: number; duration: number; intervalType: IntervalType; label: string; nextLabel?: string
  // TimerControls
  status: TimerStatus; onPause: () => void; onResume: () => void; onSkip: () => void; onRestart: () => void
  onPrevious?: () => void; onAddTime?: (seconds: number) => void; showAddTime?: boolean
  // progress row + reps branch
  setIndex: number; setCount: number; totalProgress: number; progressPercent: number
  isRepsMode: boolean; exerciseName?: string; reps?: number; weight?: number; onComplete?: () => void
}
```

Layout (page L287–370): `<div className="flex flex-col lg:flex-row gap-24 w-full max-w-6xl mx-auto items-start">` → left `w-full lg:w-1/2 flex justify-center lg:sticky lg:top-24` with title-only panel `<h2 className="font-headline-lg text-headline-lg text-fg-2 text-center">{label}</h2>` (ExercisePanel deferred); right `w-full lg:w-1/2 flex flex-col items-center gap-12`: `isRepsMode ? <RepCounter exerciseName reps weight onComplete/> : <><TimerRing timeLeft duration intervalType label nextLabel/><TimerControls status onPause onResume onSkip onRestart onPrevious onAddTime showAddTime/></>`; progress row `w-full max-w-2xl`: `Total Progress` label + `{progressPercent}%` (`font-data-sm text-data-sm text-muted`/`text-fg-2`), `<ProgressBar progress={totalProgress} label="Workout progress" dark/>`, `Set {setIndex + 1} of {setCount}` (`font-label-caps text-label-caps text-muted mt-8`). `TimerStatus` from `@/hooks/useTimer` (verified import in TimerControls L3). No `'use client'`, no hooks, no TimerDisplay.

### WorkoutComplete (WB-4)

```ts
interface WorkoutCompleteProps { title?: string /* default "Workout Complete!" */; intervals: number
  totalTimeMinutes: number; onPlayAgain: () => void; onBackHome: () => void }
```

`<div className="flex flex-col items-center gap-4 mt-12 text-center">`; h1 `font-headline-lg text-headline-lg text-fg-2`; summary `font-body-md text-body-md text-muted` ×2 (`{intervals} interval{s} completed`, `Total time: {totalTimeMinutes} min`); actions row `flex gap-4 mt-8`: `<Button variant="primary" onClick={onPlayAgain}>Play Again</Button>` + `<Button variant="ghost" onClick={onBackHome}>Back Home</Button>`.

### Mock data (WB-5)

`src/components/blocks/mock-data.ts`: `MOCK_TIMED_INTERVALS: Interval[]` (prepare 180 / work 30 / rest 30 / cooldown 120), `MOCK_REPS_INTERVALS: Interval[]` (work interval gains `reps: 10, weight: 60, exerciseId: 'ex1'`), `MOCK_WORKOUTS: Workout[]` (`w1 Morning HIIT` timed, `w2 Strength Circuit` mode `'reps'`; full `types/workout` shapes). No colors → audit rule 3 safe.

### Stories contract (WB-5, DD-6)

All stories: CSF3, `tags: ['autodocs']`, `parameters: { layout: 'centered', backgrounds: { default: 'app' }, a11y: { test: 'error' } }`, decorator `(Story) => <main><Story /></main>`, args with `fn()` callbacks, play fns on interactive stories. Titles: `Blocks/WorkoutCard`, `Blocks/RepCounter` (in-place retitle), `Blocks/PlayScreen`, `Blocks/WorkoutComplete` → storyIds `blocks-workoutcard--*` etc.

| Story | Variants | play |
|---|---|---|
| WorkoutCard | Default, EmptyIntervals (0 intervals → "0 intervals", strip intact), RepsWorkout | card click → onOpen once; Enter → onOpen; Play click → onPlay, onOpen not fired |
| RepCounter | Default, NoWeight | Complete click → onComplete once |
| PlayScreen | Running, Paused, RepsMode, AddTime | Running: Pause → onPause; RepsMode: Complete → onComplete |
| WorkoutComplete | Default, CustomTitle | Play Again → onPlayAgain; Back Home → onBackHome |

`blocks.a11y.test.ts`: same helper pattern as `ui-primitives.a11y.test.ts` (testStory + explicit axe run, exclude `.sb-wrapper/#storybook-docs/#storybook-highlights-root`), one `storyCase` factory per block file. PR A covers WorkoutCard + RepCounter; PR B extends with PlayScreen + WorkoutComplete (ui-primitives per-slice pattern).

## Data Flow

```
Story mock ──props──▶ Block (presentational) ──callbacks──▶ fn() spies (story play / jsdom test)
Page state (future wiring) ──props──▶ Block ──callbacks──▶ router.push / context mutations
Menu open/close: block-local useState — page never sees it (DD-1)
```

## File Changes

| PR | File | Action | Description |
|---|---|---|---|
| A | `src/components/blocks/WorkoutCard.tsx` | Create | DD-1 structure; internal TimelinePreview; menu useState |
| A | `src/components/blocks/WorkoutCard.stories.tsx` | Create | 3 stories + play (WB-1 scenarios) |
| A | `src/components/blocks/__tests__/WorkoutCard.test.tsx` | Create | jsdom: title/meta/count, timeline null at 0, role=button click/Enter → onOpen, Play/menu actions fire, onOpen not fired on Play |
| A | `src/components/blocks/mock-data.ts` | Create | shared mock Workout/Interval constants |
| A | `src/components/blocks/__tests__/blocks.a11y.test.ts` | Create | browser compose: WorkoutCard + RepCounter stories, axe empty (DD-6) |
| A | `src/components/RepCounter.tsx` | Modify | DD-2 redesign (token-only, Button primary pill); drop 'use client' |
| A | `src/components/RepCounter.stories.tsx` | Modify | retitle `Blocks/RepCounter`; autodocs, `<main>`, app bg, play fn |
| A | `vitest.config.ts` | Modify | `exclude` += `src/components/blocks/__tests__/blocks.a11y.test.ts` |
| A | `vitest.browser.config.ts` | Modify | `STORYBOOK_COMPONENT_PATHS` = both a11y files joined with `;` (verified split(';')) |
| B | `src/components/blocks/PlayScreen.tsx` | Create | DD-3 freeze; composes TimerRing/TimerControls/ProgressBar/RepCounter |
| B | `src/components/blocks/PlayScreen.stories.tsx` | Create | Running/Paused/RepsMode/AddTime + play (WB-3 scenarios) |
| B | `src/components/blocks/__tests__/PlayScreen.test.tsx` | Create | 4 surfaces render; paused → Resume; reps branch → RepCounter, no Pause; no TimerDisplay string |
| B | `src/components/blocks/WorkoutComplete.tsx` | Create | DD-4 actions |
| B | `src/components/blocks/WorkoutComplete.stories.tsx` | Create | Default/CustomTitle + play (WB-4 scenarios) |
| B | `src/components/blocks/__tests__/WorkoutComplete.test.tsx` | Create | title + summary values; both actions fire |
| B | `src/components/blocks/__tests__/blocks.a11y.test.ts` | Modify | extend with PlayScreen + WorkoutComplete stories |

Untouched: `src/components/__tests__/RepCounter.test.tsx` (DD-5), all pages, `ui/` primitives.

## Per-PR Gates

Standard gate (both PRs, same as ui-primitives): `npx tsc --noEmit` + focused slice tests + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`.

| PR | Focused slice tests |
|---|---|
| A | `npx vitest run src/components/blocks/__tests__/WorkoutCard.test.tsx src/components/__tests__/RepCounter.test.tsx` |
| B | `npx vitest run src/components/blocks/__tests__/PlayScreen.test.tsx src/components/blocks/__tests__/WorkoutComplete.test.tsx` |

Test harness: `npm run storybook` :6006 → Blocks section; rollback: revert merge (additive; RepCounter revert restores file).

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit (jsdom) | Per-block rendering + interaction (contracts above); RepCounter 5 pinned tests green unchanged | `src/components/blocks/__tests__/*.test.tsx` + untouched `RepCounter.test.tsx` (Testing Library + jest-dom, repo pattern) |
| Browser (`test:a11y`) | Play fns run in chromium + axe empty per block story (WB-5); nested-interactive proof for WorkoutCard | `blocks.a11y.test.ts` (DD-6) via `npm run test:a11y` |
| Contract | Zero hex/rgba in blocks, stories, tests (rule 3 scans all src); no Material utilities (rule 1 scans stories — production files); no second accent (rule 4) | `npm run audit:tokens` |
| Build | Stories compile, autodocs render | `npx tsc --noEmit` + `npm run build-storybook` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary (the browser-config env var change is a declarative value update).

## Migration / Rollout

No data migration. Stacked chained PRs: A → B → `main` (proposal decision). Purely additive; no page consumes blocks yet (wiring is a future change). Full revert = delete `src/components/blocks/` + revert the two config files; RepCounter revert restores `src/components/RepCounter.tsx`.

## Risks

| PR | Risk | Likelihood | Mitigation |
|---|---|---|---|
| A | DD-1 wrapper structure diverges from page markup — future wiring must preserve sibling layout | Med | Block test enforces `closest('[role="button"]')` locator (page contract); design notes wiring constraint |
| A | RepCounter label-caps type vs legacy text-xl visual — accepted per CONFIRMED decision | Low | Documented DD-2; no test asserts typography |
| A | blocks.a11y passes axe where the composed RepCounter story is a FIRST-time a11y surface (timer tokens) | Low | Tokens are DSF-3 aliases of fg/muted — AA on app bg; if flagged, fix token-level or in-block, escalate before touching timer components |
| B | Timer-era components (TimerRing/TimerControls/ProgressBar) enter the a11y suite for the first time — pre-existing contrast/landmark findings may surface | Med | Escalate per finding; block-side composition fixes only; timer component edits out of scope |
| B | PlayScreen prop drift vs real play page at wiring time | Med | Props frozen at design (DD-3); wiring change re-validates; strictly presentational |
| B | PlayScreen story renders full composition (large) vs 400-line slice budget | Med | Split story file per component at apply if needed (ui-primitives contingency precedent) |

## Open Questions

- [ ] RepCounter story in-place retitle keeps `Blocks/RepCounter` grouping while the file lives at `src/components/` — Storybook groups by title only; confirmed compatible, confirm visually at apply.
- [ ] `aria-expanded` on the ⋮ trigger requires menu state; block-local `useState` confirmed (DD-1) — no page involvement.
