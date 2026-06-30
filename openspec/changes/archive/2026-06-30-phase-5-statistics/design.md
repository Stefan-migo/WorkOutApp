# Design: Phase 5 — Workout Statistics

## Technical Approach

Pure client-side `/stats` page that reads `workoutapp.sessions` from localStorage via the existing `useSessions()` hook. All aggregations (totals, streak, weekly volume) computed in a `useStats` hook using `useMemo`. CSS-only bar chart with Tailwind dynamic `h-[Npx]`. Empty state for fresh installs.

## Architecture Decisions

### Decision: RSC shell vs direct `'use client'` page

| Option | Tradeoff | Decision |
|--------|----------|----------|
| RSC shell → client component | One extra layer, matches ST-9 | ✅ **Chosen** |
| Direct `'use client'` page | Matches existing project pattern (history, calendar, workouts all use this) | ❌ Rejected |

**Rationale**: Spec ST-9 requires it. The RSC shell is a one-liner — negligible overhead.

### Decision: Single StatsDashboard vs separate sub-components

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Single `StatsDashboard.tsx` with inline cards + chart | 3 files vs 5, simpler | ✅ **Chosen** |
| Separate `SummaryCards`, `VolumeChart`, `RecentSessions` | More granular, marginally more testable | ❌ Rejected |

**Rationale**: Ponytail — the chart is a flex row of `<div>` elements with dynamic height. The 4 summary cards are simple `<div>` with a number and label. Neither needs its own file. The whole dashboard fits comfortably in one component.

### Decision: `useStats` hook vs `useMemo` in component

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `useStats()` hook extracting all computations | Testable in isolation, reusable | ✅ **Chosen** |
| `useMemo` blocks inline in StatsDashboard | Fewer files, simpler for one-page feature | ❌ Rejected |

**Rationale**: The streak algorithm has edge cases (gaps, UTC boundary, today logic). Extracting to `useStats` lets us add an inline self-check test. Also keeps StatsDashboard focused on rendering.

### Decision: Chart window — 12 weeks per spec vs 52 per proposal

**Choice**: 12 weeks (per spec ST-3).
**Rationale**: Spec is authoritative. 12 bars is enough for "am I trending up?" visual. Ponytail — fewer bars, less rendering, less code.

### Decision: Pure JS date math vs date-fns

**Choice**: Manual `Date` math for ISO week calculation.
**Rationale**: Single pure function `getISOWeek(date)`. Not worth 68 kB date-fns for one function.

## Data Flow

```
localStorage("workoutapp.sessions")
    │
    ▼
useSessions() ──→ sessions: Session[]
    │
    ▼
useStats(sessions) ──→ StatsData
    │  ├─ totalWorkouts: number
    │  ├─ totalTimeSeconds: number
    │  ├─ currentStreak: number
    │  ├─ sessionsThisWeek: number
    │  ├─ weeklyVolume: { weekLabel, totalSeconds }[]  (last 12 ISO weeks)
    │  └─ recentSessions: Session[]  (last 10)
    │
    ▼
StatsDashboard (client component)
    ├─ Summary cards section
    ├─ Volume chart (CSS bars)
    └─ Recent sessions list
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useStats.ts` | Create | Pure stats computation from `Session[]`: totals, streak, weekly volume, recent 10 |
| `src/app/stats/page.tsx` | Create | RSC shell — renders `<StatsDashboard />` |
| `src/components/StatsDashboard.tsx` | Create | Client component: summary cards, CSS bar chart, recent sessions list |
| `src/app/nav.tsx` | Modify | Add `/stats` nav link |

## Interfaces / Contracts

```typescript
// Return type of useStats()
interface StatsData {
  totalWorkouts: number
  totalTimeSeconds: number
  currentStreak: number
  sessionsThisWeek: number
  weeklyVolume: Array<{ weekLabel: string; totalSeconds: number }>  // last 12 ISO weeks
  recentSessions: Session[]  // last 10 sorted by startedAt desc
}
```

**Streak algorithm** (per ST-8):
1. Sort sessions by `startedAt` descending
2. Group by calendar date (UTC): `new Date(startedAt).toISOString().slice(0,10)`
3. Start from today (UTC) going backward
4. Count consecutive days that have ≥1 session
5. Break on first gap day

**Weekly volume** (per ST-2/ST-3):
1. Compute ISO week number for each session: `getISOWeek(date)`
2. Sum `actualDuration` across intervals per week
3. Build array of last 12 weeks (including empty weeks) with ISO week labels, e.g. `"2026-W26"`
4. Max bar height: `Math.max(...weeklyVolume.map(w => w.totalSeconds))` — each bar is `(week.totalSeconds / max) * chartHeightPx`

**CSS Bar chart pattern**:
```tsx
// ponytail: flex row, dynamic height via inline style, no chart lib
<div className="flex items-end gap-1 h-32">
  {weeklyVolume.map(w => (
    <div key={w.weekLabel} className="flex-1 flex flex-col items-center gap-1">
      <div
        className="w-full bg-accent rounded-t"
        style={{ height: `${(w.totalSeconds / max) * 100}%` }}
      />
      <span className="text-[10px] text-muted">{shortLabel(w.weekLabel)}</span>
    </div>
  ))}
</div>
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `useStats` streak edge cases (gap, single, fresh) | Inline `demo()` self-check per project pattern |
| Unit | `useStats` weekly volume grouping | Same self-check |
| Manual | Visual: bar heights, empty state, responsive | Visual verification |

## Open Questions

- None. Design maps directly to spec requirements and existing project patterns.
