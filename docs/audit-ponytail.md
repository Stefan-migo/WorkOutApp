# Audit: Over-Engineering & Technical Debt (Ponytail)

> Date: 2026-07-01
> Scope: Full source tree scan — src/**, config files, tests

## Summary

The codebase is remarkably lean in terms of dependencies (Next 16 + React 19 + Tailwind v4 + Vitest — nothing else). No lodash, date-fns, chart libraries, or UI kits. **Signal-to-noise ratio ~86%**. The fat is mostly copy-paste duplication and placeholder UI shells.

**Net cleanup potential: -420 lines, -0 dependencies.**

---

## Findings (ranked by impact)

### `delete:` Dead code

1. **`ExercisePicker.tsx` — entire component (196 lines)** never imported anywhere. Zero callers.
   [`src/components/ExercisePicker.tsx`]

2. **`Sequence` interface duplicated verbatim** in `workout.ts` (lines 51-59 = lines 41-49). Cut the second copy.
   [`src/types/workout.ts:51-59`]

3. **`getNextWorkoutId()` + `isComplete()` in `sequence-engine.ts`** — exported but never imported by any page/component. Self-test references accompany them.
   [`src/lib/sequence-engine.ts:19-27`]

4. **`markDirty` + `hasChanges` in `WorkoutEditor.tsx`** — `markDirty` is declared-assigned and never called; `hasChanges` is a stale snapshot (`false` at mount, never updates). The `beforeunload` handler correctly reads `dirtyRef.current`, so these two are dead.
   [`src/components/WorkoutEditor.tsx:82-83`]

5. **Placeholder PR data `PLACEHOLDER_PRS` (6 lines) + "View All" button (1 line)** — `ponytail:` comment already admits no PR data exists.
   [`src/components/StatsDashboard.tsx:53-58,246`]

6. **"Detailed View" button with no handler** — renders but does nothing.
   [`src/components/StatsDashboard.tsx:129-133`]

7. **PlayHeader decorative `volume_up` + `more_vert` icons** — inner spans with no onClick, no aria role, pure decor.
   [`src/components/PlayHeader.tsx:21-22`]

8. **"Filters" button + "This Month" button in History page** — both have `onClick` but no handler.
   [`src/app/history/page.tsx:168-186`]

9. **Motivational card in Calendar sidebar** — hardcoded "On track for a 4-week streak" text that never reflects actual data.
   [`src/app/calendar/page.tsx:335-352`]

10. **Empty `<div className="flex gap-2 mt-auto pt-2" />`** — renders nothing, zero content.
    [`src/app/workouts/page.tsx:146`]

11. **Empty `pb-safe` utility class** — `pb-safe` is not defined in globals.css or Tailwind. Only used once, silently ignored.
    [`src/components/Nav.tsx:91`]

### `duplicate:` Repeated patterns

12. **10 identical `formatDuration` / `formatTime` definitions** across the codebase (all `M:SS` or `MM:SS` format). Move to a shared util like `src/lib/format.ts`.
    Affects: DayAssignmentModal, StatsDashboard, workouts/page, calendar/page, history/page, history/[id]/page, sequences/page, sequences/[id]/play, workouts/[id]/play, TimerRing, sequences/new.
    **Net: -36 lines.**

13. **12+ separate `Record` declarations mapping `IntervalType` → Tailwind class** for the same 4 types (`prepare`/`work`/`rest`/`cooldown`). Each uses slightly different suffixes (`/80`, `/10`, `border-l-*`, `text-*`). Centralize base hue names in one constant and derive.
    Affects: IntervalRow.tsx (4 maps), TimelineStrip.tsx (2 maps), WorkoutEditor.tsx (2 maps), workouts/page.tsx, history/page.tsx, history/[id]/page.tsx, sequences/new/page.tsx.
    **Net: -74 lines.**

### `yagni:` Abstraction with one implementation

14. **`useProgramTemplates.ts`** — separate hook + localStorage key for a feature used only on calendar page with only 2 methods (save/delete, no get/update). The pattern is identical to `useWorkouts`/`useSequences`. Inline into calendar page or merge with generic CRUD hook.
    [`src/hooks/useProgramTemplates.ts`]

### `shrink:` Can be fewer lines

15. **History detail page** — 3 placeholder metric cards (Calories, Avg HR, Peak HR) all showing `—` with identical structural wrappers (~40 lines). Either remove or collapse to one "Coming soon" placeholder.
    [`src/app/history/[id]/page.tsx:160-199`]

16. **`getTotalSeconds` in `useStats.ts`** (line 40-42) — 3-line helper called exactly once (line 46). Inline it. Saves 2 lines.

17. **`getISOWeekLabel` in `useStats.ts`** — 7-line function with `Date.UTC` gymnastics. Same ISO week logic approximated in `calendar-utils.ts` `getMonday`. If these ever disagree, bugs appear. Align them or document.

### `stdlib:` No findings

The codebase consistently uses `crypto.randomUUID()`, native `<dialog>`, `Blob`+anchor downloads, Web Audio API, and `Notification` API. No `date-fns`/`lodash`/moment. **Clean.**

---

## Detail Impact Table

| Finding | Impact | Lines cut |
|---------|--------|-----------|
| `ExercisePicker.tsx` dead file | high | -196 |
| Segment maps dedup | high | -74 |
| Placeholder HR/calories cards | medium | -40 |
| `formatDuration` dedup | medium | -36 |
| Motivational card (calendar) | medium | -18 |
| "Filters"/"This Month" buttons | medium | -19 |
| Duplicate `Sequence` interface | medium | -9 |
| Dead exports (engine) | low | -9 |
| Placeholder PR data + buttons | low | -12 |
| PlayHeader decor icons | low | -2 |
| `markDirty`/`hasChanges` | low | -2 |
| Empty div in workout list | low | -1 |
| `getTotalSeconds` inline | low | -2 |
| `useProgramTemplates` YAGNI | low | -0 |

**Net: -420 lines, -0 deps possible.**
