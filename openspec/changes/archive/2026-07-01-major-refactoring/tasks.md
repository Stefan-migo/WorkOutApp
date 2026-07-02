# Tasks: Major Refactoring — 5 Stacked PRs

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~810–960 (across 5 PRs; each ≤400) |
| 400-line budget risk | Low per PR |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Work Units

| PR | Goal | Lines | Dependencies |
|----|------|-------|--------------|
| 1 | next/font self-hosting | ~150–200 | None (seed PR) |
| 2 | Dark mode CSS | ~60 | None (independent) |
| 3 | Dashboard extraction (page.tsx) | ~200 | None (independent) |
| 4 | StatsDashboard extraction | ~150 | None (independent) |
| 5 | WorkoutEditor useReducer + CycleGroup | ~250–350 | None (independent) |

## PR 1 — next/font Self-Hosting (~150–200 lines)

- [x] 1.1 Import Inter + JetBrains Mono from `next/font/google` in `src/app/layout.tsx` with `variable` config
- [x] 1.2 Import `Material_Symbols_Outlined` from `next/font/google` in `src/app/layout.tsx` with `variable` config (deferred — not exported in current Next.js version; kept CDN with ponytail note)
- [x] 1.3 Apply font CSS variables to `<html>` via `className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}`
- [x] 1.4 Update `globals.css` `@theme` block: `--font-*` values → `var(--font-inter)`, `var(--font-jetbrains-mono)`
- [x] 1.5 Remove CDN `<link>` tags and preconnect/preload for `fonts.googleapis.com` / `fonts.gstatic.com`
- [x] 1.6 Verify: `tsc --noEmit` (0 errors), `vitest run` (153/153 passing), manual render check pending

## PR 2 — Dark Mode CSS (~60 lines)

- [x] 2.1 Add `@media (prefers-color-scheme: dark)` block in `globals.css` with dark variants of all Material 3 color tokens
- [x] 2.2 Fix `.glass-panel-dark`: replace `rgba(255,255,255,0.05)` with `var(--color-surface-container-low)`
- [x] 2.3 Verify: `tsc --noEmit`, `vitest run`, manual light/dark OS render check

## PR 3 — Dashboard Extraction (~200 lines)

- [x] 3.1 Create `src/components/dashboard/HeroCard.tsx` — extract "Today's Workout" (props: `todayWorkout`, `totalSessions`, `workoutsLength`)
- [x] 3.2 Create `src/components/dashboard/MiniCalendar.tsx` — extract "This Week" (props: `monday`, `weekPlan`, `todayIndex`)
- [x] 3.3 Create `src/components/dashboard/QuickActions.tsx` — extract static 3-link action grid (no props)
- [x] 3.4 Create `src/components/dashboard/UpNextCard.tsx` — extract "Up Next" (props: `totalSessions`, `thisWeekSessions`)
- [x] 3.5 Refactor `page.tsx` — replace 4 inline sections with imports, shrink from ~261→~80 lines
- [x] 3.6 Verify: `tsc --noEmit`, `vitest run`, manual visual diff

## PR 4 — StatsDashboard Extraction (~150 lines)

- [x] 4.1 Create `src/components/stats/VolumeChart.tsx` — extract volume bars (props: `recentVolume`, `maxVolume`)
- [x] 4.2 Create `src/components/stats/StrainGauge.tsx` — extract RPE gauge (props: `avgRpe`)
- [x] 4.3 Create `src/components/stats/ConsistencyHeatmap.tsx` — extract heatmap grid (props: `heatmap: HeatmapCell[][]`)
- [x] 4.4 Refactor `StatsDashboard.tsx` — replace 3 inline sections with imports, pass `heatmap` from `buildHeatmap` call
- [x] 4.5 Verify: `tsc --noEmit`, `vitest run`, manual visual diff

## PR 5 — WorkoutEditor useReducer + CycleGroup (~250–350 lines)

- [x] 5.1 Create `src/lib/workout-reducer.ts` — `WorkoutAction` union type + pure reducer function (11 action types)
- [x] 5.2 Create `src/components/CycleGroup.tsx` — extract cycle bracket block (props: `interval`, `index`, child mutation callbacks)
- [x] 5.3 Migrate `WorkoutEditor.tsx` — replace `useState<Interval[]>` + 11 handlers with `useReducer`; keep `title`, `editingIndex` as `useState`, `dirtyRef` as `useRef`
- [x] 5.4 Write reducer unit tests — one `describe` block per action type, exhaustive coverage
- [x] 5.5 Verify: `tsc --noEmit`, `vitest run`, manual add/edit/delete/reorder/wrap-in-cycle walkthrough
