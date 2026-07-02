# Refactoring Spec: major-refactoring

## New Capabilities
None (pure refactor)

## Modified Capabilities
None (pure refactor)

## Refactoring Domains

### PR 1 — next/font Self-Hosting

**Behavior to preserve**: Inter, JetBrains Mono, and Material Symbols render identically after migrating from CDN `<link>` tags to `next/font/google`. No visual or layout shift.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Font family rendered | Page loads | Check computed font-family on body text | Inter is applied |
| Monospace preserved | Code block renders | Check computed font | JetBrains Mono active |
| Icon font works | Material Symbol renders | Check computed font-family | Material Symbols applied |
| No FOUT | Font loads | Check font-display in generated CSS | swap or optional, not blocking |
| No CDN requests | DevTools network tab | Filter for font CDN URLs | Zero font external requests |

### PR 2 — Dark Mode CSS

**Behavior to preserve**: Light mode palette is unchanged. Dark mode applies Material 3 tokens only when `prefers-color-scheme: dark`. No JavaScript toggle.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Light mode | OS theme = light | Render page | body background = light surface, text = on-surface |
| Dark mode | OS theme = dark | Render page | body background = dark surface, text = on-surface dark |
| .glass-panel-dark | OS theme = dark | Render glass panel | Background matches dark surface container, not hardcoded fallback |
| No dark flash | Page loads in dark mode | Transition from SSR to client | No light-mode flash |

### PR 3 — Dashboard Extraction (page.tsx)

**Behavior to preserve**: HeroCard, MiniCalendar, QuickActions, UpNextCard render identical content, layout, and spacing. page.tsx exports the same default component.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Component structure | page.tsx renders | Compare before/after React tree | Same children, same props, same order |
| Data flow | Dashboard depends on hooks | Extract component receives same props | All data binding preserved |
| Visual output | Page renders | Screenshot comparison (manual) | No visual diff |

### PR 4 — StatsDashboard Extraction

**Behavior to preserve**: VolumeChart, StrainGauge, ConsistencyHeatmap render identical data, scales, and positions. StatsDashboard export unchanged.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Chart dimensions | Chart renders with data | Compare SVG/canvas dimensions | Original size preserved |
| Data mapping | Stats data changes | Chart updates reactively | Same data transformation applied |
| Exports | Module imports StatsDashboard | Import path | Unchanged |

### PR 5 — WorkoutEditor useReducer

**Behavior to preserve**: All 22 state transitions produce identical state outcomes. Undo/redo if present continues working. No exercise data is lost.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Add exercise | Editor ready | Add exercise | Same state shape as useState version |
| Edit exercise | Existing exercise selected | Modify sets/reps/weight | Same reducer output |
| Delete exercise | Exercise in list | Remove it | State matches prior implementation |
| Reorder exercises | Multiple exercises | Drag to reorder | Final array identical |

## Regression Guard

Every PR MUST pass before running the next:
- `tsc --noEmit`: 0 errors
- `vitest run`: 150/150 tests passing
- Manual visual check for font/dark-mode/dashboard PRs

## Rollback

Each PR is independently revertable via `git revert <sha>`. If a regression surfaces, revert only the offending PR.
