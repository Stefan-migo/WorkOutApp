# SDD Tasks: Phase 1 — Workout Pages Redesign

**Change**: phase-1-workout-pages
**Mode**: Strict TDD
**Delivery**: auto-forecast, stacked-to-main, review budget 400 lines

---

## PR 1: Extraction & Foundation (Merge tasks)

### Task 1.1 — Extract WorkoutEditor component ✅

**Type**: GREEN (structural refactor, zero visual change)
**File**: NEW `src/components/WorkoutEditor.tsx`
**Lines changed**: ~180 (new file)
**Boundary**: Copy all state, handlers, and JSX from `src/app/workouts/new/page.tsx` into a new `WorkoutEditor` component. Replace `saveWorkout()` + `router.push()` with a single `onSave(workout)` prop. Move `generateId`, `DEFAULT_INTERVALS`, `intervalIdCounter`, and `createInterval` inside the component. Accept `existingWorkout?: Workout` for edit-mode pre-fill. Keep all existing CSS classes and tokens as-is.
**TDD**: No test needed — pure structural extraction, zero behavioral change. Verify both new/edit routes render identically to before.

### Task 1.2 — Rewire new/edit pages as thin wrappers ✅

**Type**: GREEN
**Files**: MOD `src/app/workouts/new/page.tsx`, MOD `src/app/workouts/[id]/edit/page.tsx`
**Lines changed**: ~50 (both pages combined)
**Boundary**:
- `new/page.tsx`: Remove all state, handlers, imports (IntervalRow, IntervalForm, TimelineStrip, IntervalDetailSheet, flattenWorkout, useExercises, generateId). Keep `useWorkoutContext`, `useRouter`. Return `<WorkoutEditor onSave={...} />` that calls `saveWorkout()` + `router.push()`.
- `edit/page.tsx`: Same reduction. Keep `getWorkout`, `useParams`, `NotFound` guard. Pass `existingWorkout` to WorkoutEditor. Pass `onCancel` for router.back.
- Zero visual change — tokens are untouched at this stage.
**TDD**: Verify TSC passes and both pages compile.

### Task 1.3 — Token audit setup ✅

**Type**: AUDIT
**Files**: None (add npm script or one-liner to `package.json`)
**Lines changed**: ~2
**Boundary**: Add grep command(s) to verify zero old tokens remain post-migration:
```
grep -r "text-fg\|bg-accent\|border-border\|text-muted\|bg-surface-alt\|bg-interval-" src/ --include="*.{tsx,ts}"
```
This gets run in Verification phase. No code change beyond the npm script entry.

---

## PR 2: Component Visual Overhaul

### Task 2.1 — RED: Test createInterval helper + Add Block grid

**Type**: RED
**File**: NEW `src/components/__tests__/WorkoutEditor.test.ts`
**Lines changed**: ~30
**Boundary**: Write failing tests for:
- `createInterval('work')` returns interval with type `work`, default duration 30, title `Work`
- `createInterval('prepare')` returns interval with default duration 180
- ID format matches `int-{number}` pattern
- `createInterval` is not exported (internal helper — test via importing the file's module or restructuring for testability)

### Task 2.2 — Replace IntervalForm with Add Block bento grid

**Type**: GREEN
**Files**: DEL `src/components/IntervalForm.tsx`, MOD `src/components/WorkoutEditor.tsx`
**Lines changed**: ~60 (add ~55 lines bento grid + `createInterval` helper to WorkoutEditor, delete 101-line IntervalForm)
**Boundary**:
- Delete `src/components/IntervalForm.tsx` entirely
- Add `createInterval` helper function inside `WorkoutEditor.tsx` (per design: simple counter, default durations per type)
- Add inline bento grid markup replacing `<IntervalForm onAdd={handleAdd} />`: 2x2 mobile / 4-col desktop grid, glass-card per type, icon in tinted circle, label-caps name, hover lift effect, top-2 border accent matching segment color
- `TYPE_ICONS` map: prepare → `self_improvement`, work → `directions_run`, rest → `pause_circle`, cooldown → `ac_unit`
- Keep existing `handleAdd` — bento cards call it with `createInterval(type)`

### Task 2.3 — RED: Test IntervalRow visual rendering

**Type**: RED
**File**: NEW `src/components/__tests__/IntervalRow.test.tsx`
**Lines changed**: ~35
**Boundary**: Write failing tests for:
- Renders glass card wrapper with `border-l-4 border-l-segment-{type}`
- Renders `drag_indicator` icon span
- Renders type-specific icon (e.g., `directions_run` for work)
- Renders title input with correct value
- Renders duration in `font-data-lg` format
- Renders move up/down buttons
- Delete button renders with correct aria-label

### Task 2.4 — IntervalRow visual rewrite

**Type**: GREEN
**File**: MOD `src/components/IntervalRow.tsx`
**Lines changed**: ~110 (full rewrite of the 80-line component)
**Boundary**:
- Wrapper: `<div className="glass-card rounded-lg flex items-center border-l-4 border-l-segment-{type}">`
- Remove old `TYPE_COLORS` static map and `w-3 h-3` dot — use Tailwind dynamic segment classes
- Add drag handle: first child `px-sm py-md text-outline-variant cursor-grab` with `<span class="material-symbols-outlined">drag_indicator</span>`
- Add type icon: `p-sm bg-segment-{type}/10 text-segment-{type} rounded-md` with appropriate icon per type
- Keep type text label (unchanged width/position)
- Keep title input with Deep Nordic tokens: `text-on-surface`, `border-b-2 border-outline-variant input-glow`
- Add description line below title: `<p class="text-[11px] text-on-surface-variant">` — shows exercise name if work type, otherwise hidden
- Duration input: `font-data-lg text-data-lg text-primary w-20 text-center focus:ring-0` (borderless, transparent bg)
- Action buttons (copy + delete) hidden by default, visible on `group-hover`
- Keep ▲▼ move buttons alongside `drag_indicator` (per design: keep until full DnD implemented)
- Replace all old tokens (`text-fg`, `bg-interval-*`, `text-muted`, `text-danger`, `border-border-soft`)

### Task 2.5 — RED: Test TimelineStrip rendering

**Type**: RED
**File**: NEW `src/components/__tests__/TimelineStrip.test.tsx`
**Lines changed**: ~30
**Boundary**: Write failing tests for:
- Renders `h-4 rounded-full bg-surface-dim shadow-inner` wrapper
- Renders segments with proportional widths
- Each segment uses correct `bg-segment-{type}` class
- Renders legend row with 4 colored dots and labels
- Returns null when intervals array is empty
- `onIntervalClick` fires with correct index when a segment is clicked

### Task 2.6 — TimelineStrip visual rewrite

**Type**: GREEN
**File**: MOD `src/components/TimelineStrip.tsx`
**Lines changed**: ~70 (rewrite of 57-line component)
**Boundary**:
- Wrapper: `h-4 rounded-full bg-surface-dim shadow-inner overflow-hidden flex`
- Remove `overflow-x-auto gap-px` — use `overflow-hidden flex`
- Segments as `<div>` with `style.width` proportional, class `h-full bg-segment-{type}/80`
- Remove `currentIndex` prop and ring/opacity visual — timeline is preview-only in editor
- Remove `role="listbox"` and `role="option"` — use plain div segments with `title` attr
- Keep `onIntervalClick` handler on click
- Keep `<button>` wrapper for segments with `cursor-pointer` and `hover:opacity-85`
- Replace `TYPE_BG` static map with Tailwind dynamic classes
- **Add legend** below the bar: 4 items with `w-3 h-3 rounded-sm bg-segment-{type}` dot + `text-[10px] font-label-caps uppercase text-on-surface-variant` label
- Replace all old tokens (`bg-interval-*`, `ring-accent`, `ring-offset-bg`, `bg-muted`)
- Remove `currentIndex?: number` from props

### Task 2.7 — IntervalDetailSheet token migration

**Type**: GREEN
**File**: MOD `src/components/IntervalDetailSheet.tsx`
**Lines changed**: ~30
**Boundary**: Token-only replacement — zero structural, behavioral, or animation changes:
| Old Token | New Token |
|-----------|-----------|
| `text-muted` | `text-on-surface-variant` |
| `bg-surface-alt` | `bg-surface-container-low` |
| `text-fg` | `text-on-surface` |
| `border-border` | `border-outline-variant` |
| `bg-accent` | `bg-primary-container` |
| `text-accent-on` | `text-on-primary` |
| `hover:bg-border` | `hover:bg-surface-container` |
| `hover:bg-accent` (nesting buttons) | `hover:bg-surface-container` |
| `focus:ring-accent` | `focus:ring-secondary` |
| `focus:ring-1 focus:ring-accent` | `focus:ring-2 focus:ring-secondary` |

---

## PR 3: Editor + List Page Rewrites

### Task 3.1 — Apply Deep Nordic tokens to editor page wrappers

**Type**: GREEN
**Files**: MOD `src/app/workouts/new/page.tsx`, MOD `src/app/workouts/[id]/edit/page.tsx`
**Lines changed**: ~20
**Boundary**: The wrapper pages no longer contain editor logic, but they may have minimal JSX (not-found UI in edit page). Update remaining old tokens:
- Update `text-fg` → `text-on-surface` in NotFound block
- Update `text-accent hover:underline` → `text-secondary hover:underline` in back link
- Any remaining old tokens in the wrappers

### Task 3.2 — Wrap in Cycle visual (cycle bracket)

**Type**: GREEN
**Files**: MOD `src/components/WorkoutEditor.tsx`
**Lines changed**: ~60
**Boundary**: When an interval has `children`, render CycleBracket wrapper:
- CSS-only left bracket: absolute div with `border-l-2 border-t-2 border-b-2 border-outline-variant/40 rounded-l-lg`
- Cycle header: interval name + `Cycle` suffix, total duration badge (`bg-surface-dim px-sm py-[2px] rounded text-[11px] font-data-sm`)
- Repeats `<select>`: x2–x6, value from `parent.cycleCount ?? 4`, updates via `updateCycleCount(parentId, count)`
- Child intervals rendered indented inside bracket
- "Add to Cycle" dashed border button below children
- Add `handleWrapInCycle()` button below Add Block grid — wraps all top-level intervals into one cycle parent
- Bracket collapses on mobile (<768px) — thinner or hidden, keep header always visible
- **Ponytail**: pure CSS bracket, zero JS deps. `pointer-events-none` so bracket doesn't block touch.

### Task 3.3 — RED: Test WorkoutListPage empty state and card grid

**Type**: RED
**File**: NEW `src/components/__tests__/WorkoutCard.test.tsx` — or co-locate in `src/app/workouts/__tests__/WorkoutListPage.test.tsx`
**Lines changed**: ~35
**Boundary**: Write failing tests for:
- Empty state renders fitness_center icon, "No workouts yet" heading, CTA button linking to /workouts/new
- With 3 workouts, renders 3 cards in a grid
- Card shows title, duration formatted, interval count
- Card shows h-2 timeline preview bar with colored segments
- Card is clickable and navigates to `/workouts/{id}/edit`

### Task 3.4 — Workout list page full rewrite

**Type**: GREEN
**File**: MOD `src/app/workouts/page.tsx`
**Lines changed**: ~140 (rewrite of 74-line page)
**Boundary**: Replace entire file with Deep Nordic design:
- Import and use `useWorkoutContext`, `useRouter`
- **Empty state**: fitness_center icon (48px), "No workouts yet" headline-md, body-md description, primary-container CTA button
- **Search/filter bar**: `<SearchFilterBar />` placeholder component — search input + filter chips (Type, Duration, Equipment) — no functional filtering (P1), pure layout
- **Grid layout**: `responsive` `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **WorkoutCard** (co-located function component in same file):
  - `bg-surface rounded-xl border border-outline-variant/30 p-md` card
  - Title: `font-headline-md text-[20px] leading-tight font-bold text-on-surface`
  - Meta: `font-data-sm text-data-sm text-on-surface-variant` with timer icon + duration + interval count
  - Timeline preview bar: `h-2 w-full bg-surface-variant rounded-full overflow-hidden flex` with proportional segments using `bg-segment-{type}/80`
  - Equipment chip placeholder: pill-shaped `bg-surface-dim text-on-surface font-label-caps text-[10px]`
  - Context menu button (deferred): more_vert icon, hidden by default, `group-hover:opacity-100`
- **Mobile FAB**: `w-14 h-14 bg-primary-container text-on-primary rounded-full` fixed bottom-right, add icon
- All tokens per design token map
- `formatDuration` helper stays inline (or imported from shared utility)

---

## PR 4: Verify

### Task 4.1 — Verify + fix

**Type**: VERIFY
**Files**: None
**Lines changed**: 0
**Boundary**:
- Run `npx vitest run` — all tests must pass
- Run token audit grep — zero hits for old tokens in modified files
- Run `npx tsc --noEmit` — zero type errors
- Check both new and edit workflows render in dev server
- Verify design spec compliance per scenarios in spec
- Produce verify report in `openspec/changes/phase-1-workout-pages/verify-report.md`

---

## PR Delivery Plan

| PR | Tasks | Est. Lines | Chain |
|----|-------|-----------|-------|
| 1 | 1.1 → 1.3 ✅ | ~230 | `stacked-to-main` → PR1 → main |
| 2 | 2.1 → 2.7 | ~310 | `stacked-to-main` → PR2 → main |
| 3 | 3.1 → 3.4 | ~195 | `stacked-to-main` → PR3 → main |
| 4 | 4.1 | 0 | `stacked-to-main` → PR4 → main |
| **Total** | **13 tasks** | **~735** | **4 PRs stacked** |

---

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| **Estimated total changed lines** | ~735 (gross: new + modified, excluding deletions) |
| **400-line budget risk** | **HIGH** — exceeds single-PR budget by ~335 lines |
| **Chained PRs recommended** | **Yes** — 4 PRs stacked-to-main, each under 400 lines |
| **Decision needed before apply** | **No** — design, spec, and delivery strategy are finalized |
| **Largest single PR** | PR 2 at ~310 lines (component visual overhaul) |
| **Lowest risk PR** | PR 4 at 0 lines (verify only) |
| **Component PR overlap risk** | Low — each component visual change touches a single file independently; merge conflicts unlikely unless WorkoutEditor.tsx is modified in parallel |
