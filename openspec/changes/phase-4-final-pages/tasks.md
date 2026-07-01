# Tasks: Phase 4 — Calendar, History & Stats Visual Polish

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Calendar → PR 2: History → PR 3: Stats |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

```
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Calendar page rewrite — row layout, Today's Focus, Upcoming sidebar | PR 1 | Base: main. ~140 lines. No data changes. |
| 2 | History list + session detail rewrite — glass cards, bento, search | PR 2 | Base: main. ~130 lines. No data changes. |
| 3 | Stats dashboard — heatmap, tooltips, name resolution, tokens pass | PR 3 | Base: main. ~100 lines. No data changes. |

## Phase 1: Calendar Page Rewrite

- [x] 1.1 Rewrite day cells from 7-column grid to 7 horizontal day-rows with date badge, type chip, duration, chevron icon
- [x] 1.2 Add Today's Focus right panel showing current day's workout detail + Start button
- [x] 1.3 Add Upcoming sidebar with 3-day mini preview + motivational card
- [x] 1.4 Replace all Tailwind zinc/blue classes with Deep Nordic design tokens
- [x] 1.5 Replace text-based nav arrows with Material Icons (chevron_left/chevron_right)

## Phase 2: History + Session Detail Rewrite

- [ ] 2.1 Rewrite `/history` list with glass-card rows, left accent bar, date badge component
- [ ] 2.2 Add search input with filter logic (client-side title match)
- [ ] 2.3 Add Filters button + This Month range button (visual only, filter wiring optional)
- [ ] 2.4 Rewrite `/history/[id]` with 2×2 bento metric grid (duration, intervals, completion rate, work/rest ratio)
- [ ] 2.5 Rewrite interval table as styled cards with left accent border colored by type

## Phase 3: Stats Dashboard Enhancement

- [x] 3.1 Add consistency heatmap (4-week × 7-day grid from session timestamps)
- [x] 3.2 Add hover tooltips on weekly volume bars showing formatted duration
- [x] 3.3 Resolve session names via `getWorkout`/`getSequence` (stop using truncated IDs)
- [x] 3.4 Add "Last 30 Days Overview" subtitle
- [x] 3.5 Remove duplicate Export button from empty state
- [x] 3.6 Apply Deep Nordic token pass to any remaining hardcoded colors

## Phase 4: Cross-Page Verification

- [x] 4.1 Run `npm test` — confirm no regressions
- [ ] 4.2 Manually verify calendar, history, session detail, stats all render
- [ ] 4.3 Verify search filters sessions by title
- [ ] 4.4 Verify heatmap shows correct training/rest days
- [ ] 4.5 Verify session names resolve correctly in stats
