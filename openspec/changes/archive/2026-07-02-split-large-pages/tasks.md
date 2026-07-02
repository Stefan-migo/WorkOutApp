# Tasks: Split large page files

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~640 total (PR 1: ~380, PR 2: ~260) |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes (user-specified) |
| Suggested split | PR 1 (calendar) → PR 2 (exercises) |
| Delivery strategy | auto-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Notes |
|------|------|-----------|------|-------|
| 1 | Calendar page split (5 components + util) | PR 1 | `main` | ~380 lines, ~200 after |
| 2 | Exercises page split (3 components) | PR 2 | `main` | ~260 lines, ~200 after |

## PR 1 — Calendar page (5 components + util)

- [x] 1.1 Move `deriveTypeLabel` from `src/app/calendar/page.tsx` → `src/lib/calendar-utils.ts`, add import to page
- [x] 1.2 Create `src/components/WeekNav.tsx` — week navigation chevrons + date range (35 lines)
- [x] 1.3 Create `src/components/DayRow.tsx` — day cell with 3 visual variants (113 lines)
- [x] 1.4 Create `src/components/TodaysFocus.tsx` — today's session card (100 lines)
- [x] 1.5 Create `src/components/TemplatesPanel.tsx` — template save/apply/delete with internal state (116 lines)
- [x] 1.6 Create `src/components/UpcomingList.tsx` — upcoming days mini-list (66 lines)
- [x] 1.7 Refactor `src/app/calendar/page.tsx` — replace 5 inline sections with imports, page 199 lines (was 553)
- [x] 1.8 Verify: `tsc --noEmit` + `vitest run` (196 passed, 23 files) + visual check recommended

## PR 2 — Exercises page (3 components, page 301 lines)

- [x] 2.1 Create `src/components/ExerciseSearchHeader.tsx` — search bar + filter chips + create button (~80 lines)
- [x] 2.2 Create `src/components/ExerciseFormDialog.tsx` — create/edit form inside `<dialog>` (~120 lines)
- [x] 2.3 Create `src/components/ExerciseDeleteDialog.tsx` — delete confirmation with ref-count warning (~40 lines)
- [x] 2.4 Refactor `src/app/exercises/page.tsx` — replace 3 inline sections with imports, page 301 lines (was 501). ExerciseCard kept inline (YAGNI: single-use JSX).
- [x] 2.5 Verify: `tsc --noEmit` + `vitest run` (196 passed) + manual visual check

## Constraints

- **Zero behavior change** — pure mechanical extraction, no logic refactoring
- **Named exports** for all 8 components (e.g., `export function DayRow`)
- **Page-level state stays** in the page — components are presentational shells
- **TemplatesPanel** owns `templateName`/`saveError` internally per design decision
- **Existing test** `ExercisesPage.test.tsx` tests the default export — no changes needed
