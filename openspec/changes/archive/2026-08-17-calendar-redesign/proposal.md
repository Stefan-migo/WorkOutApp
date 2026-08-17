# Proposal: Calendar Redesign

## Intent

The `/calendar` page has grown into a 3-zone hybrid (week rows + focus card + side panels) that stacks into one long mobile scroll, mixes card styles, duplicates information ("Upcoming" repeats day rows), offers no month overview, and over-weights today with a full accent button. Redesign layout/UX for desktop and mobile while keeping the existing warm palette and all `calendar-programming` behavior.

## Scope

### In Scope

- New responsive layout: unified header (week nav + today + template actions), main week grid, compact contextual sidebar (desktop) / collapsible sections (mobile).
- Month overview: reuse/adapt `MiniCalendar` on `/calendar` for week jumps + assignment density.
- Redesign day cells/rows: lighter today treatment (accent ring/border, not full fill), consistent card style, duration + type label.
- Remove `UpcomingList` redundancy; fold "next up" into a compact strip or the focus card.
- Restructure `TodaysFocus` as a compact hero only on current week.
- Any new behavioral logic (e.g. month-grid derivation, week-jump selection) added to `src/lib/calendar-utils.ts` via strict TDD (Vitest, red-green-refactor).

### Out of Scope

- Data model, persistence, hooks, and DayAssignmentModal behavior (visual polish only).
- Color palette or design token changes.
- Home page usage of `MiniCalendar`.

## Capabilities

### New Capabilities

- `calendar-ui`: layout, responsive behavior, month overview, and visual conventions of the `/calendar` page.

### Modified Capabilities

- `calendar-programming`: CP-1 updated — grid may render as rows/cards (not strict 7-column), today highlighted subtly; add month-overview week-jump requirement. CP-2/3/4 unchanged behaviorally.

## Approach

Component restructure driven by pure-logic additions to `calendar-utils.ts` (month matrix, week-of-date, next-up derivation) written test-first in `src/lib/__tests__/calendar-utils.test.ts`; then rebuild `page.tsx` layout and components against `calendar-ui` spec. Existing `MiniCalendar` extended for assignment density. Strict TDD: every pure-function change lands as failing test → implementation → refactor.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/calendar/page.tsx` | Modified | New responsive layout composition |
| `src/components/{WeekNav,DayRow,TodaysFocus,TemplatesPanel}.tsx` | Modified | Restyle/restructure |
| `src/components/MiniCalendar.tsx` | Modified | Optional density indicator, calendar-page reuse |
| `src/components/UpcomingList.tsx` | Removed | Replaced by compact next-up strip |
| `src/lib/calendar-utils.ts` + tests | Modified | New pure helpers (month matrix, etc.) TDD |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regress `calendar-programming` scenarios | Medium | Keep CP-2/3/4 untouched; verify phase runs existing spec scenarios |
| Month overview scope creep | Medium | Limit to week-jump + density; no day editing from month view |

## Rollback Plan

Single branch revert; restore removed `UpcomingList.tsx` from git history; no data/schema changes.

## Dependencies

None.

## Success Criteria

- [ ] Mobile: no redundant panels; primary content reachable without long scroll past week grid.
- [ ] Desktop: max 2 visual zones, one card style.
- [ ] Month overview enables week navigation.
- [ ] All existing `calendar-programming` + calendar-utils tests pass; new logic 100% test-first.

## Proposal question round

1. Should the month overview allow direct day assignment, or jump-only? (Assumed: jump-only.)
2. Keep "Save as template" in header vs sidebar? (Assumed: header actions row.)
3. Is deleting `UpcomingList` outright acceptable, or keep a "next up" one-liner? (Assumed: keep one-liner inside focus/strip.)
