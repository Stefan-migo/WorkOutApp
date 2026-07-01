# Proposal: Phase 4 — Calendar, History & Stats Visual Polish

## Intent

Align `/calendar`, `/history`, `/history/[id]`, and `/stats` with the Deep Nordic Athletic design system (OpenDesign HTML prototypes + `DESIGN.md` + `globals.css`). Data layer stays untouched; this is a visual-only layer on existing hooks and types.

## Scope

### In Scope
- `/calendar` — row-based day layout with Today's Focus panel and Upcoming sidebar
- `/history` — glass-card session list with search, filters, date badges, metrics
- `/history/[id]` — bento-grid metric cards + styled interval breakdown
- `/stats` — consistency heatmap, bar tooltips, full design token pass
- All pages: Deep Nordic tokens, Material Icons, glass-card/ambient-shadow patterns

### Out of Scope
- New data model fields (HR, zones, RPE, PRs, calories) — design adapted to existing `Session`/`CompletedInterval` schema
- Data layer changes (hooks, types, localStorage)
- Drag-and-drop on calendar (deferred)
- Monthly calendar view (design shows toggle but Weekly-only MVP)

## Capabilities

### Modified Capabilities
- `calendar-programming`: Requirements CP-1 (calendar rendering), CP-2 (day modal), CP-3 (templates) — visual/UX redesign only
- `session-history`: Requirements SH-1 through SH-4 (history list + detail) — visual redesign
- `statistics`: Requirements ST-1 through ST-9 — visual enhancement, heatmap addition
- `notifications-export`: Requirement EX-1 (export button on stats) — unchanged

## Approach

Three stacked work units matching design domains:
1. Calendar page rewrite (row layout, Today's Focus, Upcoming, tokens)
2. History pages rewrite (list + detail, glass cards, metrics bento)
3. Stats dashboard visual pass (heatmap, tooltips, tokens)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/calendar/page.tsx` | Rewrite | Row layout, Today's Focus panel, Upcoming sidebar, Material Icons |
| `src/app/history/page.tsx` | Rewrite | Search, filters, glass-card rows, date badges, metrics |
| `src/app/history/[id]/page.tsx` | Rewrite | Bento metric grid, styled interval cards |
| `src/components/StatsDashboard.tsx` | Modify | Heatmap addition, tooltips, token pass, name resolution |
| `src/app/stats/page.tsx` | No change | Already an RSC shell |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Design references HR/zone data not in model | High | Adapt metrics to show duration, completion rate, interval count |
| Stats heatmap requires session-date index | Low | `useStats` already has date set — repurpose for heatmap |
| Calendar row layout touches every day cell | Low | Modular refactor, DayCell → DayRow component |

## Rollback

Each page is a standalone stack branch to main. Rollback = revert the branch.

## Dependencies

- Phases 1-3 merged to main (data layer, hooks, types, global styles)
- DESIGN.md + globals.css already define tokens
- No new deps

## Success Criteria

- [ ] Each page matches its OpenDesign HTML reference using available data
- [ ] All Deep Nordic design tokens used (no zinc/blue hardcoded colors)
- [ ] All existing pages still render without errors
- [ ] Session name resolution works in stats (not truncated IDs)
