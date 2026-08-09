# Proposal: PR 3 — Page Migration Demo

## Intent

PR 1 delivered the token layer, PR 2 delivered 8 `ui/` primitives — but no page consumes them yet. This change proves the migration workflow on two simple pages (`/workouts`, `/exercises`), converting inline styles to `ui/` primitives + tokens (PMD-1..PMD-4) before the remaining ~14 pages are converted in future changes. It is the final slice of the design-system plan (PR 1 archive: "PR 3 planning" follow-up).

## Scope

### In Scope — 3 stacked concern-slices (merged to `main` in order)

- **3a — `/workouts` (est ~140–180 changed lines)**: `src/app/workouts/page.tsx` — Card (workout cards L112–119), EmptyState (L54–70), Button (FAB L199–205 primary/elevated, "New Workout" L87–93), IconButton (Play L169–176). ⋮ overflow menu (L120–167) STAYS inline (spec non-goal). `TimelinePreview` (L14–28) stays (token-based; TimelineStrip is a non-goal).
- **3b — `/exercises` list surface (est ~250–300)**: SearchInput (header search L83–89), Card (grid L241–317), EmptyState (empty variants L192–212), Badge (category/force/mechanic/difficulty chips L278–314), Button (pill: favorites toggle + "New Exercise"), IconButton (star 32px L260–266, assign 40px L268–276). Image area (L253) keeps inline `background-image` (test-asserted). **`FilterSelect` definitions (ExerciseSearchHeader.tsx L30–58, ExercisePicker.tsx L24) are NOT duplicated further and behavior is preserved when touched.** Plus test selector fix: `ExercisesPage.test.tsx:214` `getByRole('textbox')` → `getByRole('searchbox')` (SearchInput is `type="search"`).
- **3c — `/exercises` overlays (est ~200–250)**: `ExerciseFormDialog.tsx` (432) + `AddToWorkoutModal.tsx` (154) → Dialog/Sheet; `dialogRef` → `open`/`onOpenChange` (Dialog has no ref passthrough). Controlled-state refactor in `exercises/page.tsx` (L41/132/158) + minimal API ripple in `exercises/[id]/page.tsx` (L394–409 shared-overlay usage). `ExerciseFormDialog.test.tsx` dialogRef prop update (L43 etc.).

### Out of Scope
- Remaining pages: dashboard, sequences, history, calendar, stats, editors, play, auth, layouts (future changes)
- `DropdownMenu` primitive — ⋮ menu stays inline
- `FilterSelect` consolidation into a primitive (future change; only preservation is required here)
- `TimelineStrip` primitive (TimelinePreview stays token-based)
- `exercises/[id]` detail-page migration — NOT in scope, except the minimal 3c API ripple on shared overlays
- **PMD-2 "Delete confirmation" scenario — declared NOT APPLICABLE (user decision, 2026-08-09)**: the delete dialog (`ExerciseDeleteDialog`) lives in `exercises/[id]/page.tsx` (out of scope); the `/exercises` list itself has no delete dialog (removed from compact cards, `page.tsx:161`). Tasks/verify MUST NOT try to satisfy a non-existent surface.

## Capabilities

### New Capabilities
- None — `page-migration-demo` spec exists at `openspec/specs/page-migration-demo/spec.md` (PMD-1..4); reuse verbatim, sdd-spec confirms coverage

### Modified Capabilities
- `page-migration-demo`: PMD-2 "Delete confirmation" scenario declared N/A by user decision — sdd-spec MUST mark it non-applicable (annotate or remove) so verify treats it as satisfied-by-declaration, not testable

## Approach

Slice-per-PR stacked to `main` in order (3a → 3b → 3c), design-system/PR 2 precedent (2a–2d). Strict TDD RED-first per slice: write/adjust test first (3b selector fix, 3c dialogRef→open), then migrate, then green. Each slice ≤400 changed lines and passes the same per-PR gate: `npx tsc --noEmit` + slice tests + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`. Behavior preserved (PMD-4): search, filters, navigation, favorites, dialog flows.

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Spec: reuse vs rewrite | REUSE verbatim (PR 2 precedent); only mark PMD-2 delete-confirmation N/A |
| 2 | Delivery: one PR vs slices | 3 stacked slices 3a–3b–3c, each its own PR merged to `main` in order (PR 2 precedent) |
| 3 | Overlay API: `dialogRef` vs controlled | Switch to `open`/`onOpenChange` — Dialog has no ref passthrough |
| 4 | Test selector fix | `getByRole('textbox')` → `getByRole('searchbox')` in 3b |

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/app/workouts/page.tsx` | Modified | 3a: Card/EmptyState/Button/IconButton |
| `src/app/exercises/page.tsx` | Modified | 3b list surface; 3c controlled-state refactor |
| `src/components/ExerciseSearchHeader.tsx` | Modified | 3b: SearchInput + Buttons; FilterSelect untouched |
| `src/components/ExerciseFormDialog.tsx` | Modified | 3c: Dialog migration, props → open/onOpenChange |
| `src/components/AddToWorkoutModal.tsx` | Modified | 3c: Dialog/Sheet migration |
| `src/app/exercises/[id]/page.tsx` | Modified | 3c: minimal shared-overlay API ripple only |
| `src/app/exercises/__tests__/ExercisesPage.test.tsx` | Modified | 3b: L214 selector fix |
| `src/components/__tests__/ExerciseFormDialog.test.tsx` | Modified | 3c: dialogRef → open/onOpenChange props |

## Decision Log

| Date | Actor | Decision | Rationale |
|---|---|---|---|
| 2026-08-09 | user | PMD-2 "Delete confirmation" scenario = **NOT APPLICABLE** | Delete dialog lives in `exercises/[id]/page.tsx` (out of PR 3 scope); `/exercises` list has no delete dialog. No surface to satisfy; do not re-litigate. |
| 2026-08-09 | user (accepted) | SearchInput forces visible label + `type="search"` → `searchbox` role; header's underline-minimal look drifts to standard SearchInput styling | UIP-5 contract wins; visual drift accepted; test selector updated |
| 2026-08-09 | user (accepted) | IconButton sizes drift: star 32px, assign 40px (no size prop) via `className` overrides | Minor visual drift accepted; no primitive size API added |
| 2026-08-09 | user (accepted) | Dialog always renders `h2` title + backdrop semantics; form dialog content adapts | Accepted; if the 432-line form exceeds the `fixed` height, extend Dialog with `max-h`/overflow in 3c (contained) |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| 3c dialog behavior regression (432-line form) | Med | Strict RED-first on ExerciseFormDialog.test.tsx + a11y play coverage per slice |
| `FilterSelect` behavior drift when header touched | Med | 3b touches header search only; FilterSelect blocks preserved byte-for-byte; existing header tests stay green |
| Dialog `fixed` height vs long form | Low | Extend Dialog variant (max-h/overflow) in 3c, gated by slice tests |
| Stacked-slice diff drift | Med | Each slice its own PR merged to `main` in order; clean per-slice diff (PR 2 precedent) |

## Rollback Plan

Per-slice revert: each PR is independently revertible on `main` (merge reversal or per-file revert). 3a and 3b are pure presentational swaps (behavior-identical); 3c reverts `Dialog`-related props back to `dialogRef`. No data or schema changes anywhere.

## Dependencies

- Base spec `openspec/specs/page-migration-demo/spec.md` (PMD-1..4)
- 8 `ui/` primitives on `main` (PR 2, `src/components/ui/`)
- No new runtime or dev dependencies

## Success Criteria

- [ ] Slices 3a→3b→3c merged to `main` in order, each ≤400 changed lines
- [ ] All applicable PMD-1..PMD-4 scenarios pass; PMD-2 delete-confirmation recorded N/A (not tested)
- [ ] Per-slice gates green: tsc + slice tests + `test:a11y` + `audit:tokens` + `build-storybook`
- [ ] `ExercisesPage.test.tsx` L214 uses `getByRole('searchbox')`; `ExerciseFormDialog.test.tsx` uses `open`/`onOpenChange`
- [ ] No behavioral regression (PMD-4): search, filters, navigation, favorites, dialog flows unchanged

## Proposal question round

No blocking questions — user decisions (delete-confirmation N/A, accepted drifts) are recorded above and are not re-litigated. Residual items resolve in design: FAB/star/assign size overrides (3a/3b), Dialog `fixed` max-h/overflow (3c), SearchInput underline-style acceptance (recorded in decision log).
