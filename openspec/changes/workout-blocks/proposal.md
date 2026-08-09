# Proposal: Workout Blocks — Design System v2 (Storybook-first)

## Intent

PRs 1–3 delivered tokens, 8 `ui/` primitives, and a migration demo, but no feature-scale composition exists. This change previews the workout frontend as 4 multi-component blocks in Storybook FIRST (visual approval before page wiring), fixes RepCounter's dead timer-era styling, and proves the design system at block scale.

## Scope

### In Scope
- 4 blocks in `src/components/blocks/`, each with CSF3 story (autodocs, `<main>` decorator) + mock data + jsdom test + a11y inclusion:
  - **WorkoutCard** — interactive Card, h3 title, meta line, folded-in TimelinePreview, ⋮ menu, Play IconButton
  - **RepCounter** — redesign: Button primary + token-only; `aria-label="Complete set"` and 5 tests preserved
  - **PlayScreen** — presentational TimerRing + TimerControls + ProgressBar + "Set X of Y" row; reps mode swaps RepCounter; props in, callbacks out
  - **WorkoutComplete** — title + summary + new onPlayAgain/onBackHome with mock callbacks
- 2 stacked PRs → `main` in order: A WorkoutCard+RepCounter (~450–500); B PlayScreen+WorkoutComplete (~450–530)

### Out of Scope
- Page wiring/migration (future change)
- DropdownMenu, RingGauge, ProgressBar, PageHeader primitives (deferred)
- TimerDisplay (orphaned); timer-era PlayHeader, ExercisePanel, RepCompleteDialog
- exercises / sequences / history blocks

## Capabilities

### New Capabilities
- `workout-blocks`: 4 presentational blocks + story/test/a11y contract (new spec)

### Modified Capabilities
- None

## Approach

Presentational blocks composed from `ui/` primitives + tokens; mock data in stories. Strict TDD RED-first per block. 2 stacked PRs to `main` in order (PR 1–3 precedent), each ≤400 changed lines (500 accepted with documented exception, else split at apply). Per-PR gate: `tsc --noEmit` + slice tests + `test:a11y` + `audit:tokens` + `build-storybook`.

## Decision Log

| Date | Actor | Decision |
|---|---|---|
| 2026-08-09 | user | Scope: Storybook-first blocks only, no page wiring (option A) |
| 2026-08-09 | user | First set: WorkoutCard, RepCounter, PlayScreen, WorkoutComplete |
| 2026-08-09 | user (confirmed) | RepCounter white pill (`bg-timer-on text-accent`) → Button primary + token-only |

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/components/blocks/` | New | 4 blocks + stories + `__tests__/` |
| `src/components/RepCounter.tsx` | Modified | redesign (PR A) |
| `.storybook/` | Verify only | a11y compose inclusion |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| PlayScreen prop drift vs real play page | Med | props frozen at design; strictly presentational |
| 450–530-line slices vs 400 budget | Med | stacked PRs; split at apply if needed |

## Rollback Plan

Additive: delete `src/components/blocks/`; RepCounter revert restores `src/components/RepCounter.tsx`. No page behavior touched; per-PR merge reversal.

## Dependencies

- `ui/` primitives (PR 2), Storybook + addon-a11y (PR 1); no new deps

## Success Criteria

- [ ] 4 blocks visible in Storybook with mock data
- [ ] RepCounter's 5 tests green after redesign
- [ ] a11y covers blocks; all per-PR gates green
- [ ] No page behavior changed

## Open Questions

- Exact PlayScreen prop surface — confirm at design
- WorkoutComplete: add "New Workout", or Play Again / Back Home only
