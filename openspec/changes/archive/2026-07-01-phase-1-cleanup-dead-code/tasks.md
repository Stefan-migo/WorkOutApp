# Tasks: Phase 1 — Dead Code & Deduplication

## Delivery Strategy

**Chain strategy**: stacked-to-main (pre-decided by user)
**TDD mode**: strict — `npm run test` (vitest) must pass after each unit

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~440 (additions + deletions) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 (stacked-to-main) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shared modules + inline replacements | PR 1 | Create format.ts, segment-styles.ts; replace all 10 inline copies; inline getTotalSeconds |
| 2 | Dead file/code deletions | PR 2 | Delete ExercisePicker, duplicate Sequence, dead exports, empty divs. Independent of PR 1 |
| 3 | UI dead code removal | PR 3 | Remove placeholder data, dead buttons, decorative icons, motivational card. Independent of PR 1 |

---

## Work Unit 1 — Shared modules + inline replacements (PR 1 → main)

### Create shared modules

- [x] **1.1** Create `src/lib/format.ts` exporting `formatDuration(totalSeconds: number): string` (mm:ss) and `formatTime(seconds: number): string` (MM:SS with leading zeros). Add unit tests in `src/lib/__tests__/format.test.ts`.
- [x] **1.2** Create `src/lib/segment-styles.ts` exporting `SEGMENT_HUES: Record<IntervalType, string>` with Tailwind class prefixes and `SEGMENT_COLORS: Record<IntervalType, string>` with hex values. Add unit tests.
- [x] **1.3** Inline `getTotalSeconds` in `src/hooks/useStats.ts:40-42` into its two callers (lines 46, 75), removing the function.

### Replace inline formatDuration copies

- [x] **1.4** `src/components/DayAssignmentModal.tsx` — remove inline `formatDuration` (L194-198), import from `@/lib/format`.
- [x] **1.5** `src/components/StatsDashboard.tsx` — remove inline `formatDuration` (L10-14), import from `@/lib/format`. Keep `formatHours` in file. Update the `export { formatDuration, formatHours }` at L291 to re-export `formatDuration` from the new module.
- [x] **1.6** `src/app/calendar/page.tsx` — remove inline `formatDuration` (L15-19), import from `@/lib/format`.
- [x] **1.7** `src/app/history/page.tsx` — remove inline `formatDuration` (L18-22), import from `@/lib/format`.
- [x] **1.8** `src/app/history/[id]/page.tsx` — remove inline `formatDuration` (L21-25), import from `@/lib/format`.
- [x] **1.9** `src/app/sequences/page.tsx` — remove inline `formatDuration` (L9-13), import from `@/lib/format`.
- [x] **1.10** `src/app/workouts/page.tsx` — remove inline `formatDuration` (L15-19), import from `@/lib/format`.

### Replace inline formatTime copies

- [x] **1.11** `src/components/TimerRing.tsx` — remove inline `formatTime` (L20-24), import from `@/lib/format`.
- [x] **1.12** `src/app/sequences/[id]/play/page.tsx` — remove inline `formatTime` (L24-28), import from `@/lib/format`.
- [x] **1.13** `src/app/workouts/[id]/play/page.tsx` — remove inline `formatTime` (L23-27), import from `@/lib/format`.

### Replace inline segment color maps

- [x] **1.14** `src/components/IntervalRow.tsx` — remove `SEGMENT_BORDER` (L18-23), `SEGMENT_BG10` (L25-30), `SEGMENT_TEXT` (L32-37), `TYPE_ICON` (L39-44); import from `@/lib/segment-styles`.
- [x] **1.15** `src/components/TimelineStrip.tsx` — remove `SEGMENT_BG` (L11-16) and `LEGEND_COLORS` (L18-23); import from `@/lib/segment-styles`.
- [x] **1.16** `src/components/TimerRing.tsx` — remove `RING_COLORS` (L11-16); import from `@/lib/segment-styles`.
- [x] **1.17** `src/app/sequences/new/page.tsx` — remove `TYPE_COLORS` (L24-29); import from `@/lib/segment-styles`.

### Update tests

- [x] **1.18** `src/components/__tests__/StatsDashboard.test.tsx` — update `formatDuration` import from `@/lib/format` instead of `../StatsDashboard`. `formatHours` import stays from `../StatsDashboard`.

### Verify

- [x] **1.19** Run `npm run test` — all existing tests pass.
- [x] **1.20** Run `tsc --noEmit` — zero errors.

---

## Work Unit 2 — Dead file/code deletions (PR 2 → main)

- [x] **2.1** Delete `src/components/ExercisePicker.tsx` entirely (196 lines, zero callers verified via grep).
- [x] **2.2** `src/types/workout.ts` — remove duplicate `Sequence` interface (L51-59). First declaration (L41-49) remains.
- [x] **2.3** `src/components/WorkoutEditor.tsx` — remove `const markDirty = () => { dirtyRef.current = true }` and `const hasChanges = dirtyRef.current` (L82-83). Keep `dirtyRef` for `beforeunload`.
- [x] **2.4** `src/lib/sequence-engine.ts` — remove `getNextWorkoutId()` (L19-23) and `isComplete()` (L25-27). Verified zero imports via grep.
- [x] **2.5** `src/app/workouts/page.tsx` — remove empty `<div className="flex gap-2 mt-auto pt-2" />` (L146).

### Verify

- [x] **2.6** Run `npm run test` — all tests pass (11 files, 77 tests).
- [x] **2.7** Run `tsc --noEmit` — zero errors.
- [x] **2.8** Grep `ExercisePicker` — zero results in `src/`.

---

## Work Unit 3 — UI dead code removal (PR 3 → main)

- [x] **3.1** `src/components/Nav.tsx` — remove `pb-safe` from className string (L91).
- [x] **3.2** `src/components/PlayHeader.tsx` — remove `volume_up` and `more_vert` icon spans (L21-22).
- [x] **3.3** `src/components/StatsDashboard.tsx` — remove `PLACEHOLDER_PRS` constant (L53-58), "View All" button (L245-248), and "Detailed View" button (L129-132).
- [x] **3.4** `src/app/history/page.tsx` — remove "Filters" button (L168-175) and "This Month" button (L176-186). Both have no-op onClick handlers.
- [x] **3.5** `src/app/calendar/page.tsx` — remove motivational card `<div>` (L335-352).
- [x] **3.6** `src/app/history/[id]/page.tsx` — remove 3 placeholder metric card sections: Calories Active (L160-173), Avg Heart Rate (L174-185), Peak Heart Rate (L186-199).

### Verify

- [x] **3.7** Run `npm run test` — all tests pass (11 files, 77 tests).
- [x] **3.8** Run `tsc --noEmit` — zero errors.
- [ ] **3.9** `gonitail: visual regression` — navigate workouts, history, calendar, sequences, settings pages; each renders without console errors.
