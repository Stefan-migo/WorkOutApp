# Spec Confirmation — page-migration-demo (PR 3)

Spec exists at `openspec/specs/page-migration-demo/spec.md` (PMD-1..4) and fully covers the
proposal's three stacked slices (3a–3b–3c). Reused verbatim per proposal decision 1 — **no rewrite,
no delta spec** (PR 2 precedent: base spec untouched; `specs/` dir not created).

## Coverage verification (proposal slice → spec)

| Proposal in-scope slice | Spec coverage |
|---|---|
| 3a `/workouts`: Card, EmptyState, Button (FAB, "New Workout"), IconButton (Play) | PMD-1a (Card), PMD-1b (EmptyState), PMD-1c (Button); IconButton falls under PMD-1 "primary actions" + PMD-3 primitive rule |
| 3a: ⋮ overflow menu stays inline | PMD-1 requirement text ("MAY remain inline") + Non-Goals (DropdownMenu) |
| 3a: `TimelinePreview` stays token-based | Non-Goals (TimelineStrip) |
| 3b `/exercises` list: SearchInput, Card, EmptyState | PMD-2a, PMD-2b, PMD-2c |
| 3b: Badge (chips), Button (pill), IconButton (star/assign) | PMD-3 blanket primitive rule (UIP-1 lists all 8 primitives incl. Badge/Button/IconButton) |
| 3b: `FilterSelect` not duplicated further, behavior preserved | PMD-2 requirement text ("MUST NOT be duplicated further… preserve behavior") + PMD-4 |
| 3b: test selector fix `textbox` → `searchbox` | PMD-2a (SearchInput `type="search"`) + PMD-4 (tests keep passing) |
| 3c overlays: ExerciseFormDialog + AddToWorkoutModal → Dialog/Sheet | PMD-2d (Dialog/Sheet) + UIP-6/8 primitive contract |
| 3c: `dialogRef` → `open`/`onOpenChange` (controlled-state refactor, incl. `[id]` ripple) | PMD-4 (dialog flows behave identically) |

## Requirement integrity

- PMD-1..4 all present; 7 scenarios total; every requirement has ≥1 scenario.
- Happy paths (PMD-1 populated list, PMD-2 search preserved) and edge cases (PMD-1 empty list,
  PMD-2 no results) covered; PMD-3/PMD-4 are cross-cutting review/regression checks.
- RFC 2119 keywords used throughout (`MUST`, `MUST NOT`, `SHALL`, `SHOULD`, `MAY`). No ambiguity found.

## N/A annotation — PMD-2 "Delete confirmation" (user decision, 2026-08-09 — RECORD, do not re-litigate)

The PMD-2 `Delete confirmation` scenario is declared **NOT APPLICABLE**:

- The delete dialog (`ExerciseDeleteDialog`) lives in `exercises/[id]/page.tsx`, which is **out of PR 3 scope** (only the minimal 3c shared-overlay API ripple touches that file).
- The `/exercises` list itself has **no delete dialog** (removed from compact cards, `page.tsx:161`).

Consequence for verify: this scenario is **satisfied-by-declaration, not testable**. Tasks and verify
MUST NOT attempt to satisfy a non-existent surface. The scenario stays in the base spec (PR 2 precedent:
base spec untouched); this annotation is the binding record for design/tasks/verify.

## Gap notes

1. PMD-2's table enumerates the headline primitives (SearchInput/Card/EmptyState/Dialog) but not
   Badge/Button/IconButton used in 3b — covered by PMD-3's blanket primitive rule (all 8 exist per UIP-1).
   No spec amendment needed; low risk.
2. 3b image area keeps an inline `background-image` (data/asset-driven, test-asserted). PMD-3's "no new
   inline patterns" targets hardcoded colors/duplicated patterns, not asset URLs; PMD-4 preserves behavior.
   Low risk; note only.
3. The 3b selector fix is test-level support for PMD-2a, not a new behavior — no dedicated requirement
   needed; PMD-4 covers test stability.
