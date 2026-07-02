# Design: Major Refactoring — 5 Stacked PRs

## Technical Approach

Pure refactoring: zero behavior change. Each PR is a mechanical transformation — move code, replace loading strategy, add CSS rules, consolidate state — with visual/physical equivalence as the guard. Sequential merge to main, each independently revertable.

---

## PR 1 — next/font Self-Hosting

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/layout.tsx` | Modify | Replace 4 CDN `<link>` tags with 3 `next/font/google` calls (Inter, JetBrains Mono, Material Symbols). Remove preconnect/preload links. |
| `src/app/globals.css` | Modify | Update `@theme { --font-* }` values from `'Inter', system-ui, sans-serif` → `var(--font-inter)` etc. |

### Key Details

```typescript
// layout.tsx
import { Inter, JetBrains_Mono, Material_Symbols_Outlined } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-mono' })
const materialSymbols = Material_Symbols_Outlined({ weight: ['100', '200', '300', '400', '500', '600', '700'], variable: '--font-symbols' })

// ... in JSX: className={`${inter.variable} ${jetbrainsMono.variable} ${materialSymbols.variable}`}
```

CSS vars wire to Tailwind's `var()` interpolation: `--font-headline: var(--font-inter)`. Material Symbols need a utility class or applied via CSS variable as well.

### Test Strategy

- `tsc --noEmit`: 0 errors
- Diff rendered HTML before/after — confirm zero `<link>` tags to fonts.googleapis.com
- Manual: font-family computed on body, code blocks, icon spans

### Rollback

`git revert <sha>` — font system is a pure layout.tsx + globals.css change, no data involved.

---

## PR 2 — Dark Mode CSS

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modify | Add `@media (prefers-color-scheme: dark)` block after `@theme`. Define dark variants of all 27 color tokens. Fix `.glass-panel-dark` hardcoded value → use `var(--color-surface-container-low)` or similar. |

### Key Details

```css
/* After @theme block, before utility classes */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0d1117;
    --color-on-background: #e6edf3;
    /* ... all 27 tokens with dark Material 3 values */
  }
  .glass-panel-dark {
    background: var(--color-surface-container-low); /* was rgba(255,255,255,0.05) */
  }
}
```

`suppressHydrationWarning` already on `<html>` ✓. No JS toggle, no `useEffect`, no flash management needed — `prefers-color-scheme` is resolved before first paint.

### Test Strategy

- Light mode: render in light OS → confirm pixel-identical background/foreground
- Dark mode: render in dark OS → confirm dark surface, readable text
- `tsc --noEmit`: 0 errors (CSS-only change)

### Rollback

`git revert <sha>` — pure CSS, revert if dark palette has contrast issues in any panel.

---

## PR 3 — Dashboard Extraction

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/page.tsx` | Modify | Replace 4 inline sections with imports. Shrink from 261→~80 lines. |
| `src/components/HeroCard.tsx` | Create | Extract "Today's Workout" bento cell (lines 67-104). Props: `{ workout, totalSessions, workoutsLength }` or derive in component. |
| `src/components/MiniCalendar.tsx` | Create | Extract "This Week" calendar (lines 107-157). Props: `{ monday, weekPlan, todayIndex }`. |
| `src/components/QuickActions.tsx` | Create | Extract 3 action links (lines 160-197). No props — static links with icons. |
| `src/components/UpNextCard.tsx` | Create | Extract "Up Next" card (lines 200-257). Props: `{ totalSessions, thisWeekSessions }`. |

### Interfaces

```typescript
// HeroCard
interface HeroCardProps {
  todayWorkout: Workout | null
  totalSessions: number
  workoutsLength: number
}

// MiniCalendar — minimal; memoized callbacks stay in page.tsx
interface MiniCalendarProps {
  monday: string
  weekPlan: WeekPlan
  todayIndex: number
}
```

`getGreeting()`, `formatDate()` helpers stay in page.tsx (used only here). Keep `todayWorkout` derivation in page.tsx — it's 4 lines of cheap logic.

### Test Strategy

- Existing tests (none specific) — rely on `tsc --noEmit` + manual visual diff
- Component renders without crash in isolation (check test file, add if absent)

### Rollback

`git revert <sha>` — component extraction is a file rename + import change.

---

## PR 4 — StatsDashboard Extraction

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/StatsDashboard.tsx` | Modify | Replace 3 inline sections with imports. Shrink from 242→~100 lines. |
| `src/components/VolumeChart.tsx` | Create | Extract volume bars (lines 124-158). Props: `{ recentVolume, maxVolume }`. |
| `src/components/StrainGauge.tsx` | Create | Extract RPE gauge (lines 161-198). Props: `{ avgRpe }`. |
| `src/components/ConsistencyHeatmap.tsx` | Create | Extract heatmap grid (lines 201-222). Props: `{ heatmap: HeatmapCell[][] }`. |

### Key Decision: `buildHeatmap` stays

`buildHeatmap` helper (lines 21-46) is integral to StatsDashboard's data pipeline. It stays in StatsDashboard.tsx and is passed through to ConsistencyHeatmap, OR moves to `src/lib/buildHeatmap.ts`. Proposal says either is fine — ponytail says keep it inline, move only if another consumer emerges. **Decision**: leave in StatsDashboard, pass `heatmap` as prop.

### Test Strategy

- Existing `StatsDashboard.test.tsx` — update imports, ensure same test coverage
- Manual: verify gauge arc, bar heights, heatmap cell colors match before/after

### Rollback

`git revert <sha>` — pure extraction, no behavioral coupling.

---

## PR 5 — WorkoutEditor useReducer + CycleGroup

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/WorkoutEditor.tsx` | Modify | Replace `useState<Interval[]>` + 11 handler functions with `useReducer`. Extract CycleGroup JSX. |
| `src/components/CycleGroup.tsx` | Create | Extract cycle bracket rendering (lines 295-341). Props: `{ interval, index, onChildChange, onRemoveChild, onChildMoveUp, onChildMoveDown }`. |
| `src/lib/workout-reducer.ts` | Create | Pure reducer function + action types. |

### Action Types

```typescript
type WorkoutAction =
  | { type: 'ADD_INTERVAL'; interval: Interval }
  | { type: 'CHANGE_INTERVAL'; index: number; interval: Interval }
  | { type: 'REMOVE_INTERVAL'; index: number }
  | { type: 'MOVE_UP'; index: number }
  | { type: 'MOVE_DOWN'; index: number }
  | { type: 'SET_CYCLE_COUNT'; parentIndex: number; count: number }
  | { type: 'CHILD_CHANGE'; parentIndex: number; childIndex: number; child: Interval }
  | { type: 'REMOVE_CHILD'; parentIndex: number; childIndex: number }
  | { type: 'CHILD_MOVE_UP'; parentIndex: number; childIndex: number }
  | { type: 'CHILD_MOVE_DOWN'; parentIndex: number; childIndex: number }
  | { type: 'WRAP_IN_CYCLE' }
  | { type: 'SHEET_SAVE'; index: number; interval: Interval }
```

`title`, `editingIndex` stay as `useState`/`useRef` (not part of interval state atom).

`dirtyRef` stays as `useRef` (side effect, not state). `totalDurationSec` remains a `useMemo`.

### Test Strategy

- Existing `WorkoutEditor.test.tsx` must pass identically
- New: unit tests for reducer (pure function — cheap to test exhaustively)
- Manual walkthrough: add/edit/remove/reorder/wrap-in-cycle/cycle-count-change

### Rollback

`git revert <sha>` — largest PR but still ≤400 lines, self-contained in component + one lib file.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dashboard components location | `src/components/` (flat) | Matches existing convention. No `dashboard/` subdir unless >5 components. |
| `buildHeatmap` placement | Stay in StatsDashboard | YAGNI — single consumer, move when a second appears. |
| Reducer location | `src/lib/workout-reducer.ts` | Keeps Editor file focused on rendering; reducer is pure logic testable in isolation. |
| PR sequencing | Layout → CSS → Dashboard → Stats → Editor | Dependency chain: no PR depends on another; logical grouping by risk (fonts lowest, editor highest). |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Static | TypeScript | `tsc --noEmit` — all 5 PRs must pass |
| Unit (PR 5) | Reducer | Exhaustive action-type coverage |
| Component | Existing tests | After each PR, `vitest run` must pass 150/150 |
| Visual | Font/dashboard/stat PRs | Browser side-by-side comparison before commit |

## Migration / Rollout

No migration required. Each PR is an independent commit merged sequentially to `main`. Rollback = `git revert <sha>`. No data model changes, no DB, no feature flags.

## Open Questions

- [ ] (PR 1) Confirm Material Symbols variable name — `Material_Symbols_Outlined` in next/font/google — verify the subset/weight API matches current CDN wght range `100..700,0..1`
- [ ] (PR 2) Verify all 27 theme tokens have accessible dark contrast ratios — manual check after implementation
- [ ] (PR 5) Confirm `WorkoutEditor.test.tsx` current assertions — reducer refactor may need test updates for new action dispatching

## Size Budget

Each PR ≤400 changed lines. Estimated: PR1 ~80, PR2 ~70, PR3 ~160, PR4 ~140, PR5 ~250. Total ~700 lines changed across all 5 PRs.
