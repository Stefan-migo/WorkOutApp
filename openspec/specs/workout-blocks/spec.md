# Workout Blocks Specification

## Purpose

Previews the workout frontend as four multi-component blocks in Storybook BEFORE page wiring — WorkoutCard, RepCounter, PlayScreen, WorkoutComplete — for visual approval at feature scale. Also fixes RepCounter's dead timer-era styling (white pill → Button primary) and proves the design system composes at block scale.

## Constraints

- Blocks MUST be presentational: props in, callbacks out. No `useTimer`, phase, or page logic inside a block.
- Block code MUST use `ui/` primitives and tokens exclusively; no inline styles or hardcoded colors.
- Each block MUST have a CSF3 story with autodocs, a `<main>` landmark decorator, the app background, and mock data.
- Each block MUST have jsdom tests.
- A11y MUST be covered: block stories included in the axe browser suite (addon-vitest, `--project storybook`).
- Touched strings MUST be English.
- TimerDisplay MUST NOT be composed (orphaned).
- Page wiring MUST NOT happen in this change.

## Non-Goals

- Wiring blocks into pages (future change).
- Promoting DropdownMenu, RingGauge, ProgressBar, PageHeader to `ui/` primitives.
- Blocks beyond the first set (exercises, sequences, history).

## Requirements

### Requirement: WB-1 — WorkoutCard block

WorkoutCard MUST render an interactive card with a title (h3), a duration meta line, an "N intervals" line, a folded-in TimelinePreview strip, a Play IconButton labelled `Play {title}`, and a ⋮ overflow menu exposing Play, Edit, Preview, and Delete actions. It MUST follow the interactive-card contract: `role="button"`, click, and Enter all invoke `onOpen`.

| ID | Description | Keyword |
|----|-------------|---------|
| WB-1a | Title, duration meta, interval count render | MUST |
| WB-1b | TimelinePreview folded in | MUST |
| WB-1c | Play labelled `Play {title}` | MUST |
| WB-1d | Overflow menu exposes 4 actions | MUST |
| WB-1e | `role="button"`; click/Enter → `onOpen` | MUST |

#### Scenario: Open by click
- GIVEN a WorkoutCard with `onOpen`
- WHEN the user clicks the card surface
- THEN `onOpen` fires once

#### Scenario: Open by keyboard
- GIVEN a focused WorkoutCard
- WHEN the user presses Enter
- THEN `onOpen` fires

#### Scenario: Overflow actions
- GIVEN the ⋮ menu opened
- WHEN the user selects Edit
- THEN the Edit callback fires; Play still reads `Play {title}`

#### Scenario: Empty intervals
- GIVEN a workout with zero intervals
- THEN "0 intervals" renders and the TimelinePreview strip stays intact

### Requirement: WB-2 — RepCounter block

RepCounter MUST render the exercise name with the `headline-lg` token, a large reps display with a "reps" suffix, an optional weight line, and a Complete button using the `Button` primary variant with `aria-label="Complete set"` invoking `onComplete`. The redesign MUST keep behavior identical to the legacy component: the five pinned tests MUST keep passing.

| ID | Description | Keyword |
|----|-------------|---------|
| WB-2a | Name uses `headline-lg` token | MUST |
| WB-2b | Complete uses Button primary, `aria-label="Complete set"` | MUST |
| WB-2c | Weight line optional | MUST |
| WB-2d | Five pinned tests keep passing | MUST |

#### Scenario: Complete fires
- GIVEN a RepCounter with `onComplete`
- WHEN the user clicks the Complete button
- THEN `onComplete` fires once

#### Scenario: With and without weight
- GIVEN `weight` provided
- THEN the weight line renders
- AND with `weight` omitted it does not render

#### Scenario: Pinned suite green
- GIVEN the redesigned RepCounter
- WHEN the legacy RepCounter tests run
- THEN all five pass unchanged

### Requirement: WB-3 — PlayScreen block

PlayScreen MUST presentationally compose TimerRing, TimerControls, ProgressBar, and a "Set X of Y" / Total Progress row, with props mirroring the timer components. A reps-mode variant MUST swap the rep display for RepCounter. It MUST NOT include page logic or compose TimerDisplay.

| ID | Description | Keyword |
|----|-------------|---------|
| WB-3a | Composes the four timer surfaces | MUST |
| WB-3b | Props mirror timer component props | MUST |
| WB-3c | Reps-mode variant swaps RepCounter | MUST |
| WB-3d | No page logic; TimerDisplay absent | MUST |

#### Scenario: Running state
- GIVEN running props
- THEN ring, controls, progress bar, and set row render with running values

#### Scenario: Paused state
- GIVEN paused props
- THEN the paused state renders and controls expose resume

#### Scenario: Reps mode
- GIVEN reps-mode props
- THEN RepCounter replaces the timed display

#### Scenario: No TimerDisplay
- GIVEN any PlayScreen story
- THEN TimerDisplay never appears

### Requirement: WB-4 — WorkoutComplete block

WorkoutComplete MUST render a title, a summary (N intervals, total time), and Play Again / Back Home actions invoking `onPlayAgain` / `onBackHome`. It MUST render in Storybook with mock callbacks.

#### Scenario: Summary renders
- GIVEN interval count and total time props
- THEN the title and summary line render both values

#### Scenario: Actions fire
- GIVEN mock `onPlayAgain` / `onBackHome`
- WHEN the user clicks each action
- THEN the matching callback fires

### Requirement: WB-5 — Stories contract

Each block MUST ship a CSF3 story with autodocs, a `<main>` landmark decorator, the app background, and mock data; interactive blocks MUST include play functions exercising the interaction. All block stories MUST be included in the browser a11y suite and pass axe with zero violations.

#### Scenario: Autodocs render
- GIVEN Storybook
- WHEN opening the Blocks section
- THEN each story renders with docs and mock data in `<main>`

#### Scenario: A11y suite green
- GIVEN the browser suite
- WHEN axe runs over block stories
- THEN no violations are reported

### Requirement: WB-6 — No page behavior regression

Blocks MUST be additive: pages and their tests MUST keep passing unchanged.

#### Scenario: Regression check
- GIVEN pages untouched by this change
- WHEN the full test suite runs
- THEN no failures occur
