# Proposal: Split large page files

## Intent

`calendar/page.tsx` (553 lines) and `exercises/page.tsx` (501 lines) exceed readable size. Extract inline sub-components into `src/components/`. Pure mechanical extraction — zero behavior change, no new deps.

## Scope

**PR 1** — Split `calendar/page.tsx` (~553→220 lines): extract `DayRow`, `TodaysFocus`, `WeekNav`, `TemplatesPanel`, `UpcomingList` into `src/components/`. Move `deriveTypeLabel` into `src/lib/calendar-utils.ts`.

**PR 2** — Split `exercises/page.tsx` (~501→200 lines): extract `ExerciseSearchHeader`, `ExerciseFormDialog`, `ExerciseDeleteDialog` into `src/components/`.

**Out**: CSS changes, new tests, logic refactoring, state lifting, new deps.

## Capabilities

Pure refactor — no spec-level changes. Both `calendar-programming` and `exercise-library` specs describe existing behavior preserved exactly.
- **New**: None.
- **Modified**: None.

## Approach

1. New file per component in `src/components/` with named export + exact props interface
2. `deriveTypeLabel` moves to `src/lib/calendar-utils.ts` (shared by DayRow + UpcomingList)
3. Replace inline usage with imports in page files
4. 2 stacked PRs to main, each ≤300 lines

## Affected Areas

| Area | Impact |
|------|--------|
| `src/app/calendar/page.tsx` | Modified |
| `src/components/DayRow.tsx` | New |
| `src/components/TodaysFocus.tsx` | New |
| `src/components/WeekNav.tsx` | New |
| `src/components/TemplatesPanel.tsx` | New |
| `src/components/UpcomingList.tsx` | New |
| `src/app/exercises/page.tsx` | Modified |
| `src/components/ExerciseSearchHeader.tsx` | New |
| `src/components/ExerciseFormDialog.tsx` | New |
| `src/components/ExerciseDeleteDialog.tsx` | New |
| `src/lib/calendar-utils.ts` | Modified |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing prop/import | Low | TS compiler catches mismatches |
| Behavior drift | Low | Copy-paste only; verify via build |

## Rollback

Revert the merge commit per PR. Both PRs independent — revert one without affecting the other.

## Dependencies

None.

## Success Criteria

- [ ] `calendar/page.tsx` ≤ 250 lines
- [ ] `exercises/page.tsx` ≤ 250 lines
- [ ] `next build` passes with no errors
- [ ] All new components use named exports
- [ ] Every extracted component lives in `src/components/`
