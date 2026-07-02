# Proposal: Major Refactoring — 5 stacked PRs

## Intent

WorkOutApp accumulated technical debt across 6 areas during rapid feature development: monolithic components (WorkoutEditor 417 lines, page.tsx 261 lines, StatsDashboard 242 lines), CDN-hosted fonts/icons, no dark mode, and unused server/data-split patterns. This change makes the codebase clean, professional, and maintainable without changing any user-facing behavior.

## Scope

### In Scope
- PR 1: next/font self-hosting — Inter, JetBrains Mono, and Material Symbols via next/font/google, remove CDN link tags from layout.tsx
- PR 2: Dark mode — prefers-color-scheme media query + dark Material 3 CSS vars (~60 lines pure CSS, no JS)
- PR 3: Dashboard extraction — extract HeroCard, MiniCalendar, QuickActions, UpNextCard from page.tsx (261→~80 lines)
- PR 4: StatsDashboard extraction — extract VolumeChart, StrainGauge, ConsistencyHeatmap into own components (242→~100 lines)
- PR 5: WorkoutEditor useReducer — migrate multiple useState handlers to a single useReducer

### Out of Scope
- Server/client component split (YAGNI — no server data layer, all data is localStorage-only)
- SVG icon subset for Material Symbols (ponytail says not worth it — next/font self-hosting covers this)
- Dark mode toggle UI (CSS-only first, toggle later if user asks)
- WorkoutEditor CycleGroup extraction (user may prefer useReducer instead — deferred to PR 5 decision)
- Any behavioral or spec-level changes

## Capabilities

### New Capabilities
None — pure refactoring, zero new user-facing behavior.

### Modified Capabilities
None — no spec-level requirements change; implementation only.

## Approach

5 stacked PRs, each ≤400 changed lines, merged sequentially to `main`:

1. **next/font** → `layout.tsx`, `tailwind.config.ts`: replace CDN `<link>` tags with `next/font/google` calls, wire CSS vars into Tailwind v4
2. **Dark mode** → `globals.css`: add `@media (prefers-color-scheme: dark)` block, define dark Material 3 surface/on-surface/primary/tertiary via CSS custom properties
3. **Dashboard extraction** → split `page.tsx` inline sections into `components/dashboard/HeroCard.tsx`, `MiniCalendar.tsx`, `QuickActions.tsx`, `UpNextCard.tsx`
4. **StatsDashboard extraction** → split inline sections into `components/stats/VolumeChart.tsx`, `StrainGauge.tsx`, `ConsistencyHeatmap.tsx`
5. **WorkoutEditor useReducer** → replace scattered `useState` + handler functions with `useReducer(state, action)` dispatch pattern; keep all logic in same file

PRs block each other only where file touches overlap — sequential merge on main resolves cleanly.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/layout.tsx` | Modified | Remove CDN links, add next/font | 
| `tailwind.config.ts` | Modified | Wire font CSS vars |
| `src/app/globals.css` | Modified | Dark mode CSS vars |
| `src/app/page.tsx` | Modified | Extract inline sections to imports |
| `src/components/StatsDashboard.tsx` | Modified | Extract sections to own files |
| `src/components/WorkoutEditor.tsx` | Modified | useReducer migration |
| `src/components/dashboard/` | New | 4 extracted components |
| `src/components/stats/` | New | 3 extracted components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| next/font + Tailwind v4 CSS var name mismatch | Low | Verify variable naming with `context7` docs lookups before writing |
| Dark mode breaks light mode | Low | CSS-only, scoped to @media block, test both |
| PR chaining merge conflicts | Low | Sequential merge to main, each PR small and independent |
| useReducer introduces regression in workout editing | Med | Component tests + manual walkthrough, rollback is git revert |

## Rollback Plan

Each PR is independently revertable via `git revert <sha>`. No database migration, no data loss — these are pure code changes. If all 5 deploy and a regression surfaces, revert the offending PR only; remaining 4 stay live.

## Dependencies

- `next/font/google` availability (built-in Next.js, zero install)
- Tailwind v4 CSS variable interpolation (`var(--font-inter)` etc.) — verify with docs

## Success Criteria

- [ ] PR 1: no `<link>` tags for fonts in rendered HTML, fonts load via next/font
- [ ] PR 2: page renders correct dark palette when OS prefers dark, unchanged in light
- [ ] PR 3: dashboard section renders identically before/after extraction
- [ ] PR 4: stats section renders identically before/after extraction
- [ ] PR 5: WorkoutEditor add/edit/delete/rest exercises behave identically
- [ ] Each PR ≤400 changed lines (additions + deletions)
