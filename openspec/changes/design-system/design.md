# Design: Design System for WorkOutApp — Happy Hues re-alignment

## Technical Approach

Re-aligned to the revised `design-system-foundation` spec (DSF-1..DSF-7). The Material 3 palette is
**replaced in full** by the Happy Hues dark-warm contract (user chose "Reemplazar tema completo
ahora"): `@theme` holds only the new palette + segment/timer remaps + unchanged font/spacing/size/
shadow tokens; the `prefers-color-scheme` variant is deleted (single dark-warm theme in all OS
modes); all ~49 files using Material-derived utilities migrate per the DSF-7 mapping; `audit:tokens`
is rebuilt to enforce the new contract; Storybook docs are rewritten; the a11y addon stays enabled.

Three-slice chained-PR structure is kept, now coherent with the palette swap:

1. **PR 1 (foundation)** — full palette replacement: `@theme` rewrite, DSF-7 migration of ~49 files
   (~970 Material utility instances + white/black/gray cleanups), `SEGMENT_COLORS` remap to CSS-var
   references, timer aliases, `audit:tokens` rebuild, `themeColor`, test updates, MDX docs, DSF-4
   i18n cleanup.
2. **PR 2 (primitives)** — `src/components/ui/` 8 primitives, stories, a11y checks (unchanged plan,
   token references updated to new roles).
3. **PR 3 (migration demo)** — `/workouts` + `/exercises` → primitives (unchanged plan).

No new runtime dependencies (dev-only: none beyond already-installed `@storybook/addon-a11y`).
Presentational refactor: **no data flow changes**. Reinforces CA-1 (body rule tokenized, dedupe).

## Architecture Decisions

### D1: Token architecture — full `@theme` replacement block

| Option | Tradeoff | Decision |
|---|---|---|
| Keep Material tokens, add Happy Hues alongside | Two palettes, DSF-1a violated (REPLACED, not extended), drift risk | ✗ |
| **Replace `@theme` in full, delete dark-mode media block** | Single source of truth; one big diff; matches user's "reemplazo completo" choice | ✓ |

Exact replacement for the colors section of `@theme` (font/spacing/size/shadow tokens untouched):

```css
/* Happy Hues dark-warm — SOLE palette (DSF-1) */
--color-bg: #55423d;
--color-surface: #271c19;
--color-surface-warm: color-mix(in srgb, #ffc0ad 14%, #55423d);
--color-fg: #fffffe;
--color-fg-2: #fff3ec;
--color-muted: color-mix(in srgb, #fff3ec 62%, #271c19);
--color-meta: #e78fb5;
--color-border: color-mix(in srgb, #fff3ec 24%, #55423d);
--color-border-soft: color-mix(in srgb, #fff3ec 12%, #55423d);
--color-accent: #ffc0ad;
--color-accent-on: #271c19;
--color-accent-hover: color-mix(in oklab, var(--color-accent), white 8%);
--color-accent-active: color-mix(in oklab, var(--color-accent), white 14%);
--color-success: #9dbf9c;
--color-warn: #e6a651;
--color-danger: #e07a7f;
--color-focus-ring: 0 0 0 4px rgba(255, 192, 173, 0.28); /* shadow value, see D4 */

/* Segment states → palette (DSF-2) */
--color-segment-prepare: color-mix(in srgb, var(--color-warn) 45%, var(--color-surface));
--color-segment-work: var(--color-success);
--color-segment-rest: var(--color-danger);
--color-segment-cooldown: color-mix(in srgb, var(--color-danger) 45%, var(--color-surface));

/* Timer aliases → palette (DSF-3) */
--color-timer-bg: var(--color-bg);
--color-timer-surface: var(--color-surface-warm);
--color-timer-on: var(--color-fg);
--color-timer-muted: var(--color-muted);
--color-timer-border: var(--color-border);
--color-timer-track: var(--color-surface);
```

**DELETED** (42 tokens + dark block): `--color-primary*` (8), `--color-secondary*` (8),
`--color-tertiary*` (8), `--color-error*` (4), `--color-background`/`--color-on-background`,
`--color-surface`/`--color-on-surface`/`--color-surface-dim`/`--color-surface-bright`/
`--color-surface-container*` (5)/`--color-surface-variant`/`--color-on-surface-variant`,
`--color-inverse-*` (3), `--color-outline`/`--color-outline-variant`/`--color-surface-tint`,
`--color-sidebar*` (5), `--color-primary-btn*` (3), `--color-on-primary-dark-bg`; the entire
`@media (prefers-color-scheme: dark)` block; old segment **values** (`#3b82f6`/`#10b981`/`#ef4444`/
`#8b5cf6` — names kept, values remapped) and old timer **values** (`#091426`, `rgba(255,255,255,…)`,
`#9ca3af`, `#1e293b` — names kept, become aliases).

**ADDED** (17): `bg`, `surface`, `surface-warm`, `fg`, `fg-2`, `muted`, `meta`, `border`,
`border-soft`, `accent`, `accent-on`, `accent-hover`, `accent-active`, `success`, `warn`, `danger`,
`focus-ring`. **KEPT**: `--font-headline/body/label`, all `--text-*`, `--spacing-*`,
`--shadow-card-hover`, `--shadow-fab`. **MODIFIED**: `--font-mono/--font-timer/--font-data` (D5).

Companion changes in `globals.css`: delete the dark media block; `body { background-color:
var(--color-bg); color: var(--color-fg-2); }` (CA-1a/1b updated); `.timer-dark-bg`/`.glass-panel-dark`
unchanged (they already reference timer tokens, now aliases); `.ambient-shadow` → `box-shadow:
var(--shadow-fab)` (removes the only raw rgba outside `@theme`; 16 call sites untouched); add
`@utility focus-ring` (D4).

### D2: `SEGMENT_COLORS` resolution — CSS-var reference strings (option a)

| Option | Tradeoff | Decision |
|---|---|---|
| Compute `color-mix` results statically (hexes in TS) | Re-duplicates palette values → DSF-2a drift returns; bakes hexes the audit must then whitelist | ✗ |
| **`SEGMENT_COLORS` holds `var(--color-segment-*)` strings; TimerRing renders stroke via inline `style`** | Zero duplication — SEGMENT_COLORS *is* a reference to `@theme`, drift impossible; jsdom asserts the var string; runtime resolution is native | ✓ |

```ts
export const SEGMENT_COLORS: Record<IntervalType, string> = {
  prepare: 'var(--color-segment-prepare)',
  work: 'var(--color-segment-work)',
  rest: 'var(--color-segment-rest)',
  rest_between_cycles: 'var(--color-segment-rest)',
  cooldown: 'var(--color-segment-cooldown)',
}
```

Rendering mechanism (DSF-2b): SVG **presentation attributes cannot resolve** `var()`/`color-mix`,
so `TimerRing` moves the stroke to CSS — `<circle style={{ stroke: ringColor }} …>` and the label
span already uses `style={{ color: ringColor }}` (inline styles resolve `var()` → `color-mix()` at
runtime in every modern browser). The four segment states stay pairwise distinct on `--color-bg`
(prepare amber-mix, work sage, rest rose, cooldown rose-mix). `SEGMENT_BG/BORDER/TEXT/BG_80/DOT`
class maps are untouched — their `bg-segment-*` utilities regenerate from the new token values.

### D3: Timer tokens — palette aliases (DSF-3)

Names kept, values become `var()` aliases (table above). `DSF-3b` scope expands to **all**
play-screen files touched by PR 1 (both play pages, TimerRing, TimerControls, RepCounter,
RepCompleteDialog, PlayHeader, ProgressBar, ExercisePanel, TimerDisplay): dark chrome maps to
`--color-timer-*` aliases, plus DSF-7 role tokens for any Material utility in the same files.

### D4: Focus ring — token + `@utility`

`--color-focus-ring` holds a **complete shadow** (per spec), so `ring-focus-ring` (a color utility)
would produce invalid CSS. Consumption path: register a variant-composable utility in `globals.css`
(repo pattern: plain classes; `@utility` is required for variant composition):

```css
@utility focus-ring {
  outline: none;
  box-shadow: var(--color-focus-ring);
}
```

DSF-7 maps every `focus-visible:ring-2 focus-visible:ring-secondary [focus-visible:outline-none]`
→ `focus-visible:focus-ring` (104 sites). The generated `bg/text/ring-focus-ring` color utilities
are dead but harmless.

### D5: Mono font switch — SF Mono chain

`--font-mono`, `--font-timer`, `--font-data` become:
`'SF Mono', ui-monospace, 'Cascadia Mono', 'JetBrains Mono', monospace`.

SF Mono is Apple-only; `ui-monospace` and Cascadia Mono cover Windows; the `next/font` JetBrains
Mono load in `layout.tsx` stays as the downloadable fallback (family name resolves in the chain).
The `--font-jetbrains-mono` var is dropped from the chains so SF Mono actually wins on Apple.

### D6: `audit:tokens` — rebuild rule set

Current script greps for the **new** names (`text-fg`, `bg-accent`…) — inverted and stale. Rebuild
as a 4-grep chain (existing `grep … || echo` + `&` structure preserved):

1. **No Material utilities** (whole `src` `*.tsx|*.ts`): zero matches for
   `text-on-surface|text-on-background|text-on-surface-variant|bg-surface-container|bg-surface-dim|
   bg-surface-bright|bg-surface-variant|border-outline-variant|border-outline|bg-primary|text-primary|
   bg-secondary|text-secondary|bg-primary-btn|text-on-primary|bg-error|text-error|ring-primary|
   ring-secondary|bg-sidebar|text-on-sidebar|bg-background|text-outline|bg-surface-tint|
   text-on-primary-container|bg-primary-container|bg-secondary-container|bg-error-container|
   text-on-error|text-on-error-container|text-on-primary-fixed`. (Do **not** ban `text-fg` —
   it is now a real utility.)
2. **No Material tokens in `@theme`** (`globals.css` only): zero matches for `--color-(primary|
   secondary|tertiary|error|background|on-background|on-surface|surface-container|surface-dim|
   surface-bright|surface-variant|inverse|outline|surface-tint|sidebar|primary-btn|
   on-primary-dark-bg)` and zero `prefers-color-scheme` (single-theme contract).
3. **No raw colors in components** (all `src` `*.tsx|*.ts` **excluding** `globals.css`, excluding
   lines containing `themeColor`): zero matches for `#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)`.
   `var(--color-*)` and `color-mix(...)` expressions are allowed by construction (they contain no
   raw hex/rgba literal at the top level).
4. **No second accent** (whole `src` `*.tsx|*.ts|*.mdx`): zero matches for
   `#3b82f6|#8b5cf6|bg-blue|text-blue|bg-purple|text-purple|bg-violet|text-violet|bg-indigo|
   text-indigo` (legacy segment hexes + Tailwind blue/purple utilities).

Gates: DSF-1b/7b (whole-src rule 1 + 2 after migration), DSF-1c/1d (rule 3 + 4), DSF-1d (rule 3's
`themeColor` carve-out). The `segment-styles.test.ts` drift test remains the 5th gate (T2).

### D7: Component migration — order and file set (DSF-7)

File set (authoritative): the 49 files matched by
`grep -rlE "<rule-1 pattern>" src --include="*.tsx" --include="*.ts"` (15 app pages incl.
`(auth)/login`, `layout.tsx`; 33 components incl. Nav, all overlays, all play files, stats/calendar
components; 1 lib consumer). Normative mapping (spec DSF-7 table, verbatim):

| Old (Material) | New role token |
|---|---|
| `bg-background` | `bg-bg` |
| `text-on-background`, `text-on-surface` | `text-fg-2` |
| `text-on-surface-variant` | `text-muted` |
| `bg-surface`, `bg-surface-container*`, `bg-surface-dim`, `bg-surface-variant` | `bg-surface` |
| `hover:bg-surface-container*` | `hover:bg-surface-warm` |
| `border-outline-variant` (default) | `border-border` |
| `border-outline-variant/10..30` | `border-border-soft` |
| `border-outline` | `border-border` |
| `bg-primary`, `bg-primary-btn`, `bg-primary/90` | `bg-accent` |
| `bg-primary-container`, `bg-secondary-container` (colored fills/dots) | `bg-accent` |
| `text-primary`, `hover:text-primary`, `text-secondary`, `hover:text-secondary` | `text-accent` |
| `text-on-primary`, `text-on-primary-btn`, `text-on-primary-dark-bg` | `text-accent-on` |
| `text-on-primary-container/…-fixed`, `text-on-secondary-container` | `text-accent-on` (on colored fills) / `text-fg-2` (on surface) |
| `bg-primary-btn-hover` | `hover:bg-accent-hover` |
| `bg-error`, `text-error`, `hover:bg-error` | `bg-danger`, `text-danger`, `hover:bg-danger` |
| `bg-error-container`, `text-on-error-container` (alerts/chips) | `bg-danger/15`, `text-danger` |
| `text-on-error` (saturated fills) | `text-accent-on` |
| `ring-primary`, `ring-secondary` (focus) | `focus-visible:focus-ring` |
| `bg-sidebar` / `text-on-sidebar*` | `bg-surface` / `text-fg-2` / `text-muted` |
| `bg-surface-tint` | `bg-surface` |
| `text-outline`, `text-outline-variant`, `placeholder:text-outline/50` | `text-muted` (+ opacity suffix kept) |
| `border-secondary`, `focus:border-secondary`, `bg-secondary-container/20` | `border-accent`, `focus:border-accent`, `bg-accent/20` |
| `bg-tertiary`, `bg-outline` | `bg-accent`, `bg-border` |

Unlisted Material roles map per the spec catch-all (surface for fills, fg-2 for text, muted for
secondary text, border for outlines, accent for emphasis, danger for errors).

**Play-screen whites/greys** (DSF-3b, in touched files only): `text-white`→`text-timer-on`,
`bg-white`→`bg-timer-on`, `text-gray-400`→`text-timer-muted`, `bg-[#1E293B]`→`bg-timer-track`,
`border-white/10`→`border-timer-border/50`, backdrop `bg-black/N`→`bg-surface/80` scrim.

**Migration order** (each phase a commit, gate after each: `npx tsc --noEmit` + `npm run audit:tokens`
+ touched-file vitest):
- **Phase A — token layer**: D1 globals.css rewrite + `@utility focus-ring` (app visually
  unstyled-with-old-classes until Phase B; commits are stacked in one PR).
- **Phase B — utilities-first**, family order (largest blast radius first): (1) text families →
  fg-2/muted; (2) surface/background → surface/surface-warm; (3) borders → border/border-soft;
  (4) accent/primary → accent/accent-on/accent-hover; (5) states → danger/danger-15/accent-on;
  (6) focus rings → focus-ring; (7) sidebar/Nav → surface/fg-2/muted; (8) play-screen whites/
  greys → timer tokens.
- **Phase C — inline styles**: any `style={{…}}` raw hex/rgba in touched files → `var(--color-*)`
  (rule 3 gate).
- **Phase D — themeColor + shell**: `layout.tsx` `themeColor: '#091426'` → `'#55423d'` (literal
  mirror of `--color-bg`, DSF-1d); `<body className="bg-background text-on-background">` →
  `bg-bg text-fg-2`.
- **Phase E — docs + i18n**: rewrite the 3 MDX pages; DSF-4 — RepCompleteDialog Spanish strings →
  English (it is a touched play-screen file).

### D8: Folder structure — flat `ui/` + barrel (unchanged from prior design)

`src/components/ui/Button.tsx` + `.stories.tsx` + `__tests__/` + `index.ts` barrel; SB glob
`../src/**/*.stories.@(…)` already matches.

### D9: Dialog — controlled native `<dialog>`, no headless lib (unchanged)

`open`→`showModal()`, `!open`→`close()`; backdrop click via `e.target === ref.current`; native
`cancel` (ESC) + `close` → `onClose`; `aria-labelledby`; sheet animation gated by
`prefers-reduced-motion`. Backdrop `bg-black/40` → `bg-surface/80` per the new contract.

### D10: Storybook tests via Vitest browser project (unchanged infra)

`test.projects = [unit (jsdom), storybook (playwright chromium)]` via `@storybook/addon-vitest`;
axe per story via installed `@storybook/addon-a11y` (DSF-6 — already registered in
`.storybook/main.ts`, verify only).

### D11: No variants factory, no `asChild`, no cva (unchanged)

Plain `Record<variant, string>` maps (repo pattern in `segment-styles.ts`); `'use client'` only
where hooks are used.

## Interfaces / Contracts

Primitive class maps re-tokened (PR 2 builds on the new palette):

```ts
// Button: primary: bg-accent text-accent-on hover:bg-accent-hover
//         ghost:   text-fg-2 hover:bg-surface-warm
//         outline: border border-border-soft text-fg-2 hover:bg-surface-warm
//         danger:  bg-danger text-accent-on hover:bg-danger/80
//         common:  … focus-visible:focus-ring
// Badge:  neutral: bg-surface text-muted border border-border-soft
//         primary: bg-accent text-accent-on
//         error:   bg-danger/15 text-danger
//         segment-*: bg-segment-*/10 text-segment-* (regenerate from new tokens)
// Card:   filled: bg-surface border border-border-soft; glass: .glass-card
//         hover:shadow-card-hover unchanged
// Dialog: backdrop bg-surface/80; fixed/sheet classes unchanged
```

`SEGMENT_COLORS` becomes `Record<IntervalType, string>` of `var(--color-segment-*)` strings
(D2). Everything else (`SEGMENT_BG` et al.) unchanged.

## Data Flow

```
Page state ──open/onClose──▶ Dialog ──showModal()/close()──▶ native <dialog>
                                  ◀──cancel/close event────┘ (focus trap/restore native)
```

No other data flow changes (presentational refactor).

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/globals.css` | Modify | D1: `@theme` colors replaced (17 added, 42 deleted, aliases), dark media block deleted, `body` → `bg`/`fg-2`, `.ambient-shadow` → `var(--shadow-fab)`, `@utility focus-ring` |
| `src/app/layout.tsx` | Modify | `themeColor: '#55423d'`; body `bg-bg text-fg-2` (DSF-1d) |
| `src/lib/segment-styles.ts` | Modify | `SEGMENT_COLORS` → `var(--color-segment-*)` strings (D2) |
| `src/components/TimerRing.tsx` | Modify | progress stroke → `style={{ stroke: ringColor }}` (presentation attr can't resolve var) |
| `src/components/__tests__/TimerRing.test.tsx` | Modify | hex-attr assertions → `style.stroke === 'var(--color-segment-*)'` + canonical resolution check |
| `src/lib/__tests__/segment-styles.test.ts` | Modify | drift test → reference-chain + terminal-resolution assertions (D2/T2) |
| `package.json` | Modify | `audit:tokens` rebuilt per D6 (4-grep chain) |
| 49 migrated files (15 pages incl. `(auth)/login`, `layout.tsx`, 33 components, play files, Nav, overlays) | Modify | DSF-7 mapping per D7 (Phase B/C) |
| `src/components/RepCompleteDialog.tsx` | Modify | Spanish strings → English (DSF-4) |
| `src/docs/Foundations/{Tokens,Colors,Typography}.mdx` | Modify | DSF-5 rewrite (D-doc section below) |
| `src/components/ui/*` (PR 2) + pages (PR 3) | Unchanged plan | see prior design's table; token references now per D11 contracts |

**Storybook docs (DSF-5)** — rewrite all three pages (existing pages show the old palette):
- `Tokens.mdx`: full table — 17 palette tokens (name, value, role), 4 segment tokens, 6 timer
  aliases, 2 shadow tokens; note the SF Mono chain; usage examples `bg-bg text-fg-2`, accent button,
  `focus-visible:focus-ring`.
- `Colors.mdx`: `ColorPalette` groups — Canvas (`bg`, `surface`, `surface-warm`), Ink (`fg`, `fg-2`,
  `muted`, `meta`), Lines (`border`, `border-soft`), Accent (`accent`, `accent-on`, `accent-hover`,
  `accent-active`), States (`success`, `warn`, `danger`), Segments (4), Timer aliases (6). **Accent
  discipline section (DSF-1c)**: ≤2 visible accent uses per screen, links count, accent never a page
  wash, `accent-on` accompanies every accent fill, no second accent (blue/purple anywhere).
- `Typography.mdx`: mono row → `'SF Mono', ui-monospace, 'Cascadia Mono', 'JetBrains Mono',
  monospace`; sample text "WorkOutApp — Inter, SF Mono"; warmth from cream/rose, not pink type.
- Docs show only palette hexes (the documented values) — never new hexes (DSF-5).

## Migration / Rollout

**PR 1** = Phases A–E above, one PR (user's "reemplazo completo ahora" choice). Default: everything
in PR 1. Rollout: stacked chained PRs PR 1 → PR 2 → PR 3 (each to main in order); per-file reverts;
the palette swap is spec-gated by `audit:tokens`.

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit (jsdom) | TimerRing: stroke/label resolve `var(--color-segment-*)` per interval; track `var(--color-timer-track)`; existing assertions updated | `TimerRing.test.tsx` |
| Drift | `SEGMENT_COLORS[i]` === `var(--color-segment-{key})`; each segment token resolves to canonical palette value (work→`#9dbf9c` via success, rest→`#e07a7f` via danger, prepare/cooldown→`color-mix(in srgb, #e6a651|#e07a7f 45%, #271c19)`) | rewritten `segment-styles.test.ts` |
| Audit | D6 rules 1–4 on the full migrated set | `npm run audit:tokens` |
| Regression | Existing suites (incl. page tests) keep passing — class-string swaps don't change queries | `npm test` + `npx tsc --noEmit` |
| Storybook | 3 MDX pages render current `@theme` values; axe per story (DSF-5/6) | `npm run build-storybook` |

## Estimation (for sdd-tasks)

| Work | Changed lines |
|---|---|
| Phase A token layer + layout + audit + tests | ~250–350 |
| Phase B–C migration (49 files, ~970 instances + whites/greys) | ~1,800–2,400 |
| Phase E docs + i18n | ~250–350 |
| **PR 1 total** | **~2,300–3,100** |

PR 2 (primitives ≈ 1,150) chains 2a–2d as before; PR 3 (~350–450) splits 3a/3b if needed.

## Open Questions

- **DSF-3 "No visual drift"** scenario cannot hold literally across an intentional palette swap
  (bg `#091426` → `#55423d`, surfaces re-toned). Interpret as "no drift beyond the intended palette
  change" — archive phase should amend the wording.
- **`--color-focus-ring` holds a shadow value** under a `--color-*` name (spec-mandated). Consumption
  via `@utility focus-ring` (D4); the generated color utilities are dead. Accept as spec-written.
- **Size vs budget**: PR 1 ≈ 5–8x the 400-line review budget by construction. If apply must chain,
  recommended boundary — PR 1a: Phase A + D + segment/timer remap + tests + audit + docs
  (small, verifiable; app renders unstyled until 1b merges — unavoidable given DSF-1a forbids
  keeping Material tokens as a bridge); PR 1b: Phase B–C migration split by family clusters
  (typography / surface+border / accent+state+focus / play-screen / sidebar+overlays, ~400-500
  lines each). Keep everything in PR 1 unless apply hits a hard review ceiling.
- **White/black/gray utilities** are not Material tokens; they are cleaned only in touched files
  (play screens → timer tokens, backdrops → `bg-surface/80`). Residual `text-white` outside touched
  files (none found beyond the 49) would be future work.
