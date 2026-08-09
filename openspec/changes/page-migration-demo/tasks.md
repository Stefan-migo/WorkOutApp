# Tasks: Page Migration Demo (PR 3 — design-system)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~590–730 total (3a ~140–180 + 3b ~250–300 + 3c ~200–250) |
| 400-line budget risk | High (total) — each slice stays ≤400 |
| Chained PRs recommended | Yes |
| Suggested split | Stacked slices 3a → 3b → 3c (per design line 167, proposal decision 2) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

User-approved exception: none needed — auto-chain policy; each slice stays ≤400 lines.

## Suggested Work Units (each a chained PR, stacked to `main` in order)

| Unit | Goal | Files | Focused test command | Runtime harness | Rollback boundary | Line budget |
|------|------|-------|----------------------|-----------------|-------------------|-------------|
| 3a | `/workouts` → Card/EmptyState/Button/IconButton (DD-A/DD-B/DD-G/DD-H) | `src/app/workouts/page.tsx` (mod) | `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` (unchanged, stays green as RED contract) | `npm run storybook` :6006 → UI/Card, UI/EmptyState, UI/Button, UI/IconButton + `npm run dev` smoke `/workouts` (cards, FAB, empty state, play) | Revert diff on `workouts/page.tsx` only — pure presentational swap, no other file touched | ≤180 |
| 3b | `/exercises` list surface → SearchInput/Card/EmptyState/Badge/Button/IconButton + L214 selector fix + FilterSelect preserved | `src/components/ExerciseSearchHeader.tsx` (mod), `src/app/exercises/page.tsx` (mod), `src/app/exercises/__tests__/ExercisesPage.test.tsx` (mod, L214 `textbox`→`searchbox`) | `npx vitest run src/app/exercises/__tests__/ExercisesPage.test.tsx` (RED: selector fix fails first) | `npm run storybook` :6006 → UI/SearchInput, UI/Card, UI/Badge + `npm run dev` smoke `/exercises` (search, filter dropdowns, favorites, card nav) | Revert diff on the 3 files — presentational swap + selector fix; FilterSelect byte-for-byte untouched | ≤300 |
| 3c | `/exercises` overlays → Dialog/Sheet, `dialogRef` → `open`/`onOpenChange` (DD-C..F, DD-J/K) | `Dialog.tsx` + `Dialog.stories.tsx` + `Dialog.test.tsx` (mod, `contained`), `ExerciseFormDialog.tsx` (mod), `AddToWorkoutModal.tsx` (mod), `src/app/exercises/page.tsx` (mod, `formOpen`), `src/app/exercises/[id]/page.tsx` (mod, minimal ripple), `src/components/__tests__/ExerciseFormDialog.test.tsx` (mod, prop swap + Cancel test) | RED `Dialog.test.tsx` + `ExerciseFormDialog.test.tsx`, then combined run (see Per-Slice Gates) | `npm run storybook` :6006 → UI/Dialog play (open/ESC/backdrop/focus-restore) + `npm run dev` smoke form/modal open-close, edit-from-detail | Revert Dialog props back to `dialogRef` + remove `contained`; `deleteDialogRef`/`ExerciseDeleteDialog` untouched | ≤250 |

Contingency: if 3c exceeds budget, split Dialog `contained` (DD-C) into its own leading PR before the overlay migration — order preserved.

## Per-Slice Gates (design lines 167–175; common: `npx tsc --noEmit` + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`)

| Slice | Slice tests (RED-first order) |
|-------|-------------------------------|
| 3a | `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` (unchanged, must stay green) |
| 3b | Fix L214 selector first (`searchbox`), then migrate; `npx vitest run src/app/exercises/__tests__/ExercisesPage.test.tsx` |
| 3c | RED: `ExerciseFormDialog.test.tsx` prop swap + new Cancel test; then `npx vitest run src/components/__tests__/ExerciseFormDialog.test.tsx src/app/exercises/__tests__/ExercisesPage.test.tsx "src/app/exercises/[id]/__tests__/page.test.tsx" src/components/ui/__tests__/Dialog.test.tsx` |

## Slice 3a — `/workouts` list (PR 3a)

Goal: migrate `workouts/page.tsx` to Card/EmptyState/Button/IconButton with token-only overrides; behavior identical (PMD-1, PMD-4).
Files: `src/app/workouts/page.tsx`. Focused test: `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx`.
Runtime harness: `npm run storybook` :6006 → UI/Card/EmptyState/Button/IconButton; `npm run dev` smoke `/workouts`. Rollback: revert `page.tsx` diff. Line budget: ≤180.

- [x] **3a.1** RED (behavior contract) — run `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` on current main; record baseline green (card click/Enter→edit, FAB, empty-state CTA) — this green suite is the RED contract the migration must preserve.
- [x] **3a.2** GREEN — Empty state (L54–70): `<EmptyState>` in `<div className="flex-1 flex items-center justify-center">`; `title="No workouts yet"` (h1→h2, DD-G), body unchanged, icon span `fitness_center text-[48px] text-muted` kept as `icon`; CTA `<Button onClick={() => router.push('/workouts/new')}>Create Workout</Button>`.
- [x] **3a.3** GREEN — Workout card (L112–119): `<Card interactive role="button" tabIndex={0} onClick={push edit} onKeyDown={Enter→push edit}>` + `p-16 flex flex-col gap-4 relative group` override (DD-A className-last); `closest('[role="button"]')` test passes.
- [x] **3a.4** GREEN — Play (L170–176): `<IconButton variant="primary" size="sm" aria-label={`Play ${w.title}`}>` + `absolute bottom-4 right-4 shadow-fab` (DD-B: sm = 36px exact; DD-I); icon span `text-[20px]` + `fontVariationSettings` kept; hover/active scale dropped.
- [x] **3a.5** GREEN — FAB (L199–205): `<Button variant="primary" pill elevated aria-label="Create workout">` + `fixed bottom-24 right-24 w-14 h-14 px-0 md:hidden z-50` (className-last overrides `h-11 px-4`); icon span `text-[24px]` kept.
- [x] **3a.6** GREEN — "New Workout" (L87–93): `<Button size="sm" onClick={push new}>`; icon span `text-[16px]` + text kept.
- [x] **3a.7** STAYS byte-for-byte — ⋮ menu (L120–167, spec non-goal), `TimelinePreview` (L14–28, TimelineStrip non-goal), search input (L76–85 incl. dead `font-body-md` classes), Type toggle (L94–103, DD-H — no Button selected-state).
- [x] **3a.8** Gate — `npx tsc --noEmit` + `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` + `npm run test:a11y` + `npm run audit:tokens` (rule 3 scans tests) + `npm run build-storybook`.

## Slice 3b — `/exercises` list surface (PR 3b)

Goal: migrate search header + list surface to SearchInput/Card/EmptyState/Badge/Button/IconButton; FilterSelect preserved byte-for-byte; selector fix RED-first (PMD-2, PMD-3, PMD-4).
Files: `src/components/ExerciseSearchHeader.tsx`, `src/app/exercises/page.tsx`, `src/app/exercises/__tests__/ExercisesPage.test.tsx`.
Focused test: `npx vitest run src/app/exercises/__tests__/ExercisesPage.test.tsx`.
Runtime harness: `npm run storybook` :6006 → UI/SearchInput/Card/Badge; `npm run dev` smoke `/exercises` (search, 6 filter dropdowns, favorites, card nav, star/assign).
Rollback: revert the 3-file diff. Line budget: ≤300.

- [ ] **3b.1** RED — `ExercisesPage.test.tsx` L214: `getByRole('textbox')` → `getByRole('searchbox')` (SearchInput is `type="search"`; only search input on page). Run slice test — fails against legacy `type="text"` input.
- [ ] **3b.2** GREEN — Search (L81–90): `<SearchInput label="Search" value={search} onChange={onSearchChange} placeholder="Search by name, muscle, or equipment..." />` in `<div className="w-full sm:flex-1">` (layout on wrapper — SearchInput className lands on inner field); leading icon removed (built-in); underline-minimal drift accepted (UIP-5).
- [ ] **3b.3** GREEN — "All" (L93–100): `<Button variant={!favoritesFilter ? 'primary' : 'ghost'} size="sm" pill onClick={() => onFavoritesFilterChange(false)}>All</Button>`; "Favorites" (L101–108): `<Button variant={favoritesFilter ? 'primary' : 'ghost'} size="sm" pill onClick={() => onFavoritesFilterChange(true)}>{favoritesFilter ? '★' : '☆'} Favorites</Button>` — exact text preserved (tests L163/170/189/206).
- [ ] **3b.4** GREEN — "New Exercise" (L133–138): `<Button size="sm" onClick={onCreate}>+ New Exercise</Button>`.
- [ ] **3b.5** STAYS byte-for-byte — `FilterSelect` def (L30–58) + usage (L115–128): PMD-2 "MUST NOT be duplicated further"; `ExerciseSearchHeader.test.tsx` stays green.
- [ ] **3b.6** GREEN — No-exercises empty (L192–202): `<EmptyState title="No exercises yet" body="Create your first one!" action={<Button onClick={openCreate}>Create Exercise</Button>} />`; no-results empty (L204–212): `<EmptyState title={isFavoritesEmpty ? 'No favorites yet — star exercises to add them' : 'No exercises match your filters.'} />` — exact strings (tests L192/217).
- [ ] **3b.7** GREEN — Grid card (L241–244): `<Card interactive onClick={() => router.push(\`/exercises/${ex.id}\`)}>` + `overflow-hidden group flex flex-col`; **`group` MUST stay** (`group-hover:` chips); no `role` added (keyboard-nav gap preserved, not introduced).
- [ ] **3b.8** STAYS — Image area (L247–253): inline `backgroundImage` + `aspect-[2/1]` wrapper + placeholder svg kept (test-asserted L253–255; audit-safe, no hex).
- [ ] **3b.9** GREEN — Star (L260–266): `<IconButton variant="ghost" size="sm" aria-label={isFavorite(ex.id) ? 'Remove from favorites' : 'Add to favorites'} onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id) }}>` + `absolute top-2 left-2 w-8 h-8 bg-surface/80 backdrop-blur shadow-fab` (DD-B 32px, DD-I); ★/☆ text preserved.
- [ ] **3b.10** GREEN — Assign (L268–276): `<IconButton variant="ghost" aria-label="Assign to workout" onClick={(e) => { e.stopPropagation(); setAssigningExercise(ex) }}>` + `absolute bottom-2 right-2 w-10 h-10 bg-surface/90 backdrop-blur shadow-fab hover:bg-accent hover:text-accent-on hover:scale-110 active:scale-95 transition-transform z-10` (DD-B 40px); svg child kept.
- [ ] **3b.11** GREEN — Badges (DD-I): category `<Badge tone="neutral" className="absolute top-2 right-2 bg-surface/80 backdrop-blur shadow-fab">{ex.category}</Badge>` (lowercase `strength` kept, test L270); force/mechanic hover chips `<Badge tone="neutral" className="bg-surface/90 backdrop-blur text-fg-2">` inside `opacity-0 group-hover:opacity-100` wrapper; difficulty `<Badge tone="primary" className="absolute bottom-2 left-2 bg-accent/80 backdrop-blur">` capitalized (tests `Beginner`/`Intermediate`); muscle chips `<Badge tone="neutral" className="px-1.5 py-0.5">{mg.toUpperCase()}</Badge>` + `+N` overflow (tests L239–245).
- [ ] **3b.12** Gate — `npx tsc --noEmit` + `npx vitest run src/app/exercises/__tests__/ExercisesPage.test.tsx` + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`.

## Slice 3c — `/exercises` overlays (PR 3c)

Goal: migrate form + add-to-workout overlays to Dialog/Sheet; `dialogRef` → `open`/`onOpenChange`; Dialog `contained` prop (DD-C..F, DD-J/K; PMD-2d, PMD-4).
Files: `src/components/ui/Dialog.tsx` + `Dialog.stories.tsx` + `__tests__/Dialog.test.tsx`, `src/components/ExerciseFormDialog.tsx`, `src/components/AddToWorkoutModal.tsx`, `src/app/exercises/page.tsx`, `src/app/exercises/[id]/page.tsx`, `src/components/__tests__/ExerciseFormDialog.test.tsx`.
Focused test: `npx vitest run src/components/__tests__/ExerciseFormDialog.test.tsx src/app/exercises/__tests__/ExercisesPage.test.tsx "src/app/exercises/[id]/__tests__/page.test.tsx" src/components/ui/__tests__/Dialog.test.tsx`.
Runtime harness: `npm run storybook` :6006 → UI/Dialog play (open/ESC/backdrop/focus-restore); `npm run dev` smoke form/modal open-close + edit-from-detail.
Rollback: revert Dialog props to `dialogRef` + remove `contained`; `deleteDialogRef`/`ExerciseDeleteDialog` untouched. Line budget: ≤250.

- [ ] **3c.1** RED — `Dialog.test.tsx` (DD-C): `contained` prop appends `max-h-[85vh] overflow-y-auto` to FIXED classes (sheet already `h-full`). Fails (no prop).
- [ ] **3c.2** RED — `ExerciseFormDialog.test.tsx`: swap `dialogRef: { current: null }` → `open: true, onOpenChange: vi.fn()` in `renderDialog` helper + 5 inline sites (L43 etc.); add test "calls onOpenChange(false) when Cancel is clicked". Fails (component still `dialogRef`).
- [ ] **3c.3** GREEN — `Dialog.tsx`: add `contained?: boolean` → append `max-h-[85vh] overflow-y-auto` to FIXED; `Dialog.stories.tsx` contained knob. (Open Q: prop on primitive vs usage-site className — decision log path is the prop.)
- [ ] **3c.4** GREEN — `ExerciseFormDialog.tsx`: `<dialog ref={dialogRef}>` → `<Dialog open={open} onOpenChange={onOpenChange} contained title={editingId ? 'Edit Exercise' : 'New Exercise'}>`; remove `<h3>` (DD-D — Dialog renders h2; tests L56/L62 still pass); Cancel → `<Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>`; Save/Create → `<Button variant="primary" size="sm" type="submit">` (DD-J; type=submit keeps tests L95–112); `<form data-testid="exercise-form">` + ALL internals byte-for-byte (DD-J); backdrop close NEW — accepted (DD-E, form state lifted).
- [ ] **3c.5** GREEN — `AddToWorkoutModal.tsx` (DD-F/K): keep `{ exercise, onClose }`; internal `const [open, setOpen] = useState(true)`; remove `useEffect` showModal (L20–22), `handleBackdrop` (L24–26), `dialogRef` (L16); `<Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose() }} variant="fixed" title={`Assign "${exercise.name}"`} className="p-6 max-h-[80vh]">`; Close `<IconButton variant="ghost" size="sm" aria-label="Close" className="absolute right-4 top-4">✕</IconButton>`; body byte-for-byte incl. dead typography classes (deferred tokens pass); legacy h2+✕ header (L72–77) removed; `max-w-lg` accepted (DD-K); Sheet unused this PR.
- [ ] **3c.6** GREEN — `src/app/exercises/page.tsx` controlled state: L41 `useRef` → `const [formOpen, setFormOpen] = useState(false)` (drop `useRef` import); `openCreate()` (L127–133) → `setForm(EMPTY_FORM); setEditingId(newId); setFormOpen(true)` (drop `showModal`); `handleSave` (L135–159) → `saveExercise(exercise); setFormOpen(false)` (drop `close`); usage (L327–337) → `<ExerciseFormDialog open={formOpen} onOpenChange={setFormOpen} ...>` (drop `onClose` + `dialogRef`).
- [ ] **3c.7** GREEN — `src/app/exercises/[id]/page.tsx` minimal ripple (L72/135/160/394–409): drop form `dialogRef` (L72); `openEdit()` (L135) drops `showModal` (`setForm(ed)` truthy → open); `handleSave` (L160) drops `close` (`setForm(null)` closes); usage → `open={form !== null} onOpenChange={(o) => { if (!o) setForm(null) }}`. **`deleteDialogRef` (L73) + `ExerciseDeleteDialog` (L411–420) stay UNTOUCHED** (PMD-2 delete-confirmation N/A — no surface). `[id]/__tests__/page.test.tsx`: no change (mock `vi.fn(() => null)`, L221 unaffected).
- [ ] **3c.8** Gate — `npx tsc --noEmit` + combined slice test (above) + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`.

## Dependency Order (for apply)

3a (`/workouts` — standalone page swap, nothing depends on it) → 3b (`/exercises` list surface; uses same primitives, selector fix independent) → 3c (overlays — last: touches Dialog primitive `contained`, both dialog components, and the `[id]` ripple). Each PR merges to `main` in order; per-PR gate identical (`npx tsc --noEmit` + slice tests + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook`).

Non-goals (do NOT implement): remaining pages (dashboard, sequences, history, calendar, stats, editors, play, auth, layouts); `DropdownMenu` primitive (⋮ menu stays inline); `FilterSelect` consolidation into a primitive (preserve only); `TimelineStrip` (TimelinePreview stays token-based); full `exercises/[id]` detail-page migration (only the 3c shared-overlay API ripple); **PMD-2 "Delete confirmation" — NOT APPLICABLE per user decision 2026-08-09 — no tasks, no test surface** (delete dialog lives in out-of-scope `[id]` page; `/exercises` list has none). No new runtime/dev dependencies.
