# Archive Report: design-system — PR 1 foundation (Happy Hues palette replacement)

- **Change**: `design-system`
- **Archived**: 2026-08-06
- **Mode**: hybrid (openspec + engram)
- **Status**: **ARCHIVED — PR 1 foundation closed with follow-ups** (intentional partial archive: PR 2 `ui-primitives` and PR 3 `page-migration-demo` are future phases, NOT delivered in this change)

## Executive Summary

The `design-system` change was planned as a three-PR effort. **PR 1 (foundation) is the only part implemented and verified in this change**: the full Happy Hues dark-warm palette replaced the Material 3 token layer in `@theme` (17 tokens added, 42 Material families deleted, `prefers-color-scheme` block removed), ~49 files migrated to role tokens per DSF-7, `SEGMENT_COLORS`/`TimerRing` remapped to `var()` references, `audit:tokens` rebuilt, `themeColor` mirrors `--color-bg`, and the three Foundations MDX docs rewritten. PR #6 (`feat/design-system-pr1-foundation`) was **merged to `main` at `f961149` (2026-08-06)**. Verify verdict: **APPROVE (PASS WITH WARNINGS — 2 warnings, 3 suggestions, 0 critical)**, 14/14 scenarios compliant, 598/598 tests green.

PR 2 (`ui-primitives`, UIP-1..8) and PR 3 (`page-migration-demo`) were explicitly re-planned at their launch and are **future work — not marked as delivered**. Their specs live in `openspec/specs/` as forward contracts.

## Artifacts Synced (source of truth)

The delta specs were already synced to main specs during delivery; this archive verifies and locks them. No `specs/` folder exists under `openspec/changes/design-system/` — deltas live directly in `openspec/specs/` per the repo convention.

| Domain spec | Status | Contents |
|---|---|---|
| `openspec/specs/design-system-foundation/spec.md` | ✅ Synced, verified accurate | DSF-1..DSF-7, 14 scenarios — matches implemented state (verified, not rewritten) |
| `openspec/specs/ui-primitives/spec.md` | ✅ Present (FUTURE) | UIP-1..8 — PR 2 contract, not implemented in this change |
| `openspec/specs/page-migration-demo/spec.md` | ✅ Present (FUTURE) | PR 3 contract, not implemented in this change |

**Verification note (DSF-3 wording)**: the design's Open Question flagged that the "No visual drift" scenario cannot hold literally across an intentional palette swap. The verify report interpreted it as "no drift beyond the intended palette change," which is recorded in `verify-report.md`. The spec wording was left untouched per archive instruction (verify only, do not rewrite); a wording amendment is recorded below as a future follow-up.

## Change Folder Convention

Per the repo archive convention, **the change folder is kept in place** at `openspec/changes/design-system/` with all artifacts intact (proposal, design, tasks, verify-report, this report). It is **NOT moved** to `openspec/changes/archive/` — that folder holds only older dated changes (e.g. `2026-06-29-phase-0-foundation`). No artifacts were deleted or altered.

## Final State (at close, 2026-08-06)

- **Merge**: PR #6 (`feat/design-system-pr1-foundation`) merged to `main` at **`f961149`** (merge commit, 2026-08-06). Working tree clean.
- **Candidate**: 13 commits, 64 files changed (+1165/−1007) per `verify-report.md` (written at commit `0e6f437`).
- **Tests**: 598 passed / 0 failed (55 files); targeted DSF-2 suites 23/23; contract-lock 4/4. `npx tsc --noEmit` clean; `npm run build` and `npm run build-storybook` exit 0.
- **Tasks**: 15/15 complete, all `[x]` in `tasks.md` (T-A..T-G). No unchecked implementation tasks. PR 2/3 are non-goals of this change, explicitly re-planned at their launch.
- **Compliance**: 14/14 scenarios, all DSF-1..DSF-7 requirements compliant.
- **`themeColor`**: `src/app/layout.tsx:26` → `'#55423d'` (mirror of `--color-bg`).
- **`SEGMENT_COLORS`**: `src/lib/segment-styles.ts:51` — `Record<IntervalType, string>` of `var(--color-segment-*)` references.
- **CI (fixed during delivery, on main)**: Node 20 → **24** in `.github/workflows/ci.yml`; Supabase public env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) mapped to the build step; repo secrets set.

## Audit Gate State — recorded contradiction

The orchestrator's launch prompt (final-state facts, 2026-08-06) asserts:

> "Verify report warnings 1+2 (audit:tokens script gate defects: grep option parsing + `&` separators swallowing exit codes) are still OPEN — the script defects were NOT fixed in PR 1; the contract-lock test (`src/lib/__tests__/token-audit.test.ts`) remains the real gate."

Repository evidence on `main` does not corroborate the "NOT fixed" part:

- Commit **`4903f92`** `chore(audit): fix grep option parsing for --color- pattern` — fixes WARNING 1 (`grep -E -- "--color-..."`).
- Commit **`2610391`** `fix(styles): ... audit:tokens: delegate to token-audit.test.ts so the gate can actually fail` — replaces the entire 4-grep `&` chain with `"audit:tokens": "vitest run src/lib/__tests__/token-audit.test.ts"` (current `package.json:10`), which structurally resolves WARNING 2 (the script now exits non-zero on failure).
- Both commits are ancestors of merge `f961149` on `main`; `npm run audit:tokens` runs the vitest contract-lock and passes 4/4.

Both statements are recorded here per Final-State Authority — the launch prompt claim (written at launch) and the repo evidence (written in commits merged 2026-08-06). Not resolved silently in either direction; the authoritative current state is the repository: **the audit gate now delegates to the contract-lock test and can fail**. The verify report's warnings remain historical record of the state at verification time (`0e6f437`).

## Open Follow-Ups (for future changes)

Recorded per the launch prompt and verify report; none block this archive (0 critical):

1. **Verify WARNING 1+2 (as recorded at verification time)** — `audit:tokens` grep-chain defects (option parsing; `&` swallowing exit codes). Per repo evidence above, addressed within PR 1 by commits `4903f92` + `2610391`; retained here as the launch prompt requested them as follow-ups. No further action required unless a standalone grep audit is reintroduced.
2. **Verify SUGGESTION 2 (deferred per design D4)** — `--color-focus-ring` holds a shadow value under a `--color-*` name; generated `ring-focus-ring`/`text-focus-ring` color utilities are dead. Accept as spec-written; record for future design-system cleanup (e.g. rename to a non-color token or remove dead utilities).
3. **Verify SUGGESTION 1** — accent density is high on some screens (e.g. `sequences/new` 13 accent instances, `exercises/[id]` 15); 1:1 carryover from Material `primary`/`secondary`, no new accent uses added by migration. DSF-1c ≤2-visible-uses discipline may warrant a visual pass in a later change.
4. **Verify SUGGESTION 3 (cosmetic)** — MDX `ColorItem var(--color-*)` values render literally in Storybook palette swatches; values documented accurately per DSF-5b.
5. **DSF-3 "No visual drift" wording** — amend the scenario to "no drift beyond the intended palette change" per design Open Question, when the foundation spec is next touched.

## Next Steps

**PR 2 planning — `ui-primitives` (future)**: re-plan at launch per design D8–D11 (contracts preserved in `design.md`): 8 primitives in `src/components/ui/` (Button, IconButton, Card, Badge, Input, SearchInput, EmptyState, Dialog/Sheet), stories + a11y checks, flat folder + barrel (`index.ts`), plain `Record<variant, string>` maps (no cva/`asChild`), native `<dialog>` controlled base, token references per the new palette roles. Estimated ≈1,150 changed lines → chained PR slices 2a–2d (design note).

**PR 3 planning — `page-migration-demo` (future)**: `/workouts` + `/exercises` converted to primitives; per-page ≤400 changed lines; behavior preserved (search/filter/navigation/dialogs).

Follow-ups 2–5 above can be bundled into the next design-system change.

## Traceability

| Artifact | Location |
|---|---|
| proposal | `openspec/changes/design-system/proposal.md` |
| design | `openspec/changes/design-system/design.md` |
| tasks | `openspec/changes/design-system/tasks.md` (15/15 `[x]`) |
| verify-report | `openspec/changes/design-system/verify-report.md` (APPROVE, 0 critical) |
| archive-report | `openspec/changes/design-system/archive-report.md` (this file) |
| foundation spec (source of truth) | `openspec/specs/design-system-foundation/spec.md` |
| ui-primitives spec (future) | `openspec/specs/ui-primitives/spec.md` |
| page-migration-demo spec (future) | `openspec/specs/page-migration-demo/spec.md` |
| merge commit | `f961149` (PR #6, 2026-08-06) |
| audit-script fix commits | `4903f92`, `2610391` (in PR #6) |
| Engram archive record | `sdd/design-system/archive-report` (hybrid persistence) |

The SDD cycle for the PR 1 slice of this change is complete: planned → implemented → verified → archived. PR 2 and PR 3 remain future work with their contracts preserved.
