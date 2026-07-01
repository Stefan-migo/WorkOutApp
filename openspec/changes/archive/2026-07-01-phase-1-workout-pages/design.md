# Design: Phase 1 — Workout Pages Redesign

## 1. Technical Approach

**Extract, don't rewrite.** The new/edit pages share ~95% identical editor logic (title input, intervals state, timeline, add/remove/move, detail sheet). Rather than maintaining two forks, extract the shared code into a single `WorkoutEditor` component. New and edit pages become thin wrappers that set initial state and call save vs. update.

**Incremental extraction strategy:**
1. Create `WorkoutEditor.tsx` by copying `new/page.tsx` (the canonical editor)
2. Parametrize the save action: `onSave(workout: Workout) => void`, remove router push
3. Rewire edit page to use WorkoutEditor with its own `onSave` handler
4. Then apply all visual changes on the single WorkoutEditor component

**Visual changes are layered on top of the extracted component**, not mixed with the extraction. This keeps the diff reviewable: the extraction diff is pure structural (zero visual change), the visual diff is pure token/class swaps.

**List page** gets rewritten in-place — it's small (74 lines), no extraction needed.

## 2. Component Tree

```
WorkoutListPage
├── Header (headline-md "Workouts" + "Create" btn → mobile FAB)
├── SearchBar (search icon + input + filter chips)
└── WorkoutCardGrid
    └── WorkoutCard[] (glass-card, timeline preview h-2, equipment chips)

WorkoutEditor (shared)
├── Header (glass-card, title input + total duration)
├── TimelineStrip (h-4, shadow-inner, segment colors, legend)
├── IntervalList
│   ├── IntervalRow[] (glass-card, left border, drag icon, desc, duration)
│   ├── CycleBracket (visual wrapper around grouped intervals)
│   │   ├── CycleHeader (name + total badge + repeats select)
│   │   └── IntervalRow[] (inside cycle)
│   └── AddIntervalButtonInsideCycle (dashed border, "Add to Cycle")
├── AddBlockGrid (bento 2x2→4col, 4 type cards with hover lift)
├── WrapInCycleButton (below AddBlock)
├── IntervalDetailSheet (token-only update)
└── SaveBar (Discard + Save, mobile = fixed bottom bar)
```

**Page wrappers:**

```
NewWorkoutPage          EditWorkoutPage
└── WorkoutEditor       └── WorkoutEditor
    onSave→saveWorkout      onSave→saveWorkout (existing id)
```

## 3. Shared WorkoutEditor Component

### Props Interface

```typescript
interface WorkoutEditorProps {
  /** Callback fired with the complete workout on Save/Update */
  onSave: (workout: Workout) => void
  /** Optional pre-loaded workout for edit mode. Undefined = new mode. */
  existingWorkout?: Workout
  /** Optional back navigation after save. Defaults to router.back */
  onCancel?: () => void
}
```

### State Management (internal to WorkoutEditor)

| State | Type | Init (new) | Init (edit) |
|-------|------|-----------|-------------|
| `title` | `string` | `''` | `existingWorkout.title` |
| `intervals` | `Interval[]` | `DEFAULT_INTERVALS` (prepare + cooldown) | `existingWorkout.intervals` |
| `editingIndex` | `number \| null` | `null` | `null` |
| `dirtyRef` | `useRef(false)` | `false` | `false` |

All mutation handlers (`handleAdd`, `handleChange`, `handleRemove`, `handleMoveUp/Down`, `handleTimelineClick`, `handleSheetSave`) are **identical** between new/edit — they only touch internal state. The component never calls `useRouter` or `useWorkoutContext` directly; it calls `onSave()` when the user taps the save button.

### Save behavior

```typescript
function handleSave() {
  if (!canSave) return
  onSave({
    id: existingWorkout?.id ?? generateId(),
    title: title.trim(),
    description: existingWorkout?.description,
    intervals,
    createdAt: existingWorkout?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  })
}
```

### Default intervals (unchanged)

New mode starts with: `[{ prepare, 10s }, { cooldown, 10s }]` — same as current behavior. Edit mode uses existing intervals as-is.

### Dirty tracking

Unchanged from current: `dirtyRef` marks changes, `beforeunload` handler warns. The ref is passed through to handlers; no prop drilling needed since all handlers are inline.

## 4. File Changes

### `src/components/WorkoutEditor.tsx` — NEW

**What:** Extracted from `new/page.tsx`. Contains:
- All interval CRUD handlers (add, change, remove, move up/down, timeline click, sheet save)
- Title input, timeline strip, interval list, add block grid, detail sheet, save/discard buttons
- Internal `flattenWorkout` memo for timeline
- `beforeunload` dirty handler

**Logic changes from current new/page.tsx:**
- `handleSave` → calls `onSave()` instead of `saveWorkout()` + `router.push()`
- Router dependency removed; navigation responsibility given to parent via `onSave`
- Accepts `existingWorkout` prop to pre-fill on edit
- `DEFAULT_INTERVALS` and `generateId` moved inside component scope

**CSS classes:**
- Header: `glass-card rounded-xl p-md`, title input: `border-b-2 border-outline-variant input-glow`
- Duration display: `font-display-timer-mobile text-display-timer-mobile text-primary`
- Save button: `bg-primary-container text-on-primary ambient-shadow`
- Discard button: `border border-outline-variant text-on-surface`
- Empty state: `text-on-surface-variant text-center py-12`

### `src/app/workouts/new/page.tsx` — MODIFIED

**What:** Becomes a thin wrapper:
```typescript
export default function NewWorkoutPage() {
  const { saveWorkout } = useWorkoutContext()
  const router = useRouter()

  return (
    <WorkoutEditor
      onSave={(workout) => {
        saveWorkout(workout)
        router.push('/workouts')
      }}
    />
  )
}
```

**Removed:** All handler functions, state declarations, TimelineStrip/IntervalRow/IntervalForm/IntervalDetailSheet imports, `flattenWorkout`, `useExercises`, `beforeunload`, `generateId`, `intervalId`.

**Kept:** Context import, router import, workout context hook.

### `src/app/workouts/[id]/edit/page.tsx` — MODIFIED

**What:** Becomes a thin wrapper with existing workout lookup:
```typescript
export default function EditWorkoutPage() {
  const { getWorkout, saveWorkout } = useWorkoutContext()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const existing = getWorkout(params.id)

  if (!existing) return <NotFound />

  return (
    <WorkoutEditor
      existingWorkout={existing}
      onSave={(workout) => {
        saveWorkout(workout)
        router.push('/workouts')
      }}
      onCancel={() => router.push('/workouts')}
    />
  )
}
```

**Removed:** All handler functions, state, imports (same list as new/page.tsx).

**Kept:** `getWorkout`, `saveWorkout`, `params` lookup, not-found guard.

**New:** `NotFound` UI — update current "Workout not found" block to use Deep Nordic tokens:
- `text-on-surface` for heading, `text-secondary hover:underline` for back link
- No structural change.

### `src/components/IntervalRow.tsx` — MODIFIED

**Structural changes:**
- Wrapper `div` → `glass-card rounded-lg flex items-center border-l-4 border-l-segment-{type}`
- Remove old `w-3 h-3` color dot on left
- Add drag handle: first child `px-sm py-md text-outline-variant cursor-grab` with `<span class="material-symbols-outlined">drag_indicator</span>`
- Add type icon: `p-sm bg-segment-{type}/10 text-segment-{type} rounded-md` with icon (self_improvement / directions_run / pause_circle / ac_unit)
- Add description line: `<p class="text-[11px] text-on-surface-variant">` below title input
- Duration input: `font-data-lg text-data-lg text-primary w-20 text-center focus:ring-0` (borderless, transparent bg)
- Action buttons (copy + delete) hidden by default, visible on `group-hover`
- Remove old `▲` / `▼` / `✕` buttons (keep ▲▼ as fallback move up/down via group-hover or move to kebab menu — deferred; spec says keep ▲▼ + drag_indicator)
- **Ponytail:** Keep ▲▼ buttons as-is alongside drag_indicator. Remove when drag-and-drop is implemented.

**CSS classes added:**
- `glass-card` for the row wrapper
- `border-l-4 border-l-segment-{type}` for left accent
- `bg-segment-{type}/10 text-segment-{type}` for type icon circle
- `font-data-lg text-data-lg text-primary` for duration
- `group-hover:flex` for action button visibility
- `hidden group-hover:flex gap-xs` on action container

**Kept:** All existing props, `TYPE_COLORS` removed in favor of Tailwind dynamic class, `onChange`, `onRemove`, `onMoveUp`, `onMoveDown` handlers.

### `src/components/IntervalForm.tsx` — DELETED (replaced by AddBlockGrid)

**Replacement:** The "Add Block" bento grid is inlined directly in `WorkoutEditor.tsx` — it's simpler markup, no extracted component needed.

**Add Block grid markup (inlined in WorkoutEditor):**
```tsx
<section className="pt-lg border-t border-outline-variant/30 mt-xl">
  <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-md text-center tracking-widest">
    Add Block
  </h3>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
    {INTERVAL_TYPES.map(type => (
      <button
        key={type}
        onClick={() => handleAdd(createInterval(type))}
        className="glass-card p-md rounded-xl flex flex-col items-center justify-center gap-sm
          hover:-translate-y-1 hover:shadow-md transition-all duration-200
          border-t-2 border-t-segment-{type} group"
      >
        <div className="w-10 h-10 rounded-full bg-segment-{type}/10 text-segment-{type}
          flex items-center justify-center group-hover:scale-110 transition-transform">
          <span class="material-symbols-outlined">{TYPE_ICONS[type]}</span>
        </div>
        <span class="font-label-caps text-label-caps uppercase text-on-surface font-semibold">
          {type}
        </span>
      </button>
    ))}
  </div>
</section>
```

**New helper (inside WorkoutEditor):**
```typescript
// ponytail: simple ID counter
let addBlockId = 1
function createInterval(type: IntervalType): Interval {
  const defaults: Record<IntervalType, number> = {
    prepare: 180, work: 30, rest: 30, cooldown: 180,
  }
  return {
    id: `int-${addBlockId++}`,
    type,
    title: type.charAt(0).toUpperCase() + type.slice(1),
    duration: defaults[type],
  }
}
```

### `src/components/TimelineStrip.tsx` — MODIFIED

**Structural changes:**
- Height: `h-8` → `h-4`
- Wrapper: remove `overflow-x-auto gap-px`, add `shadow-inner`
- Background: remove button-per-segment basis; add `bg-surface-dim rounded-full overflow-hidden flex`
- Segments: keep proportional `width` style but use Deep Nordic segment colors (`bg-segment-prepare`, `bg-segment-work`, etc.)
- Remove `currentIndex` visual (ring, opacity) — timeline is preview-only in editor, not interactive for timer
- Keep `onIntervalClick` for detail sheet navigation
- Remove per-segment `button` role listbox semantics; use plain `div` segments with `title` attr
- **NEW:** Add legend row below the bar

**Legend markup (added below the bar):**
```tsx
<div className="flex flex-wrap gap-md px-xs pt-xs">
  {SEGMENT_TYPES.map(type => (
    <div key={type} className="flex items-center gap-xs">
      <div className="w-3 h-3 rounded-sm bg-segment-{type}" />
      <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">
        {type}
      </span>
    </div>
  ))}
</div>
```

**Updated props:**
```typescript
interface TimelineStripProps {
  intervals: FlattenedInterval[]
  onIntervalClick?: (index: number) => void
}
// removed currentIndex — not used in editor context
```

**CSS tokens:**
- `bg-surface-dim` for bar background
- `bg-segment-*` for segment colors
- `shadow-inner` for inset shadow
- `rounded-full overflow-hidden flex` for bar shape
- `w-3 h-3 rounded-sm bg-segment-*` for legend dots
- `text-[10px] font-label-caps text-on-surface-variant` for legend labels

### `src/components/IntervalDetailSheet.tsx` — MODIFIED (token-only)

**No structural changes.** Only token replacements:

| Old Token | New Token |
|-----------|-----------|
| `text-muted` | `text-on-surface-variant` |
| `bg-surface-alt` | `bg-surface-container-low` |
| `text-fg` | `text-on-surface` |
| `border-border` | `border-outline-variant` |
| `bg-accent` | `bg-primary-container` |
| `text-accent-on` | `text-on-primary` |
| `hover:bg-border` | `hover:bg-surface-container` |
| `bg-surface` (dialog bg) | `bg-surface` (same) |

Also update the dialog CSS to use CSS variable tokens:
- `background: var(--color-surface)` stays
- `::backdrop` color stays (`rgba(30, 20, 22, 0.4)`)

### `src/app/workouts/page.tsx` — MODIFIED (full rewrite)

**Before:** Flat list, `text-fg`/`bg-accent` tokens, minimal layout.

**After:** Full Deep Nordic design per workout-list.html.

**Structure:**
```tsx
export default function WorkoutListPage() {
  const { workouts } = useWorkoutContext()
  const router = useRouter()

  // Empty state
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
          fitness_center
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface">No workouts yet</h2>
        <p className="text-body-md text-on-surface-variant">
          Create your first workout to get started
        </p>
        <button onClick={() => router.push('/workouts/new')}
          className="px-6 py-3 bg-primary-container text-on-primary rounded-xl
            font-label-caps text-label-caps uppercase ambient-shadow hover:bg-primary transition-colors"
        >
          Create Workout
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
        {/* Search + filters */}
        <SearchFilterBar />
        {/* Workout grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map(w => <WorkoutCard key={w.id} workout={w} />)}
        </div>
      </div>
      {/* Mobile FAB */}
      <button onClick={() => router.push('/workouts/new')}
        className="md:hidden fixed bottom-lg right-lg w-14 h-14 bg-primary-container
          text-on-primary rounded-full ambient-shadow flex items-center justify-center
          hover:scale-105 active:scale-95 transition-transform z-50"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>
    </div>
  )
}
```

**WorkoutCard sub-component (inlined or co-located):**
```tsx
function WorkoutCard({ workout }: { workout: Workout }) {
  const totalSec = workout.intervals.reduce((s, i) => s + i.duration, 0)
  const flat = flattenWorkout(workout)
  const router = useRouter()

  return (
    <div onClick={() => router.push(`/workouts/${workout.id}/edit`)}
      className="bg-surface rounded-xl border border-outline-variant/30 p-md
        flex flex-col gap-4 hover:shadow-[0_8px_30px_rgba(11,28,48,0.04)]
        transition-shadow duration-300 relative group cursor-pointer"
    >
      {/* Context menu (hidden, deferred) */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100">
        <button className="text-on-surface-variant hover:text-primary p-1 rounded-full">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
      {/* Title + meta */}
      <div>
        <h3 className="font-headline-md text-[20px] leading-tight font-bold text-on-surface mb-1">
          {workout.title}
        </h3>
        <p className="font-data-sm text-data-sm text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">timer</span>
          {formatDuration(totalSec)}
          <span className="w-1 h-1 rounded-full bg-outline-variant/50" />
          {workout.intervals.length} exercise{workout.intervals.length !== 1 && 's'}
        </p>
      </div>
      {/* Timeline preview bar */}
      <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden flex">
        {flat.map((fi, i) => (
          <div key={i}
            className={`h-full bg-segment-${fi.type}/80`}
            style={{ width: `${(fi.duration / totalSec) * 100}%` }}
          />
        ))}
      </div>
      {/* Equipment chips (placeholder — no equipment data yet) */}
      <div className="flex gap-2 mt-auto pt-2">
        <span className="px-2 py-1 rounded-full bg-surface-dim text-on-surface
          font-label-caps text-[10px]">
          {(workout.intervals.length > 3) ? 'High Intensity' : 'Standard'}
        </span>
      </div>
    </div>
  )
}
```

**CSS tokens used (workout list):**
- `bg-background text-on-background` — page body
- `bg-surface rounded-xl border border-outline-variant/30 p-md` — cards
- `font-headline-md text-headline-md text-on-surface` — card title
- `font-data-sm text-data-sm text-on-surface-variant` — meta text
- `bg-surface-variant rounded-full overflow-hidden` — timeline bar bg
- `bg-segment-*/80` — timeline segments
- `bg-surface-dim text-on-surface font-label-caps text-[10px]` — chips
- `bg-primary-container text-on-primary rounded-xl font-label-caps` — primary buttons
- `bg-surface border border-outline-variant` — filter chips
- `w-14 h-14 bg-primary-container text-on-primary rounded-full` — FAB
- `px-margin-mobile md:px-margin-desktop` — responsive padding
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` — responsive grid

## 5. Data Flow

### Save Flow (New)

```
User taps "Save Workout"
  → WorkoutEditor.handleSave()
    → title.trim() checks, intervals.length > 0 check
    → onSave({ workout with generateId() })
    → NewWorkoutPage.onSave handler:
      → context.saveWorkout(workout)
      → router.push('/workouts')
```

### Update Flow (Edit)

```
User taps "Save Workout"
  → WorkoutEditor.handleSave()
    → title.trim() checks, intervals.length > 0 check
    → onSave({ workout with existingWorkout.id })
    → EditWorkoutPage.onSave handler:
      → context.saveWorkout(workout)
      → router.push('/workouts')
```

### Add Interval Flow

```
User taps bento card (e.g., "Work")
  → createInterval('work') → { id, type, title, duration: 30 }
  → handleAdd(newInterval)
    → dirtyRef.current = true
    → setIntervals(prev => [...prev, newInterval])
  → React re-render:
    → flattenWorkout recalculates (useMemo deps: [intervals])
    → TimelineStrip re-renders with new segment
    → IntervalList re-renders with new IntervalRow
```

### Edit Interval Flow

```
User taps IntervalRow → no inline edit (detail sheet only)
  OR taps timeline segment
  → handleTimelineClick(idx)
    → find original interval index from flat
    → setEditingIndex(origIdx)

User edits in IntervalDetailSheet
  → handleSheetSave(updated)
    → setIntervals(prev => [...prev, next[editingIndex] = updated])
    → setEditingIndex(null)
```

### Wrap in Cycle Flow

```
User taps "Wrap in Cycle" button
  → handleWrapInCycle():
    → Take all current top-level intervals
    → Wrap them in a parent Interval with:
      - children = [...intervals]
      - type = 'work' (or parent type)
      - title = 'Cycle'
      - cycleCount = 4
      - duration = sum of children
    → setIntervals([parent])
  → Re-render: CycleBracket wraps IntervalRow children
```

### Validation

All validation stays within `WorkoutEditor`:
- **Save guard:** `title.trim().length > 0 && intervals.length > 0` → `canSave` disables save button
- **Duration range:** Each interval duration clamped `[5, 600]` on input (via `onChange` handler)
- **First/last type forcing:** index 0 → `prepare`, last index → `cooldown` (unchanged)
- **Dirty tracking:** `beforeunload` only if `dirtyRef.current === true`

## 6. Cycle Support

### Visual (Cycle Bracket)

The cycle bracket is a CSS-only visual using relative positioning:

```tsx
// In WorkoutEditor, when an interval has children:
<div className="relative ml-4 mt-lg">
  {/* Left bracket — border-l-2 + border-t-2 + border-b-2 rounded-l-lg */}
  <div className="absolute left-0 top-0 bottom-0 w-8
    border-l-2 border-t-2 border-b-2 border-outline-variant/40
    rounded-l-lg pointer-events-none -ml-4" />

  {/* Cycle header */}
  <div className="flex justify-between items-center pl-sm pr-md py-xs mb-sm relative z-10">
    <div className="flex items-center gap-sm">
      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
        {parent.title} Cycle
      </span>
      <div className="bg-surface-dim px-sm py-[2px] rounded text-[11px]
        font-data-sm text-on-surface font-bold">
        Total: {formatDuration(totalCycleDuration)}
      </div>
    </div>
    {/* Repeats selector */}
    <div className="flex items-center gap-xs">
      <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Repeats:</span>
      <select
        value={parent.cycleCount ?? 4}
        onChange={(e) => updateCycleCount(parent.id, Number(e.target.value))}
        className="bg-surface border border-outline-variant/50 rounded px-2 py-1
          text-data-sm font-data-sm text-primary font-bold"
      >
        {[2,3,4,5,6].map(n => <option key={n} value={n}>x{n}</option>)}
      </select>
    </div>
  </div>

  {/* Child intervals — rendered indented inside bracket */}
  <div className="space-y-sm ml-sm relative z-10">
    {parent.children!.map((child, i) => (
      <IntervalRow key={child.id} ... />
    ))}
    {/* Add to cycle button */}
    <AddToCycleButton />
  </div>
</div>
```

### Repeats selector behavior

The `<select>` updates `cycleCount` on the parent interval:

```typescript
function updateCycleCount(parentId: string, count: number) {
  setIntervals(prev => prev.map(i =>
    i.id === parentId ? { ...i, cycleCount: count } : i
  ))
}
```

This propagates through `flattenWorkout` — the engine expands children `cycleCount` times, which updates the timeline strip proportionally.

### Wrap / Unwrap

**Wrap:** Select all intervals in `handleWrapInCycle()` → create parent with `children: [...intervals]`.

**Unwrap:** (Deferred — not in scope, but the data model supports it via `parent.children` removal + interval flattening.)

### Mobile behavior

On mobile (<768px):
- Bracket collapses to just the label + repeats selector (remove the left bracket border visual or keep it thinner)
- The bracket visual uses `pointer-events-none` so it doesn't interfere with touch targets
- Consider `hidden md:block` for the bracket decoration if space is tight — keep the cycle header always visible

**Ponytail:** The bracket is pure CSS (`border-l-2 border-t-2 border-b-2`), zero JS, zero extra deps. The absolute positioning with `-ml-4` offsets it cleanly left of the interval list.

## 7. Token Migration Map

| Old Token | New Token | Files Affected |
|-----------|-----------|----------------|
| `text-fg` | `text-on-surface` | page.tsx, new/page.tsx, edit/page.tsx, IntervalRow, IntervalDetailSheet, IntervalForm |
| `text-fg-2` | `text-on-surface` | IntervalRow |
| `text-muted` | `text-on-surface-variant` | All |
| `bg-accent` | `bg-primary-container` | All (buttons) |
| `hover:bg-accent` | `hover:bg-primary` | All (buttons) |
| `text-accent-on` | `text-on-primary` | All (buttons) |
| `border-border` | `border-outline-variant` | All |
| `border-border-soft` | `border-outline-variant/30` | IntervalRow, page.tsx |
| `bg-surface-alt` | `bg-surface-container-low` | IntervalDetailSheet, IntervalForm |
| `hover:bg-surface-alt` | `hover:bg-surface-container` | IntervalDetailSheet |
| `hover:bg-border` | `hover:bg-surface-container` | IntervalDetailSheet |
| `bg-interval-prepare` | `bg-segment-prepare` | IntervalRow, TimelineStrip |
| `bg-interval-work` | `bg-segment-work` | IntervalRow, TimelineStrip |
| `bg-interval-rest` | `bg-segment-rest` | IntervalRow, TimelineStrip |
| `bg-interval-cooldown` | `bg-segment-cooldown` | IntervalRow, TimelineStrip |
| `text-danger` | `text-error` | IntervalRow |
| `ring-accent` | `ring-secondary` | TimelineStrip |
| `bg-bg` | `bg-background` | TimelineStrip |
| `bg-surface border-border` (form) | `glass-card` | IntervalForm → deleted |
| `bg-accent disabled:bg-surface-alt disabled:text-muted` | `bg-primary-container disabled:opacity-50` | WorkoutEditor save button |

**Notes:**
- `text-accent`, `border-accent`, `focus:border-accent`, `focus:ring-accent` → `text-secondary`, `border-secondary`, `focus:border-secondary`, `focus:ring-secondary`
- `bg-accent text-accent-on` → `bg-primary-container text-on-primary` for primary buttons (save, create)
- Secondary/ghost buttons use `border border-outline-variant text-on-surface`
- `glass-card` utility class handles `bg-surface/80 backdrop-blur-md border border-outline-variant/30` pattern
- Segment colors use opacity variants: `bg-segment-work/80` for timeline, `bg-segment-work/10` for icon backgrounds, `border-l-segment-work` for left accent
- After the migration, run: `grep -r "text-fg\|bg-accent\|border-border\|text-muted\|bg-surface-alt\|bg-interval-\|text-accent" src/ --include="*.{tsx,ts}"` to confirm zero old tokens remain in modified files.
