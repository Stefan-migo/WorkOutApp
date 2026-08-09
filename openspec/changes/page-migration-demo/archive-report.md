# Archive Report: page-migration-demo — PR 3 design-system (PMD-1..PMD-4)

- **Change**: `page-migration-demo`
- **Archived**: 2026-08-09
- **Mode**: hybrid (openspec + engram)
- **Status**: **ARCHIVED — DELIVERED** (4/4 requirements, 7/7 scenarios, 0 CRITICAL)

## Executive Summary

The `page-migration-demo` change delivered the PR 3 of design-system: `/workouts`
and `/exercises` migrated to the 8 `ui/` primitives delivered in PR 2
(Button, IconButton, Card, Badge, Input, SearchInput, EmptyState, Dialog/Sheet),
with token-only overrides and behavior preserved (PMD-1..PMD-4). Delivered across
**3 stacked slices merged to `main` in order**: PR #11 (3a — `/workouts`
Card/EmptyState/Button/IconButton), PR #12 (3b — `/exercises` list surface:
SearchInput/Card/Badge/Button/IconButton + `textbox`→`searchbox` selector fix,
FilterSelect preserved byte-for-byte), PR #13 (3c — overlays → Dialog/Sheet,
`dialogRef` → `open`/`onOpenChange` controlled-state refactor incl. `[id]` ripple).
Verify verdict on `main` at `f762fe1`: **APPROVE WITH WARNINGS — 0 CRITICAL**,
7/7 scenarios satisfied, 4/4 requirements, all gates green. Change set vs pre-3a
parent `47b2733`: 11 source/test files + openspec bookkeeping, 595 insertions,
190 deletions (3a 53, 3b 121, 3c 210 — under design budgets 180/300/250).

## Final State (at close, 2026-08-09)

Authoritative: this launch prompt's final-state facts + repository evidence on
`main`, which post-date `verify-report.md` (written at `f762fe1`) and
`apply-progress.md`.

- **Merge commits (in order)**: PR #11 → `435054b` (3a), PR #12 → `758b2ec`
  (3b), PR #13 → `f762fe1` (3c). HEAD of main at archive: **`16c9fe0`**
  (verify-report.md bookkeeping commit). Chain complete.
- **Verification verdict** (run on `main` at `f762fe1`, read-only): **APPROVE
  WITH WARNINGS** — 0 CRITICAL, 7/7 scenarios satisfied, 4/4 requirements.
  PMD-2 `Delete confirmation` = **N/A — satisfied-by-declaration** per user
  decision 2026-08-09 (`spec-confirmation.md`; delete dialog lives in
  out-of-scope `exercises/[id]/page.tsx`, `/exercises` list has no delete
  dialog). Not failed; no surface to test.
- **Validator**: `gentle-ai sdd-verify-validate` → `valid: true`,
  `pass_with_warnings`.
- **Gates (all green at `f762fe1`)**: `npx tsc --noEmit` exit 0; `npx vitest
  run` 663/663 (63 files); `npm run test:a11y` 85/85 (12 files, chromium +
  axe, incl. UI/Dialog play); `npm run audit:tokens` 4/4 (no hex/rgba
  offenders); `npm run build-storybook` exit 0 ("Storybook build completed
  successfully"; pre-existing chunk-size warning only).
- **Tasks**: 28/28 `[x]` in `tasks.md` (3a.1–3a.8, 3b.1–3b.12, 3c.1–3c.8).
  No unchecked implementation tasks. TDD evidence tables 3/3 slices in
  `apply-progress.md`.
- **Working tree**: clean at close except `.atl/` registry cache touched
  outside this change (unrelated, same pattern as prior archives).

### WARNING — Tailwind v4.3.2 cascade drift (non-blocking, cosmetic; user-accepted)

`verify-report.md` (at `f762fe1`) flags one WARNING: Tailwind v4.3.2 emits size
utilities ascending, so **className-last does NOT win** for smaller size/padding
overrides at equal specificity. Four override sites silently do not apply:

- 3a FAB `px-0` → Button `px-4` wins (`workouts/page.tsx:201`)
- 3b star `w-8 h-8` → IconButton `sm` `h-9 w-9` wins (`exercises/page.tsx:263`)
- 3b assign `w-10 h-10` → IconButton `md` `h-11 w-11` wins
  (`exercises/page.tsx:272`)
- 3c modal `p-6` → Dialog FIXED `p-24` wins (`AddToWorkoutModal.tsx:70`)

**Status at close: open, accepted, non-blocking.** Cosmetic only — no test
asserts sizes (verified: no size/class assertions on these elements in changed
test files), behavior unaffected, design-intent sizes decorative. Documented in
`apply-progress.md` 3b/3c Issues/Risks and accepted in the proposal decision log
(user-accepted drifts 2026-08-09). **Mitigation deferred** to a future change
(either `!`-important overrides or an IconButton/Dialog size API). Does not
block archive: classified WARNING (design deviation per decision gates), not
CRITICAL.

### Verify SUGGESTIONS (recorded, non-blocking)

1. **Cascade-drift mitigation backlog** — adopt `!`-important overrides or add a
   size API to IconButton/Dialog in a future change. Carried forward from the
   WARNING above; not an open defect.
2. **Dialog contained test is class-based** (`Dialog.test.tsx:119`
   `toHaveClass('max-h-[85vh]', 'overflow-y-auto')`) — implementation-detail
   coupling per strict-tdd 5f, but design-specified as the DD-C contract and the
   only jsdom-feasible check for a class-join behavior; the browser a11y suite
   covers real dialog interaction. Accepted; note only.
3. **`[id]` page test count** — `apply-progress.md` 3c claims 20/20; source grep
   counts 18 `it(`/`test(` blocks (likely `it.each`/inline expansion).
   **Non-issue**: full suite 663/663 is authoritative and green; noted for
   apply/verify bookkeeping consistency.

### FilterSelect — NOT duplicated by PR 3

PMD-2 "MUST NOT be duplicated further" verified at `f762fe1`: the FilterSelect
definition extracted pre-3b (`435054b` L30–58) vs at verify (L33–61) is
**byte-for-byte IDENTICAL**; the usage block is absent from the 3b diff; only
**2 pre-existing definitions** exist in the repo (ExerciseSearchHeader L33 +
ExercisePicker L24, the latter a 0-line diff — both pre-date PR 3).
Consolidation into a primitive remains future work; PR 3 introduced no
duplication.

## Spec Sync (source of truth)

The `page-migration-demo` spec lives at **`openspec/specs/page-migration-demo/spec.md`**
(PMD-1..PMD-4, 7 scenarios) and **stands as the delivered spec**. Per the PR 1
design-system + PR 2 ui-primitives precedent and `spec-confirmation.md` (which
documented the **REUSE verbatim** decision — "no rewrite, no delta spec"), there
is **no delta spec dir** under `openspec/changes/page-migration-demo/` and none
is invented here. Verified accurate against the implemented state at close
(verified, not rewritten):

| Domain spec | Status | Contents |
|---|---|---|
| `openspec/specs/page-migration-demo/spec.md` | ✅ Synced, verified accurate | PMD-1..PMD-4, 7 scenarios — matches implemented state (PMD-2 delete-confirmation scenario retained; N/A by declaration per `spec-confirmation.md`) |

## Change Folder Convention

Per the repo archive convention (design-system + ui-primitives precedent,
`openspec/changes/{change}/archive-report.md`), **the change folder is kept in
place** at `openspec/changes/page-migration-demo/` with all artifacts intact
(proposal, spec-confirmation, design, tasks, apply-progress, verify-report, this
report). It is **NOT moved** to `openspec/changes/archive/`. No artifacts were
deleted or altered.

## Open Follow-Ups (for future changes)

None block this archive (0 CRITICAL). Recorded for the next design-system /
pages-migration change:

1. **Cascade-drift mitigation (WARNING)** — `!`-important overrides or a size
   API on IconButton/Dialog to make the 4 override sites apply (FAB `px-0`, star
   `w-8 h-8`, assign `w-10 h-10`, modal `p-6`). Deferred by user decision
   2026-08-09; cosmetic.
2. **FilterSelect consolidation** — merge the 2 pre-existing definitions
   (ExerciseSearchHeader, ExercisePicker) into a primitive. Explicitly future
   work per PMD-2; PR 3 preserved them byte-for-byte.
3. **Dialog contained test class-coupling** — revisit when/if primitives move to
   the browser test project (browser suite already covers real interaction).
4. **`[id]` test-count bookkeeping** — align apply-progress 3c claim (20) with
   source count (18) in future bookkeeping; full suite authoritative.

## Next Steps

**Remaining pages migration (future change)**: dashboard, sequences, history,
calendar, stats, editors, play, auth, layouts still use inline/token styles and
are non-goals of this change (spec Non-Goals). Use this change as the
workflow template: per-page ≤400 changed lines, behavior preserved, primitives
+ tokens only.

## Traceability

| Artifact | Location |
|---|---|
| proposal | `openspec/changes/page-migration-demo/proposal.md` |
| spec confirmation (REUSE verbatim + PMD-2 N/A decision) | `openspec/changes/page-migration-demo/spec-confirmation.md` |
| design | `openspec/changes/page-migration-demo/design.md` |
| tasks | `openspec/changes/page-migration-demo/tasks.md` (28/28 `[x]`) |
| apply-progress | `openspec/changes/page-migration-demo/apply-progress.md` (3/3 slice TDD tables) |
| verify-report | `openspec/changes/page-migration-demo/verify-report.md` (APPROVE WITH WARNINGS, 0 CRITICAL, at `f762fe1`) |
| archive-report | `openspec/changes/page-migration-demo/archive-report.md` (this file) |
| page-migration-demo spec (source of truth) | `openspec/specs/page-migration-demo/spec.md` |
| PR merges | #11 `435054b` (3a) → #12 `758b2ec` (3b) → #13 `f762fe1` (3c) |
| verify bookkeeping commit | `16c9fe0` (verify-report.md added; HEAD at archive) |
| validator | `gentle-ai sdd-verify-validate` → `valid:true`, `pass_with_warnings` |
| Engram archive record | `sdd/page-migration-demo/archive-report` (hybrid persistence — see note) |

**Engram note**: this archive run has no `mem_*` MCP tools available (engram
server unreachable this session, matching the ui-primitives archive run). On-disk
artifacts are complete and authoritative; the orchestrator should retry
`mem_save` for `sdd/page-migration-demo/archive-report` (`topic_key`,
`capture_prompt: false`) when the server is reachable.

The SDD cycle for the `page-migration-demo` change is complete: planned →
implemented (PRs #11–#13) → verified (APPROVE WITH WARNINGS, 0 CRITICAL) →
archived.
