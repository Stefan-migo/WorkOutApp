# Archive Report: workout-blocks — PR 4 design-system (WB-1..WB-6)

- **Change**: `workout-blocks`
- **Archived**: 2026-08-09
- **Mode**: hybrid (openspec + engram)
- **Status**: **ARCHIVED — DELIVERED** (6/6 requirements, 16/16 scenarios, 0 CRITICAL)

## Executive Summary

The `workout-blocks` change delivered the design-system v2 Storybook-first
contract: **4 multi-component blocks in `src/components/blocks/`** —
WorkoutCard (interactive card + sibling Play + ⋮ overflow menu), RepCounter
(redesigned in place from the dead timer-era white pill to `Button` primary),
PlayScreen (presentational composition of TimerRing + TimerControls +
ProgressBar + "Set X of Y" row, reps-mode swaps RepCounter), and
WorkoutComplete (title + summary + Play Again / Back Home) — each with CSF3
stories (autodocs, `<main>` decorator, app background, mock data), jsdom
tests, and browser axe a11y coverage. Delivered across **2 stacked slices
merged to `main` in order**: PR #14 (slice A — WorkoutCard + RepCounter
redesign) merged at `921e1e9`, PR #15 (slice B — PlayScreen + WorkoutComplete)
merged at `975463f`. Verify verdict on `main` at `975463f`: **APPROVE WITH
WARNINGS — 0 CRITICAL**, 16/16 scenarios compliant, 6/6 requirements, all
gates green. Validator: `gentle-ai sdd-verify-validate` → `valid: true`,
`pass_with_warnings`. No page wiring in this change (Storybook-first only).

## Final State (at close, 2026-08-09)

Authoritative: this launch prompt's final-state facts + repository evidence on
`main`, which post-date `verify-report.md` (written at `975463f`, added to the
change dir by bookkeeping commit `8e65cea`) and `apply-progress.md`.

- **Merge commits (in order)**: PR #14 → `921e1e9` (slice A —
  WorkoutCard + RepCounter redesign), PR #15 → `975463f` (slice B —
  PlayScreen + WorkoutComplete). HEAD of main at archive: **`8e65cea`**
  (verify-report.md bookkeeping commit).
- **Verification verdict** (run on `main` at `975463f`): **APPROVE WITH
  WARNINGS** — 0 CRITICAL, 16/16 scenarios, 6/6 requirements.
- **Validator**: `gentle-ai sdd-verify-validate` → `valid: true`,
  `pass_with_warnings`.
- **Gates (all green at `975463f`)**: `npx tsc --noEmit` exit 0; `npx vitest
  run` 689/689 (66 files); `npm run test:a11y` 104/104 (16 files, chromium +
  axe); `npm run audit:tokens` 4/4; `npm run build-storybook` exit 0
  ("Storybook build completed successfully").
- **Tasks**: 19/19 `[x]` in `tasks.md` (A.1–A.11, B.1–B.8). No unchecked
  implementation tasks.
- **Working tree**: clean at close except `.atl/` registry cache touched
  outside this change (unrelated, same pattern as prior archives).
- **DD-1 sibling structure**: WorkoutCard, Play, and ⋮ menu are DOM siblings
  inside the `relative` wrapper (Play is NOT a Card descendant; zero
  `stopPropagation`). Proven by test (`WorkoutCard.test.tsx` L88–94: Play
  click does NOT fire `onOpen`) and story play — resolves the axe
  nested-interactive risk.
- **DD-5 legacy RepCounter pinned suite**: `src/components/__tests__/RepCounter.test.tsx`
  **UNTOUCHED** (byte-identical, last commit `1f2ab6e` pre-change) and green
  (5/5) — RED baseline at A.2, re-verified at A.5 and in full-suite verify.

### WARNINGS — escalated, block-side, spec-safe (NOT open defects)

Both verify WARNINGs share one root cause: pre-existing timer-internal
`text-timer-muted` (3.82:1) fails WCAG AA on the app background (`--color-bg`).
The fix is block-side composition only; **timer component internals were NOT
modified** (empty git diff vs pre-change for TimerRing/TimerControls/
ProgressBar). Neither warning breaks a spec — the spec is silent on the
`ProgressBar` `label` prop and story `nextLabel` args; the block contract is
fully honored (DD-3 prop freeze forwards `nextLabel` when provided, verified
by jsdom `PlayScreen.test.tsx` L49). Escalated per design risk line 166;
future token-level fix noted in follow-ups.

1. **`ProgressBar` `label` prop omitted** — `PlayScreen.tsx` L112
   (`<ProgressBar progress={totalProgress} dark />` vs design L72
   `label="Workout progress"`). Bar keeps `role="progressbar"` with fallback
   label; the block's own "Total Progress" + `%` row is retained.
2. **`nextLabel` not passed in PlayScreen stories** — `PlayScreen.stories.tsx`
   (no `nextLabel` in args). Block fully supports it (DD-3); jsdom test
   verifies forwarding; TimerRing renders it with the failing internal token,
   so it is intentionally omitted from stories to keep the axe suite green.

### SUGGESTION — block-side contrast swap (recorded, non-blocking)

`text-muted` → `text-fg-2/70` at `RepCounter.tsx` L23/L28,
`PlayScreen.tsx` L109/L113, `WorkoutComplete.tsx` L23/L26.
`text-muted #ada19c` vs app bg `#55423d` = 3.74–3.82:1 < 4.5:1;
`text-fg-2/70` = 5.21:1, token-based. **Already applied during delivery** as
an in-block a11y fix (slice A precedent, design risk line 165 contingency;
`apply-progress.md` deviations 1, 4, 6). The suggestion is retained as the
token-level note for the timer components' future fix.

## Spec Sync (source of truth)

The `workout-blocks` spec lives at **`openspec/specs/workout-blocks/spec.md`**
(WB-1..WB-6, 16 scenarios: WB-1 4, WB-2 3, WB-3 4, WB-4 2, WB-5 2, WB-6 1)
and **stands as the delivered contract**. This change WROTE the base spec
directly (per design-system / ui-primitives / page-migration-demo precedent:
REUSE/author-verbatim, no delta spec dir). There is **no delta spec dir** under
`openspec/changes/workout-blocks/` and none is invented here. Verified accurate
against the implemented state at close (verified, not rewritten):

| Domain spec | Status | Contents |
|---|---|---|
| `openspec/specs/workout-blocks/spec.md` | ✅ Synced, verified accurate | WB-1..WB-6, 16 scenarios — matches implemented state |

## Change Folder Convention

Per the repo archive convention (design-system + ui-primitives +
page-migration-demo precedent, `openspec/changes/{change}/archive-report.md`),
**the change folder is kept in place** at `openspec/changes/workout-blocks/`
with all artifacts intact (proposal, design, tasks, apply-progress,
verify-report, this report). It is **NOT moved** to `openspec/changes/archive/`.
No artifacts were deleted or altered. No mechanical copy/move was performed in
this archive (nothing to move), so no `diff -r` readback applies.

## Open Follow-Ups (for future changes)

None block this archive (0 CRITICAL). Recorded for the next design-system /
page-wiring change:

1. **Timer-component token-level contrast fix (WARNING root cause)** — the
   pre-existing `text-timer-muted` (3.82:1) inside TimerRing (label /
   `nextLabel`) and ProgressBar (`label`) fails AA on app bg. Block-side
   composition avoids it; a future token-level fix (e.g. timer internals to
   `text-fg-2/70` or a token bump) would let PlayScreen pass `label` and
   stories pass `nextLabel`. Out of scope for this change (timer internals
   NOT modified, git-proven).
2. **Page wiring (WB-6 / spec Non-Goals)** — blocks are Storybook-first;
   wiring to pages (`workouts/[id]/play`, workouts list) is a FUTURE change
   using these blocks as the composition template.
3. **SUGGESTION 2 (bookkeeping)** — TDD Cycle Evidence table in
   `apply-progress.md` lists only slice B rows; slice A RED/GREEN evidence
   lives in the Slice A task table. Evidence is complete overall;
   consolidate into one table for future changes.

## Next Steps

**Page wiring (future change)**: wire WorkoutCard into the workouts list and
PlayScreen + WorkoutComplete into `workouts/[id]/play`, replacing the
timer-era page composition — reusing the DD-1 sibling structure and the DD-3
prop freeze as the contract. Blocks remain presentational; page logic stays
in pages.

## Traceability

| Artifact | Location |
|---|---|
| proposal | `openspec/changes/workout-blocks/proposal.md` |
| design | `openspec/changes/workout-blocks/design.md` |
| tasks | `openspec/changes/workout-blocks/tasks.md` (19/19 `[x]`) |
| apply-progress | `openspec/changes/workout-blocks/apply-progress.md` (2/2 slice TDD tables) |
| verify-report | `openspec/changes/workout-blocks/verify-report.md` (APPROVE WITH WARNINGS, 0 CRITICAL, at `975463f`) |
| archive-report | `openspec/changes/workout-blocks/archive-report.md` (this file) |
| workout-blocks spec (source of truth) | `openspec/specs/workout-blocks/spec.md` |
| PR merges | #14 `921e1e9` (A) → #15 `975463f` (B) |
| verify bookkeeping commit | `8e65cea` (verify-report.md added; HEAD at archive) |
| validator | `gentle-ai sdd-verify-validate` → `valid:true`, `pass_with_warnings` |
| legacy RepCounter pinned suite | `src/components/__tests__/RepCounter.test.tsx` (untouched, green) |
| Engram archive record | `sdd/workout-blocks/archive-report` (hybrid persistence — see note) |

**Engram note**: this archive run's `mem_save` result is recorded in the
return envelope; if the engram server was unreachable, the orchestrator
should retry `mem_save` for `sdd/workout-blocks/archive-report` (`topic_key`,
`capture_prompt: false`) when reachable. On-disk artifacts are complete and
authoritative regardless.

The SDD cycle for the `workout-blocks` change is complete: planned →
implemented (PRs #14–#15) → verified (APPROVE WITH WARNINGS, 0 CRITICAL) →
archived.
