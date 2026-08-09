# Archive Report: ui-primitives — PR 2 design-system (UIP-1..UIP-8)

- **Change**: `ui-primitives`
- **Archived**: 2026-08-09
- **Mode**: hybrid (openspec + engram)
- **Status**: **ARCHIVED — DELIVERED** (8/8 requirements, 12/12 scenarios, 0 CRITICAL)

## Executive Summary

The `ui-primitives` change delivered the 8-primitive contract from the PR 1
design (D8–D11): **Button, IconButton, Card, Badge, Input, SearchInput,
EmptyState, Dialog/Sheet** in `src/components/ui/`, each with typed props, a
colocated CSF3 story (autodocs, args, controls), and unit + browser a11y
coverage. Delivered across **4 stacked slices merged to `main` in order**:
PR #7 (2a — D10 infra + Button/IconButton), PR #8 (2b — Card/Badge), PR #9
(2c — Input/SearchInput), PR #10 (2d — EmptyState/Dialog). Verify verdict on
`main` at `73afd73`: **APPROVE WITH WARNINGS — 0 CRITICAL**, 12/12 scenarios
compliant, 8/8 requirements, all gates green. Both verify WARNINGs were
closed before archive (see Final State below).

## Final State (at close, 2026-08-09)

Authoritative: this launch prompt's final-state facts + repository evidence
on `main`, which post-date `verify-report.md` (written at `73afd73`) and
`apply-progress`.

- **Merge commits (in order)**: PR #7 → `cdc87f0` (2a), PR #8 → `4bb33f2`
  (2b), PR #9 → `2fed662` (2c), PR #10 → `73afd73` (2d). HEAD of main at
  archive: **`17f3dad`**.
- **Verification verdict** (run on `main` at `73afd73`): **APPROVE WITH
  WARNINGS** — 0 CRITICAL, 12/12 scenarios, 8/8 requirements.
- **Gates (all green at `73afd73`)**: `npx tsc --noEmit` exit 0; `npm test`
  662/662 (63 files); `npm run test:a11y` 84/84 (12 files, chromium + axe);
  `npm run audit:tokens` 4/4; `npm run build-storybook` exit 0.
- **Tasks**: 34/34 `[x]` in `tasks.md` (2a: 10, 2b: 8, 2c: 8, 2d: 8). No
  unchecked implementation tasks.
- **Working tree**: clean at close (only `.atl/` registry cache touched
  outside this change, unrelated).

### WARNING 1 — resolved post-verify (commit `17f3dad`)

`verify-report.md` (at `73afd73`) flagged slice 2a tasks (2a.1–2a.10) as
stale `[ ]` in `tasks.md` despite the work being complete and gate-green.
Commit **`17f3dad`** `chore(openspec): add ui-primitives verify report, mark
slice 2a tasks complete` marked **2a.1–2a.10 `[x]`** and added
`verify-report.md` to the change dir (PR 1 convention). At close, all 34
checkboxes are `[x]`; the tracking gap is closed. Not an open defect.

### WARNING 2 — delivered design decision (NOT an open defect)

The a11y class-map deviations (Badge 2b, Input 2c, EmptyState 2d:
`text-{tone}`/`text-muted` → `text-fg-2` on dark tints) are **delivered
design decisions**, not open defects:

- **Cause**: design.md class maps used `text-muted`/`text-success`/
  `text-warn`/`text-danger` on dark tints, which measured **3.74:1 / 3.25:1
  (below WCAG AA 4.5:1)** against real chromium contrast on `--color-bg`.
- **Resolution**: text remapped to `text-fg-2` on those tinted surfaces —
  measured **8.64:1 / 7.18:1** (AA pass). Applied consistently across all
  three primitives, documented in code comments (Badge.tsx L19–23,
  Input.tsx L19–24, EmptyState.tsx L15–19) and pinned in tests
  (Badge.test.tsx L37–49, Input.test.tsx L56–63, EmptyState.test.tsx
  L58/L63).
- **Authority**: **UIP-7 (a11y MUST) wins** over the design class maps; the
  spec was never broken — the deviation is spec-protective. Verify recorded
  it as WARNING per the decision gate; archive records it as a delivered,
  evidence-backed design decision with the AA evidence above.

### jsdom 29 note — Dialog shim

jsdom 29 has no `HTMLDialogElement`. `Dialog.tsx` uses the real native
`<dialog>` API; unit tests use a **test-local spec-faithful shim** so the
component code itself is never shimmed. **Focus-restore (UIP-6b) is asserted
in the browser suite only** (`ui-primitives.a11y.test.ts`, real chromium
play: open → ESC → backdrop → focus-restore) — not in jsdom, per the test
layer distribution in `verify-report.md`. This is an intentional,
documented constraint of the test environment, not a coverage gap.

## Spec Sync (source of truth)

The `ui-primitives` spec lives at **`openspec/specs/ui-primitives/spec.md`**
(UIP-1..UIP-8, 12 scenarios) and **stands as the delivered spec**. Per the
PR 1 design-system precedent and `spec-confirmation.md` (which documented
the **REUSE verbatim** decision — "no rewrite, no delta spec"), there is **no
delta spec dir** under `openspec/changes/ui-primitives/` and none is
invented here. Verified accurate against the implemented state at close
(verified, not rewritten):

| Domain spec | Status | Contents |
|---|---|---|
| `openspec/specs/ui-primitives/spec.md` | ✅ Synced, verified accurate | UIP-1..UIP-8, 12 scenarios — matches implemented state |

## Change Folder Convention

Per the repo archive convention (design-system precedent,
`openspec/changes/design-system/archive-report.md`), **the change folder is
kept in place** at `openspec/changes/ui-primitives/` with all artifacts
intact (proposal, spec-confirmation, design, tasks, verify-report, this
report). It is **NOT moved** to `openspec/changes/archive/`. No artifacts
were deleted or altered.

## Open Follow-Ups (for future changes)

None block this archive (0 CRITICAL). Recorded for the next design-system
change:

1. **Verify SUGGESTION 1 (infra)**: DD-4 was implemented as a separate
   `vitest.browser.config.ts` rather than the planned `test.projects`
   consolidation; the effective gate is `npm run test:a11y`, not
   `npx vitest run --project storybook`. Gate-equivalent and green — align
   design.md wording or the config in a future infra pass.
2. **Verify SUGGESTION 2 (test coupling)**: primitive unit tests assert exact
   token class-map strings (D11 makes class maps the design contract; jsdom
   cannot compute styles). Accepted repo pattern; revisit when/if primitives
   move to the browser project.
3. **PR 3 — `page-migration-demo` (future)**: pages (`/workouts`,
   `/exercises`) migrate to these primitives; per-page ≤400 changed lines,
   behavior preserved. Not part of this change.

## Next Steps

**PR 3 planning — `page-migration-demo`**: convert `/workouts` + `/exercises`
to the delivered primitives (search/filter/navigation/dialogs use
SearchInput, Input, Card, EmptyState, Dialog/Sheet). Follow-ups 1–2 above can
bundle into the next design-system infra pass.

## Traceability

| Artifact | Location |
|---|---|
| proposal | `openspec/changes/ui-primitives/proposal.md` |
| spec confirmation (REUSE verbatim) | `openspec/changes/ui-primitives/spec-confirmation.md` |
| design | `openspec/changes/ui-primitives/design.md` |
| tasks | `openspec/changes/ui-primitives/tasks.md` (34/34 `[x]`) |
| verify-report | `openspec/changes/ui-primitives/verify-report.md` (APPROVE WITH WARNINGS, 0 CRITICAL, at `73afd73`) |
| archive-report | `openspec/changes/ui-primitives/archive-report.md` (this file) |
| ui-primitives spec (source of truth) | `openspec/specs/ui-primitives/spec.md` |
| PR merges | #7 `cdc87f0` (2a) → #8 `4bb33f2` (2b) → #9 `2fed662` (2c) → #10 `73afd73` (2d) |
| post-verify fix commit | `17f3dad` (tasks 2a.1–2a.10 `[x]` + verify-report.md added) |
| Engram archive record | `sdd/ui-primitives/archive-report` (hybrid persistence — see note) |

**Engram note**: this archive run had no `mem_*` MCP tools available
(engram server flaky this session). On-disk artifacts are complete and
authoritative; the orchestrator should retry `mem_save` for
`sdd/ui-primitives/archive-report` (`topic_key`, `capture_prompt: false`)
when the server is reachable.

The SDD cycle for the `ui-primitives` change is complete: planned →
implemented (PRs #7–#10) → verified (APPROVE WITH WARNINGS, 0 CRITICAL) →
archived.
