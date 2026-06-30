# Proposal: Phase 5 — Workout Statistics

## Intent

Users need to see training progress — total workouts, time, streaks, and weekly volume — to stay motivated. Current history is a flat list with no aggregation.

## Scope

### In Scope

- Summary stats card: total workouts, total time, current streak, sessions this week
- Weekly volume chart: CSS-only `<div>` bars, 1 per ISO week, height proportional to total duration, last 52 weeks
- Recent sessions list (last 10 completed)

### Out of Scope

- External chart libs (CSS bars — add Chart.js when user requests)
- Per-exercise breakdowns
- Historical trends beyond weekly
- Export (Phase 6)

## Capabilities

### New Capabilities

- `workout-statistics`: Aggregated stats dashboard and weekly volume chart from session history

### Modified Capabilities

None — pure read from existing `workoutapp.sessions` data.

## Approach

New `/stats` client page at `src/app/stats/page.tsx`. Reuses existing `useSessions()` hook. Stats computed client-side: totals from `sessions.length` and sum of `actualDuration` on each `intervals[]`; streak by walking sessions backwards checking consecutive days; weekly chart grouped by ISO week with proportional `<div>` bars using Tailwind `h-[N%]`. Max 52 weeks. Burgundy monochrome scheme.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/stats/page.tsx` | New | Stats page |
| `src/app/nav.tsx` / layout | Modified | Add `/stats` nav link |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large dataset slow render | Low | Limit chart to 52 weeks, O(n) |

## Rollback Plan

Delete `/stats` route, revert nav link. Pure read — no data was written.

## Dependencies

None.

## Success Criteria

- [ ] Summary stats correct from real session data
- [ ] Weekly bar chart ≤52 bars with proportional heights
- [ ] Last 10 sessions rendered in compact list
- [ ] Empty state renders gracefully (no sessions yet)
- [ ] Nav link to `/stats` is accessible
- [ ] Zero regressions on existing pages
