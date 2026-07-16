# Design: Phase 4 — Calendar, History & Stats Visual Polish

## Technical Approach

Layer visual alignment on existing data hooks. No data model changes — adapt design to what `Session`, `CompletedInterval`, `WeekPlan` provide. Four standalone pages, three rewrites, one enhancement. Use Deep Nordic tokens from `globals.css` and `DESIGN.md`.

## Architecture Decisions

### Decision: Adapt design to available data

**Choice**: Skip HR, zones, calories, RPE, PRs — design shows layout with our metrics  
**Alternatives considered**: Extend Session model with HR/zone fields  
**Rationale**: Adding tracking infrastructure mid-phase 4 is scope creep. The bento cards and row metrics work with duration, completion rate, and interval count.  
**Ponytail check**: YAGNI on HR/RPE/PR data until the tracker actually records it.

### Decision: Heatmap from session date set

**Choice**: Derive 4-week heatmap from existing `sessions[].startedAt` timestamps  
**Alternatives considered**: New weekly-activity storage key  
**Rationale**: `useStats.computeStats()` already builds a session-date Set for streak — extend for heatmap. Zero new persistence.

### Decision: Search is client-side filter — no backend

**Choice**: Filter `sessions[]` by title match in the component  
**Rationale**: All data is in-memory from `useSessions()`. No API, no debounce.

## Data Flow

```
User → [calendar page] → useWeekPlans / useProgramTemplates → localStorage
     → [history page]  → useSessions → filter state → render glass-cards
     → [session detail] → useSessions.find(id) → render bento + interval cards
     → [stats page]     → useSessions → computeStats → render heatmap + chart
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/calendar/page.tsx` | Rewrite | Row layout, Today's Focus panel, Upcoming sidebar, Material Icons |
| `src/app/history/page.tsx` | Rewrite | Glass-card rows, search, filters, date badges, metrics |
| `src/app/history/[id]/page.tsx` | Rewrite | Bento metric grid, styled interval cards |
| `src/components/StatsDashboard.tsx` | Modify | Heatmap, tooltips, name resolution, clean up empty-state dupe |

## Interfaces / Contracts

No new interfaces. All consumption from existing types (`Session`, `CompletedInterval`, `WeekPlan`, `DayAssignment`).

Heatmap utility (new inline in StatsDashboard or extracted to `useStats`):
```typescript
interface HeatmapDay {
  date: string // YYYY-MM-DD
  hasSession: boolean
  intensity: 0 | 1 | 2 | 3 // based on sessions that day
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Heatmap computation from sessions | Pure function test |
| Unit | Search filter on session list | Pure function test |
| Unit | Metric aggregation (completion rate, work/rest ratio) | Pure function test |
| Visual | Calendar row layout renders 7 days | Component smoke test |
| Visual | Session detail bento shows 4 cards | Component smoke test |

## Open Questions

- None. Design decisions resolved against data model constraints.

## Migration / Rollout

No migration. Stacked to main: Calendar PR → History PR → Stats PR.
