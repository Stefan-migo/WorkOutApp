# Design: PR 3 — Page Migration Demo

## Technical Approach

Migrate `/workouts` and `/exercises` from inline styles to the 8 `ui/` primitives (PR 2) + tokens, proving the migration workflow before the remaining ~14 pages. Delivered as 3 stacked concern-slices (3a → 3b → 3c), each its own PR merged to `main` in order, each ≤400 changed lines, strict TDD RED-first, gated identically (tsc + slice tests + `test:a11y` + `audit:tokens` + `build-storybook`). Presentational refactor only — filter/search logic, data flow, and page state stay untouched except the 3c controlled-state refactor (`dialogRef` → `open`/`onOpenChange`).

**Verified primitive contract (read from source, not memory)**: every primitive joins `[BASE, variant map, size map, flags, className]` with `className` **last** → usage-site overrides win over size/base classes. This is the mechanism for all size/shape overrides below (FAB `w-14 h-14 px-0`, star `w-8 h-8`, assign `w-10 h-10`, modal `p-6`).

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| DD-A | Override pattern | `className` appended last (verified in all 6 primitives) → overrides via className | No primitive size API added; proposal decision 3 (accepted drifts) |
| DD-B | IconButton sizes | Play = `size="sm"` (h-9 w-9 = 36px, exact match); star = `sm` + `w-8 h-8` (32px kept); assign = `md` + `w-10 h-10` (40px kept) | Proposal decision 3: sizes preserved via className overrides |
| DD-C | Dialog extension | Add `contained?: boolean` to DialogProps → appends `max-h-[85vh] overflow-y-auto` to FIXED | 432-line form needs scroll; proposal decision-log path ("extend Dialog with max-h/overflow in 3c (contained)") |
| DD-D | Form heading | Remove form's `<h3>`; pass `title` to Dialog (renders h2) | UIP-6 Dialog always renders h2; text tests (`New Exercise`/`Edit Exercise`) still pass; accent→fg-2 color drift accepted |
| DD-E | Backdrop close (form) | ACCEPTED — UIP-6 standard | Form state is lifted (`form`/`onFormChange` in page) → backdrop close loses nothing; consistent with modal's existing backdrop close |
| DD-F | AddToWorkoutModal API | Props stay `{ exercise, onClose }`; internal `useState(true)` open; `onOpenChange(false)` → `onClose()` | Zero parent ripple (both call sites unchanged); modal only renders while mounted |
| DD-G | EmptyState heading | EmptyState `title` renders h2 (was h1 on /workouts) | UIP-5 fixed primitive; single-theme precedent (PR 2 design DD-8 note) |
| DD-H | workouts Type toggle | STAYS inline | Button has no selected/two-state variant; PMD-1c covers FAB/primary actions only |
| DD-I | Shadow discipline | Overlay chips/buttons use token `shadow-fab` (drop `shadow-md`/`shadow-sm`) | Token-only rule (PMD constraint); `--shadow-fab` exists in `@theme` |
| DD-J | 3c form internals | Form body (inputs/selects/TagChips/preview) NOT migrated to Input/Badge primitives | Would balloon the 3c diff; only the `<dialog>` container, heading, and action buttons migrate (PMD-2d = overlay container) |
| DD-K | Modal width | Accept `max-w-lg` (512px) vs legacy `max-w-[520px]` | 8px diff, not test-asserted; lazy |

## Per-Slice Design

### Slice 3a — `/workouts` (src/app/workouts/page.tsx, ~140–180 lines)

| Legacy element (lines) | Primitive + props | className override | Notes |
|---|---|---|---|
| Empty state wrapper (L56–68) | `<EmptyState>` inside `<div className="flex-1 flex items-center justify-center">` | — | `title="No workouts yet"` (h1→h2, DD-G); `body="Create your first workout to start tracking your training sessions and progress."` (unchanged); icon span `fitness_center text-[48px] text-muted` kept as `icon` (child class wins over EmptyState `text-meta` container) |
| Empty CTA (L62–67) | `<Button>` | — | `variant="primary"` (default), `onClick={() => router.push('/workouts/new')}`, children `Create Workout`; test `getByRole('button', { name: /create/i })` passes |
| Workout card (L112–119) | `<Card interactive role="button" tabIndex={0} onClick={push edit} onKeyDown={Enter→push edit}>` | `p-16 flex flex-col gap-4 relative group` | Card default `rounded-xl bg-surface border border-border-soft`; interactive adds `cursor-pointer hover:border-border hover:shadow-card-hover`; test `closest('[role="button"]')` passes |
| Play (L170–176) | `<IconButton variant="primary" size="sm" aria-label={`Play ${w.title}`}>` | `absolute bottom-4 right-4 shadow-fab` | `sm` = h-9 w-9 = exact 36px; icon span `text-[20px]` + `fontVariationSettings` kept; hover/active scale dropped (drift, DD-I) |
| FAB (L199–205) | `<Button variant="primary" pill elevated aria-label="Create workout">` | `fixed bottom-24 right-24 w-14 h-14 px-0 md:hidden z-50` | `w-14 h-14 px-0` override md `h-11 px-4` (className-last); `pill`+`elevated` → `rounded-full shadow-fab`; icon span `text-[24px]` kept; test `getByLabelText(/create workout/i)` passes |
| "New Workout" (L87–93) | `<Button size="sm" onClick={push new}>` | — | `sm` h-9 px-3 ≈ legacy py-2 height; icon span `text-[16px]` + text kept; Button base already `inline-flex gap-2` |

**STAYS byte-for-byte**: ⋮ menu (L120–167 — spec non-goal), `TimelinePreview` (L14–28), search input (L76–85 — PMD-1 doesn't require it), Type toggle (L94–103 — DD-H). Note: workouts search keeps its dead `font-body-md` classes (pre-existing, untouched).

### Slice 3b — `/exercises` list surface (~250–300 lines)

**ExerciseSearchHeader.tsx:**

| Legacy element (lines) | Primitive + props | className override | Notes |
|---|---|---|---|
| Search (L81–90) | `<SearchInput label="Search" value={search} onChange={onSearchChange} placeholder="Search by name, muscle, or equipment..." />` wrapped in `<div className="w-full sm:flex-1">` | — | SearchInput `className` lands on the inner field, so layout goes on the wrapper div; leading search icon removed (built-in); underline-minimal look drifts to standard field (accepted UIP-5, proposal log); `type="search"` → role `searchbox` |
| "All" toggle (L93–100) | `<Button variant={!favoritesFilter ? 'primary' : 'ghost'} size="sm" pill onClick={() => onFavoritesFilterChange(false)}>All</Button>` | — | ghost = `text-fg-2 hover:bg-surface-warm` = legacy inactive; primary = active |
| "Favorites" toggle (L101–108) | `<Button variant={favoritesFilter ? 'primary' : 'ghost'} size="sm" pill onClick={() => onFavoritesFilterChange(true)}>{favoritesFilter ? '★' : '☆'} Favorites</Button>` | — | Exact text `☆ Favorites` preserved → tests pass (L163, L170, L189, L206) |
| "New Exercise" (L133–138) | `<Button size="sm" onClick={onCreate}>+ New Exercise</Button>` | — | primary default; legacy px-4 py-2 → sm |
| FilterSelect def (L30–58) + usage (L115–128) | **PRESERVED byte-for-byte** | — | PMD-2 "MUST NOT be duplicated further"; behavior preserved (tests: filter dropdowns, Force filter) |

**src/app/exercises/page.tsx:**

| Legacy element (lines) | Primitive + props | className override | Notes |
|---|---|---|---|
| No-exercises empty (L192–202) | `<EmptyState title="No exercises yet" body="Create your first one!" action={<Button onClick={openCreate}>Create Exercise</Button>} />` | — | py-[64px] ≈ EmptyState py-16; no test asserts these strings |
| No-results empty (L204–212) | `<EmptyState title={isFavoritesEmpty ? 'No favorites yet — star exercises to add them' : 'No exercises match your filters.'} />` | — | Exact strings → tests `/no favorites yet/i` (L192) and `/no exercises match/i` (L217) pass |
| Grid card (L241–244) | `<Card interactive onClick={() => router.push(\`/exercises/${ex.id}\`)}>` | `overflow-hidden group flex flex-col` | interactive hover shadow; **`group` MUST stay** (hover-chip wrapper uses `group-hover:`); no role added (matches today — keyboard nav gap preserved, not introduced) |
| Image area (L247–253) | stays inline `<div className="relative aspect-[2/1] bg-surface overflow-hidden flex items-center justify-center">` | — | Inline `backgroundImage` style KEPT (data-driven URL, test-asserted L253–255); audit-safe (no hex) |
| Star (L260–266) | `<IconButton variant="ghost" size="sm" aria-label={isFavorite(ex.id) ? 'Remove from favorites' : 'Add to favorites'} onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id) }}>` | `absolute top-2 left-2 w-8 h-8 bg-surface/80 backdrop-blur shadow-fab` | `w-8 h-8` override (32px, DD-B); ★/☆ text preserved → star tests pass; `stopPropagation` preserved |
| Assign (L268–276) | `<IconButton variant="ghost" aria-label="Assign to workout" onClick={(e) => { e.stopPropagation(); setAssigningExercise(ex) }}>` | `absolute bottom-2 right-2 w-10 h-10 bg-surface/90 backdrop-blur shadow-fab hover:bg-accent hover:text-accent-on hover:scale-110 active:scale-95 transition-transform z-10` | `w-10 h-10` override (40px, DD-B); svg child kept; aria-label + stopPropagation preserved → quick-assign tests pass |
| Category badge (L278–280) | `<Badge tone="neutral" className="absolute top-2 right-2 bg-surface/80 backdrop-blur shadow-fab">{ex.category}</Badge>` | as shown | **text lowercase `strength` preserved** → test `getAllByText('strength')` (L270) passes; pill/12px/bold drift accepted |
| Force/mechanic hover chips (L283–293) | `<Badge tone="neutral" className="bg-surface/90 backdrop-blur text-fg-2">{ex.force}</Badge>` (same for mechanic) | as shown | `text-fg-2` override neutral's `text-muted`; wrapper `opacity-0 group-hover:opacity-100` stays |
| Difficulty (L295–299) | `<Badge tone="primary" className="absolute bottom-2 left-2 bg-accent/80 backdrop-blur">{ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}</Badge>` | as shown | primary = `bg-accent text-accent-on` = exact legacy colors; capitalized text → tests `getByText('Beginner'/'Intermediate')` pass |
| Muscle chips + overflow (L305–314) | `<Badge tone="neutral" className="px-1.5 py-0.5">{mg.toUpperCase()}</Badge>` and `+{overflow}` variant | as shown | uppercase text → tests (L239–245) pass |

**Test selector fix (RED first)**: `ExercisesPage.test.tsx:214` `getByRole('textbox')` → `getByRole('searchbox')` (SearchInput `type="search"`; only search input on the page).

### Slice 3c — `/exercises` overlays (~200–250 lines)

**Dialog API migration contract** (proposal decision 3 — Dialog has no ref passthrough):

```
ExerciseFormDialogProps (new):
  open: boolean                     // replaces dialogRef + onClose
  onOpenChange: (open: boolean) => void
  form, onFormChange, editingId, onSave, allMuscleGroups, allEquipment, onImageUpload?  // unchanged
```

**Dialog extension (DD-C)**: `DialogProps` + `contained?: boolean`; when true, append `max-h-[85vh] overflow-y-auto` to the FIXED classes (sheet is already `h-full`). Updates: `Dialog.tsx`, `Dialog.stories.tsx` (contained knob), `Dialog.test.tsx` (asserts `max-h-[85vh]` class present). Alternative rejected: usage-site `className="max-h-[85vh] overflow-y-auto"` only — works, but every future long-form consumer would re-specify it; the recorded decision log path is the prop.

**ExerciseFormDialog.tsx** (432 lines):
- `<dialog ref={dialogRef} ... onClose={onClose}>` → `<Dialog open={open} onOpenChange={onOpenChange} contained title={editingId ? 'Edit Exercise' : 'New Exercise'}>`.
- Remove `<h3>` heading (DD-D) — Dialog renders the h2 title; tests L56/L62 (`getByText('New Exercise'/'Edit Exercise')`) still pass.
- Actions: Cancel → `<Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>`; Save/Create → `<Button variant="primary" size="sm" type="submit">{editingId ? 'Save' : 'Create'}</Button>` (type=submit keeps form submit → tests L95–112 pass).
- `<form data-testid="exercise-form">` + ALL form internals unchanged (DD-J); `data-testid` preserved (tests L89, L174).
- Backdrop-click-to-close is NEW for the form dialog — accepted (DD-E).

**Where open state lives**: `exercises/page.tsx` (form state already lives there).
- `const dialogRef = useRef(...)` (L41) → `const [formOpen, setFormOpen] = useState(false)`; drop `useRef` import.
- `openCreate()` (L127–133): `setForm(EMPTY_FORM); setEditingId(newId); setFormOpen(true)` (drop `showModal`).
- `handleSave` (L135–159): `saveExercise(exercise); setFormOpen(false)` (drop `close`).
- Usage (L327–337): `<ExerciseFormDialog open={formOpen} onOpenChange={setFormOpen} ...>` (drop `onClose` + `dialogRef`).

**`exercises/[id]/page.tsx` ripple (minimal, L72/135/160/394–409)**:
- `openEdit()` (L135): drop `dialogRef.current?.showModal()` — `setForm(ed)` already makes `form` truthy → open.
- `handleSave` (L160): drop `dialogRef.current?.close()` — `setForm(null)` (L161) already closes.
- Usage (L394–409): `<ExerciseFormDialog open={form !== null} onOpenChange={(o) => { if (!o) setForm(null) }} ...>`.
- Remove `const dialogRef = useRef<HTMLDialogElement>(null)` (L72). **`deleteDialogRef` (L73) and `ExerciseDeleteDialog` (L411–420) stay untouched** (out of scope; PMD-2 delete-confirmation N/A per spec-confirmation).
- `[id]/__tests__/page.test.tsx`: no change needed — `ExerciseFormDialog` is mocked `vi.fn(() => null)`; `toHaveBeenCalled` (L221) unaffected by prop change.

**AddToWorkoutModal.tsx** (154 lines) — keeps `{ exercise, onClose }` API (DD-F):
- Internal `const [open, setOpen] = useState(true)`; remove `useEffect` showModal (L20–22), `handleBackdrop` (L24–26), `dialogRef` (L16), `onClose` on the dialog element.
- `<Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose() }} variant="fixed" title={`Assign "${exercise.name}"`} className="p-6 max-h-[80vh]">`.
- Children: `<IconButton variant="ghost" size="sm" aria-label="Close" onClick={() => { setOpen(false); onClose() }} className="absolute right-4 top-4">✕</IconButton>` + `<div className="flex flex-col gap-4 overflow-y-auto">…existing body byte-for-byte…</div>`.
- Legacy header (h2 + ✕ row, L72–77) removed — Dialog title replaces it.
- Width: `max-w-lg` accepted (DD-K). `variant="fixed"` (both overlays were fixed modals today); Sheet unused this PR (spec allows "Dialog/Sheet" — either satisfies PMD-2d).
- Dead typography classes in the body (`text-body-sm`, `text-label-lg`, `text-body-xs` — not in `@theme` per PR 2 DD-8) are left byte-for-byte; normalizing would shift to mono `font-data` (visual drift) → deferred to a future tokens pass.

**ExerciseFormDialog.test.tsx (RED first)**: `renderDialog` helper + 5 inline render sites: replace `dialogRef: { current: null }` / `dialogRef={{ current: null }}` with `open: true, onOpenChange: vi.fn()`. New RED test: "calls onOpenChange(false) when Cancel is clicked". jsdom `showModal` is supported (PR 2 2d.7 note: partial — open/ESC fine).

## Primitive-Usage Rules (PMD-3)

- **Token-only**: no hex/rgba anywhere in the migrated diffs — `audit:tokens` rule 3 scans ALL `src` files incl. `__tests__` (verified in `token-audit.test.ts`). Arbitrary values allowed only for non-color layout (`max-h-[85vh]`).
- **English strings**: all touched strings already English (`No workouts yet`, `Search`, `No exercises match your filters.`, etc.); none introduced.
- **No new inline patterns**: hand-rolled card/button/badge markup replaced by primitives; inline retained ONLY for: ⋮ menu (spec non-goal), TimelinePreview (non-goal), image `backgroundImage` (data URL, test-asserted), FilterSelect (preserved), workouts Type toggle (no Button selected-state).
- **FilterSelect**: not duplicated further; blocks preserved byte-for-byte.
- **Override discipline**: className overrides use token utilities only (`bg-surface/80`, `backdrop-blur`, `shadow-fab`, `w-8 h-8`, `p-6`, `max-h-[85vh]`).

## Behavior Preservation (PMD-4)

| # | Behavior | How preserved | Test coverage |
|---|---|---|---|
| 3a-1 | Title search | Filter `useMemo` + input untouched (stays inline) | none (pre-existing gap) — smoke |
| 3a-2 | Type filter toggle | Button? No — toggle stays inline byte-for-byte (DD-H) | none — smoke |
| 3a-3 | Card click + Enter → edit | `role="button" tabIndex onClick onKeyDown` moved onto Card | `WorkoutListPage.test` "navigates to workout editor on card click" |
| 3a-4 | Play → `/play` | IconButton `onClick` + `aria-label` preserved | none — smoke |
| 3a-5 | FAB → `/workouts/new` | Button `onClick` + `aria-label="Create workout"` | `WorkoutListPage.test` "renders a mobile FAB" |
| 3a-6 | "New Workout" → `/new` | Button `onClick` | covered by FAB route test |
| 3a-7 | ⋮ menu play/edit/preview/delete | Inline menu untouched | none — smoke |
| 3a-8 | Delete `confirm()` | Inline untouched | none — smoke |
| 3a-9 | Empty state + CTA | EmptyState + Button action | `WorkoutListPage.test` "renders empty state with CTA" |
| 3b-1 | Multi-field search (name/desc/muscle/equip) | Filter `useMemo` untouched; SearchInput controlled value | `ExercisesPage.test` L214–218 (searchbox role + filtering) |
| 3b-2 | 6 FilterSelects + favorites | Blocks byte-for-byte; favorites Buttons keep exact text | "shows all filter dropdowns", "filtering by Force", "Favorites filter tab" |
| 3b-3 | Category grouping + headers | `grouped` map + section headers untouched | "category section headers" |
| 3b-4 | Card click → detail | Card interactive `onClick`; star/assign `stopPropagation` preserved | "card click navigates" + "does not navigate when star/assign clicked" |
| 3b-5 | Star toggle | IconButton `aria-label` + ★/☆ + `toggleFavorite(id)` | "star toggle" suite (4 tests) |
| 3b-6 | Assign modal | AddToWorkoutModal props unchanged (DD-F) | "quick assign" suite (mocked modal, API stable) |
| 3b-7 | IDB lazy-load | Effect untouched | none — smoke |
| 3b-8 | `clearOrphans` on refresh | Effect untouched | none — smoke |
| 3b-9 | Image bg + placeholder svg | Inline style kept; placeholder svg kept | "shows image thumbnail" + "shows SVG placeholder" |
| 3b-10 | Muscle chips +N overflow | Badge text `CHEST`/`+1` preserved | "shows primary muscles chips" |
| 3c-1 | Form open/save/cancel/validation | Controlled `formOpen` ↔ Dialog; form internals byte-for-byte | `ExerciseFormDialog.test` (validation, save, cancel, steps, images) |
| 3c-2 | ESC close | Dialog native cancel → `onOpenChange(false)` (was native `close` → `onClose`) | Dialog browser play (PR 2) + new Cancel test |
| 3c-3 | Backdrop close (modal) | Dialog backdrop handler (was custom `handleBackdrop`) | Dialog browser play (PR 2) |
| 3c-4 | Edit form from detail page | `form` truthiness drives `open` | `[id]/page.test` "opens ExerciseFormDialog pre-populated on Edit" |

## Decisions + Risks

**New design-level decisions** (beyond proposal decision log): DD-A className-last override mechanism; DD-B exact IconButton sizes (Play 36px exact, star 32px, assign 40px); DD-C Dialog `contained` prop; DD-D h3→Dialog title h2; DD-E form backdrop close accepted; DD-F modal internal open state; DD-G EmptyState h1→h2; DD-H workouts Type toggle stays; DD-I `shadow-fab` replaces default shadows; DD-J form internals out of scope; DD-K modal width 512px accepted.

**Risks:**

| Slice | Risk | Mitigation |
|---|---|---|
| 3a | FAB `px-0`/`w-14 h-14` override couples to className-last ordering | Verified in `Button.tsx` (className last); asserted in 3a gate (FAB test) |
| 3a | Card interactive adds `hover:border-border`; play scale animation dropped; empty-state `p-32` → `py-16` | Accepted drift, documented; no test asserts these |
| 3b | SearchInput visual drift + `searchbox` role | Accepted (UIP-5 log); selector fix is RED-first |
| 3b | Badge pill/12px/bold drift on chips | Accepted; text content (test-asserted) preserved exactly |
| 3b | `group` class on Card must survive (hover chips) | Listed in map; a11y/test gate catches loss |
| 3c | 432-line form needs scroll in Dialog | DD-C `contained` prop + `Dialog.test.tsx` RED test |
| 3c | Backdrop close is new for form dialog | DD-E accepted; form state lifted → no data loss |
| 3c | jsdom partial `<dialog>` support | PR 2 precedent: open/ESC covered in jsdom, focus-restore in browser a11y project |
| 3c | `[id]` ref removal could break delete dialog | `deleteDialogRef`/`ExerciseDeleteDialog` explicitly untouched; `[id]` tests stay green |
| 3c | Modal body dead typography classes | Left byte-for-byte (normalizing drifts to mono) — deferred tokens pass |

## Per-Slice Gates

Common to every slice's PR: `npx tsc --noEmit` + `npm run test:a11y` + `npm run audit:tokens` + `npm run build-storybook` + full unit suite.

| Slice | Slice tests (RED-first order) |
|---|---|
| 3a | `npx vitest run src/app/workouts/__tests__/WorkoutListPage.test.tsx` (unchanged, must stay green) |
| 3b | Fix L214 selector first (`searchbox`), then migrate; `npx vitest run src/app/exercises/__tests__/ExercisesPage.test.tsx` |
| 3c | RED: `ExerciseFormDialog.test.tsx` prop swap + new Cancel test; then `src/components/__tests__/ExerciseFormDialog.test.tsx src/app/exercises/__tests__/ExercisesPage.test.tsx "src/app/exercises/[id]/__tests__/page.test.tsx" src/components/ui/__tests__/Dialog.test.tsx` |

## File Changes

| File | Action | Slice | Description |
|---|---|---|---|
| `src/app/workouts/page.tsx` | Modify | 3a | Card/EmptyState/Button/IconButton swap (DD-A/DD-B) |
| `src/components/ExerciseSearchHeader.tsx` | Modify | 3b | SearchInput + Button pill toggles + Button create; FilterSelect untouched |
| `src/app/exercises/page.tsx` | Modify | 3b+3c | EmptyStates, Card/Badge/IconButton grid; 3c: `dialogRef`→`formOpen` |
| `src/app/exercises/__tests__/ExercisesPage.test.tsx` | Modify | 3b | L214 `textbox`→`searchbox` |
| `src/components/ExerciseFormDialog.tsx` | Modify | 3c | Dialog container, `open`/`onOpenChange`, title, Button actions |
| `src/components/AddToWorkoutModal.tsx` | Modify | 3c | Dialog fixed + internal open state; body byte-for-byte |
| `src/components/ui/Dialog.tsx` | Modify | 3c | `contained?: boolean` (DD-C) |
| `src/components/ui/Dialog.stories.tsx`, `src/components/ui/__tests__/Dialog.test.tsx` | Modify | 3c | contained knob + class assertion |
| `src/app/exercises/[id]/page.tsx` | Modify | 3c | Minimal ripple: drop `dialogRef` (form), `open={form !== null}`; delete dialog untouched |
| `src/components/__tests__/ExerciseFormDialog.test.tsx` | Modify | 3c | `open`/`onOpenChange` props + new Cancel test |

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit (jsdom) | Slice tests listed above; Dialog `contained` class | `vitest run <files>` (repo pattern, jest-dom) |
| Browser a11y (`test:a11y`) | Full storybook suite incl. Dialog play — backdrop/ESC/focus-restore | `npm run test:a11y` (PR 2 infra) |
| Contract | No hex/rgba/Material/second-accent in migrated files | `npm run audit:tokens` (rule 3 scans tests too) |
| Build | tsc + stories compile | `npx tsc --noEmit` + `npm run build-storybook` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary (pure presentational refactor; next/navigation `router.push` calls are unchanged data-flow, not new routing logic).

## Migration / Rollout

No data migration. Stacked PRs 3a → 3b → 3c to `main` (proposal decision 2). Per-slice revert: 3a/3b are presentational swaps (revert diff); 3c reverts `Dialog` props back to `dialogRef` + removes `contained`. No schema or runtime-dependency changes.

## Open Questions

- [ ] DD-C `contained` prop adds a primitive change (Dialog.tsx) to a page-migration PR — confirm at apply (alternative: usage-site className only).
- [ ] DD-E backdrop close on the form dialog — accepted per UIP-6; flag at apply for explicit sign-off (form state lifted, no data loss).
- [ ] Exact `test:a11y` slice scope: the a11y script runs the full browser project per PR (not per-slice) — confirm this satisfies the "per-slice a11y gate" wording.
