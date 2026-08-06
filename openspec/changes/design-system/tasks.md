# Tasks: Design System for WorkOutApp — Happy Hues palette replacement (PR 1)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,300–3,100 (design: Phase A ~250–350, Phase B–C migration ~1,800–2,400, docs+i18n ~250–350) |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR 1 — design's 5 phases become work-unit commits |
| Delivery strategy | auto-chain |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

User-approved exception: PR 1 grows large ("PR 1 crece bastante, se re-verifica completo"); single PR, RDD review once at the end over the full candidate.

### Work Units (all in PR 1; each a commit batch)

| Unit | Goal | Focused test command | Runtime harness | Rollback boundary |
|------|------|---------------------|-----------------|-------------------|
| T-A | @theme replacement | grep globals.css (no Material tokens, no prefers-color-scheme) + tsc | `npm run dev` (unstyled until E1 — expected) | revert globals.css diff |
| T-B | audit:tokens rebuild | `npm run audit:tokens` (RED until E5) | N/A — static script | revert package.json |
| T-C | segments + TimerRing | `npx vitest run src/lib/__tests__/segment-styles.test.ts src/components/__tests__/TimerRing.test.tsx` | `npm run dev` play screen | revert 2 files |
| T-D | layout themeColor | grep layout.tsx + tsc | `npm run dev` browser chrome | revert layout.tsx |
| T-E1..E5 | component migration | touched-file vitest + tsc + audit | `npm run dev` visual smoke per family | per-file reverts |
| T-F | MDX docs rewrite | `npm run build-storybook` | Storybook 6006 | revert src/docs/Foundations/ |
| T-G | final gate | `npm test` + `npm run audit:tokens` + build | N/A — CI-equivalent | none (end of PR) |

## PR 1 — Happy Hues palette replacement (one PR; all tasks below)

### T-A — Token layer (`src/app/globals.css`)

- [x] **T-A1** Replace `@theme` colors with design D1 block verbatim: add 17 palette tokens (`--color-bg #55423d`; `surface #271c19`; `surface-warm color-mix(in srgb,#ffc0ad 14%,#55423d)`; `fg #fffffe`; `fg-2 #fff3ec`; `muted color-mix(in srgb,#fff3ec 62%,#271c19)`; `meta #e78fb5`; `border color-mix(in srgb,#fff3ec 24%,#55423d)`; `border-soft color-mix(in srgb,#fff3ec 12%,#55423d)`; `accent #ffc0ad`; `accent-on #271c19`; `accent-hover color-mix(in oklab,var(--color-accent),white 8%)`; `accent-active color-mix(in oklab,var(--color-accent),white 14%)`; `success #9dbf9c`; `warn #e6a651`; `danger #e07a7f`; `focus-ring 0 0 0 4px rgba(255,192,173,0.28)`); remap segment tokens (prepare `color-mix(in srgb,var(--color-warn) 45%,var(--color-surface))`, work `var(--color-success)`, rest `var(--color-danger)`, cooldown `color-mix(in srgb,var(--color-danger) 45%,var(--color-surface))`); timer tokens → aliases (bg→`var(--color-bg)`, surface→`var(--color-surface-warm)`, on→`var(--color-fg)`, muted→`var(--color-muted)`, border→`var(--color-border)`, track→`var(--color-surface)`).
- [x] **T-A2** Delete all 42 Material token families (primary*/secondary*/tertiary*/error*/background/on-background/surface*/inverse*/outline*/surface-tint/sidebar*/primary-btn*/on-primary-dark-bg) + entire `@media (prefers-color-scheme: dark)` block; `body` → `var(--color-bg)`/`var(--color-fg-2)`; `.ambient-shadow` → `box-shadow: var(--shadow-fab)`; add `@utility focus-ring { outline:none; box-shadow: var(--color-focus-ring); }`; `--font-mono/--font-timer/--font-data` → `'SF Mono', ui-monospace, 'Cascadia Mono', 'JetBrains Mono', monospace` (drop `--font-jetbrains-mono` var from chains).
- **DoD**: grep `src/app/globals.css` → zero Material tokens (`--color-(primary|secondary|tertiary|error|background|on-surface|surface-container|surface-dim|surface-bright|surface-variant|inverse|outline|surface-tint|sidebar|primary-btn|on-primary-dark-bg)`) and zero `prefers-color-scheme`; `npx tsc --noEmit` passes; segment drift test RED (expected — proves the swap).

### T-B — audit:tokens rebuild (`package.json`)

- [x] **T-B1** Rebuild `audit:tokens` as D6 4-grep chain: (1) no Material utilities whole-src `*.tsx|*.ts` (D6 regex; do NOT ban `text-fg` — now a real utility); (2) no Material tokens + no `prefers-color-scheme` in globals.css; (3) no raw `#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)` in src `*.tsx|*.ts` except globals.css + lines containing `themeColor`; (4) no second accent (`#3b82f6|#8b5cf6|bg-blue|text-blue|bg-purple|text-purple|bg-violet|text-violet|bg-indigo|text-indigo`). DoD: `npm run audit:tokens` fails NOW on rules 1–2 (proves detector) — stays RED until E5.
- [x] **T-B2** RED — add `src/lib/__tests__/token-audit.test.ts` (contract-lock): read globals.css + scan `src/**/*.{ts,tsx}`; assert zero Material token names/utilities, zero `prefers-color-scheme`, zero raw hex outside `@theme`/`themeColor` mirror, zero blue/purple. DoD: fails for the right reasons now; GREEN only at T-G.

### T-C — Segments + TimerRing (RED → GREEN)

- [x] **T-C1** RED — rewrite `src/lib/__tests__/segment-styles.test.ts` (DSF-2a): `SEGMENT_COLORS[i]` === `var(--color-segment-{key})` per `IntervalType` (rest_between_cycles→rest) + terminal resolution: work→`#9dbf9c`, rest→`#e07a7f`, prepare→`color-mix(in srgb, #e6a651 45%, #271c19)`, cooldown→`color-mix(in srgb, #e07a7f 45%, #271c19)`. Run → fails.
- [x] **T-C2** RED — update `src/components/__tests__/TimerRing.test.tsx` (DSF-2b): progress circle `style.stroke === 'var(--color-segment-*)'` per interval, label span `style.color` same, track `var(--color-timer-track)`; drop hex `toHaveAttribute('stroke', …)` assertions. Run → fails.
- [x] **T-C3** GREEN — `src/lib/segment-styles.ts`: `SEGMENT_COLORS` → var-reference strings per D2 (prepare/work/rest/rest_between_cycles/cooldown → `var(--color-segment-*)`).
- [x] **T-C4** GREEN — `src/components/TimerRing.tsx`: progress circle `stroke={ringColor}` → `style={{ stroke: ringColor }}` (SVG presentation attrs can't resolve `var()`/`color-mix`).
- **DoD**: `npx vitest run src/lib/__tests__/segment-styles.test.ts src/components/__tests__/TimerRing.test.tsx` green.

### T-D — Shell (`src/app/layout.tsx`)

- [x] **T-D1** `themeColor: '#091426'` → `'#55423d'` (literal mirror of `--color-bg`, DSF-1d); `<body className="bg-background text-on-background">` → `bg-bg text-fg-2`. DoD: grep → `themeColor: '#55423d'`; tsc clean; layout.tsx excluded from E1/E2 sweeps.

### T-E — Component migration (DSF-7) — 49-file set

Authoritative set (D6 rule-1 grep): 15 pages in `src/app/` — `(auth)/login`, `exercises/[id]`, `exercises`, `history/[id]`, `history`, `layout` (→T-D), `page`, `sequences/[id]/play`, `sequences/new`, `sequences`, `workouts/[id]/edit`, `workouts/[id]/play`, `workouts/[id]/preview`, `workouts/new`, `workouts`; 34 components in `src/components/` — AddToWorkoutModal, ConsistencyHeatmap, DayAssignmentModal, DayRow, ErrorBoundary, ExerciseDeleteDialog, ExerciseFormDialog, ExercisePanel, ExercisePicker, ExerciseSearchHeader, HeroCard, IntervalDetailSheet, IntervalEditModal, IntervalRow, MiniCalendar, Nav, ProgressBar, QuickActions, RepCompleteDialog, RepCounter, StatsDashboard, StrainGauge, TagChips, TemplatesPanel, TimelineStrip, TimerControls, TimerDisplay, TodaysFocus, UpcomingList, UpNextCard, VolumeChart, WeekNav, WorkoutBuilder, WorkoutEditor. Files may appear in several clusters (family sweeps). Gate after each cluster: `npx tsc --noEmit` + `npm run audit:tokens` (cluster files clean on rules 1/3/4) + touched-file vitest.

- [x] **T-E1** surface/background/text family — full set minus layout.tsx: `text-on-surface`/`text-on-background`→`text-fg-2`, `text-on-surface-variant`→`text-muted`, `bg-surface-container*`/`bg-surface-dim`/`bg-surface-bright`/`bg-surface-variant`→`bg-surface`, `hover:bg-surface-container*`→`hover:bg-surface-warm`, `bg-background`→`bg-bg`.
- [x] **T-E2** primary/accent family — full set minus layout.tsx: `bg-primary`/`bg-primary-btn`/`bg-primary/90`/`bg-primary-container`/`bg-secondary-container`→`bg-accent`, `text-primary`/`hover:text-primary`/`text-secondary`/`hover:text-secondary`→`text-accent`, `text-on-primary`/`text-on-primary-btn`/`text-on-primary-dark-bg`→`text-accent-on` (on fills) / `text-fg-2` (on surface), `bg-primary-btn-hover`→`hover:bg-accent-hover`, `border-secondary`/`focus:border-secondary`/`bg-secondary-container/20`→`border-accent`/`focus:border-accent`/`bg-accent/20`.
- [x] **T-E3** border/outline family — 32 files (login, exercises/[id], exercises, history/[id], history, sequences/new, sequences, workouts/[id]/preview, workouts + AddToWorkoutModal, DayAssignmentModal, DayRow, ExerciseDeleteDialog, ExerciseFormDialog, ExercisePanel, ExercisePicker, ExerciseSearchHeader, HeroCard, IntervalDetailSheet, IntervalEditModal, IntervalRow, MiniCalendar, Nav, StatsDashboard, TagChips, TemplatesPanel, TodaysFocus, UpcomingList, UpNextCard, VolumeChart, WorkoutBuilder, WorkoutEditor): `border-outline-variant` (default)→`border-border`, `…/10..30`→`border-border-soft`, `border-outline`→`border-border`, `text-outline`/`text-outline-variant`/`placeholder:text-outline/50`→`text-muted` (opacity suffix kept), `bg-surface-tint`→`bg-surface`.
- [x] **T-E4** sidebar + timer/play-screen + inline styles: `Nav.tsx` (`bg-sidebar`→`bg-surface`, `text-on-sidebar*`→`text-fg-2`/`text-muted`); play-screen whites/greys → timer tokens in `sequences/[id]/play/page.tsx`, `workouts/[id]/play/page.tsx`, TimerControls.tsx, RepCounter.tsx, RepCompleteDialog.tsx, PlayHeader.tsx, ProgressBar.tsx, ExercisePanel.tsx, TimerDisplay.tsx (`text-white`→`text-timer-on`, `bg-white`→`bg-timer-on`, `text-gray-400`→`text-timer-muted`, `bg-[#1E293B]`→`bg-timer-track`, `border-white/10`→`border-timer-border/50`, backdrop `bg-black/N`→`bg-surface/80`); any `style={{…}}` raw hex/rgba in touched files → `var(--color-*)` (rule 3); RepCompleteDialog Spanish UI strings → English (DSF-4).
- [x] **T-E5** states/focus/catch-all — 26 files (login, exercises/[id], exercises, history/[id], history, sequences/new, sequences, workouts + DayAssignmentModal, ErrorBoundary, ExerciseDeleteDialog, ExerciseFormDialog, ExercisePicker, ExerciseSearchHeader, HeroCard, IntervalDetailSheet, IntervalEditModal, IntervalRow, QuickActions, StatsDashboard, TagChips, TemplatesPanel, TimerDisplay, UpNextCard, WorkoutBuilder, WorkoutEditor): `bg-error`/`text-error`/`hover:bg-error`→`bg-danger`/`text-danger`/`hover:bg-danger`, `bg-error-container`→`bg-danger/15`, `text-on-error` (fills)→`text-accent-on`, `ring-primary`/`ring-secondary`→`focus-visible:focus-ring` (104 sites); catch-all pass: any remaining Material utility in the set per DSF-7 mapping + spec catch-all (surface/fg-2/muted/border/accent/danger analogs). DoD: `npm run audit:tokens` fully GREEN.
- **DoD (T-E total)**: rules 1/3/4 grep-clean on the set; touched suites pass; `npm test` passes.

### T-F — Storybook docs (`src/docs/Foundations/`)

- [x] **T-F1** Rewrite `Tokens.mdx` (DSF-5): 17 palette + 4 segment + 6 timer-alias + 2 shadow tokens (name/value/role); SF Mono chain note; usage examples `bg-bg text-fg-2`, accent button, `focus-visible:focus-ring`.
- [x] **T-F2** Rewrite `Colors.mdx`: ColorPalette groups Canvas (`bg`/`surface`/`surface-warm`), Ink (`fg`/`fg-2`/`muted`/`meta`), Lines (`border`/`border-soft`), Accent (`accent`/`accent-on`/`accent-hover`/`accent-active`), States (`success`/`warn`/`danger`), Segments (4), Timer (6); accent-discipline section (DSF-1c: ≤2 accents per screen incl. links, accent never a page wash, `accent-on` with every fill, no blue/purple); documented values MUST equal `@theme` definitions — no new hexes.
- [x] **T-F3** Rewrite `Typography.mdx`: mono row → `'SF Mono', ui-monospace, 'Cascadia Mono', 'JetBrains Mono', monospace`; sample "WorkOutApp — Inter, SF Mono"; warmth from cream/rose, not pink type.
- **DoD**: `npm run build-storybook` OK; `@storybook/addon-a11y` + mdx glob already in `.storybook/main.ts` (DSF-6 — verify only); grep docs → no hex outside the palette list.

### T-G — Final verification gate (PR 1)

- [x] **T-G1** `npx tsc --noEmit` clean.
- [x] **T-G2** `npm test` green — full suite (unit + segment drift + TimerRing + token-audit contract-lock from T-B2 + page tests).
- [x] **T-G3** `npm run audit:tokens` exits 0 (all 4 rules, whole src).
- [x] **T-G4** `npm run build` + `npm run build-storybook` succeed.
- [x] **T-G5** Grep all touched files for Spanish UI strings → none (DSF-4); manual `npm run dev` smoke — timer play screen renders warm palette, 4 segment states pairwise distinct on `--color-bg`.

Commits (work units, in order): `feat(tokens): replace @theme with Happy Hues palette + timer aliases` → `chore(audit): rebuild audit:tokens for Happy Hues contract` → `fix(segments): SEGMENT_COLORS → @theme var refs; TimerRing inline stroke` → `feat(layout): themeColor mirrors --color-bg` → `refactor(styles): migrate text/surface/bg families` → `refactor(styles): migrate accent/primary families` → `refactor(styles): migrate border/outline families` → `refactor(styles): migrate sidebar + play-screen to timer tokens` → `refactor(styles): migrate states/focus + catch-all + i18n` → `docs(storybook): rewrite Foundations MDX to Happy Hues` → `test(audit): lock Happy Hues contract`.

## Dependency Order (for apply)

T-A → T-B → T-C (needs T-A token values) → T-D → T-E1 → T-E2 → T-E3 → T-E4 → T-E5 → T-F → T-G. Non-goals (do NOT implement): PR 2 primitives (Button/Card/Badge/EmptyState/Input/SearchInput/Dialog) and PR 3 page-demo migration — re-plan those at their launch (design D8–D11 hold their contracts); shadcn/ui, Chromatic, addon-designs, test-runner, theme toggle, light theme.
