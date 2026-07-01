# Delta Spec: Phase 1 — Dead Code & Deduplication

## Overview

Zero-behavior-change cleanup. Removes dead code, extracts duplicated utilities, inlines single-use helpers.

## Requirements

### CD-1: Remove ExercisePicker.tsx

Delete `src/components/ExercisePicker.tsx` entirely (196 lines, zero callers).

- MUST verify no imports reference this file.
- **Scenario**: grep for `ExercisePicker` — MUST return no results outside the deleted file.

### CD-2: Remove Duplicate Sequence Interface

Remove the second `Sequence` declaration at `src/types/workout.ts:51-59`. The first (lines 41-49) MUST remain.

- **Scenario**: `tsc --noEmit` — MUST pass with 0 errors.

### CD-3: Extract formatDuration/formatTime

Create `src/lib/format.ts` exporting `formatDuration(totalSeconds: number): string` and `formatTime(seconds: number): string`.

- Replace all 10 inline copies across the codebase with imports from the shared module.
- Each replacement MUST produce identical formatted output.
- **Scenario**: `vitest run` — all tests MUST pass.

### CD-4: Extract IntervalType→Color Maps

Create `src/lib/segment-styles.ts` exporting base hue constants for interval types (`prepare`, `work`, `rest`, `cooldown`).

- Replace 12+ inline `Record` declarations with imports from the shared module.
- Each consumer SHOULD derive Tailwind class suffixes from the base hue.
- **Scenario**: `vitest run` — all tests MUST pass.

### CD-5: Delete Dead State from WorkoutEditor

Remove `markDirty` and `hasChanges` from `src/components/WorkoutEditor.tsx:82-83`.

- The `beforeunload` handler reads `dirtyRef.current` — MUST remain intact.
- **Scenario**: `tsc --noEmit` — MUST pass with 0 errors.

### CD-6: Delete Dead Exports from sequence-engine

Remove `getNextWorkoutId()` and `isComplete()` from `src/lib/sequence-engine.ts:19-27`.

- MUST verify no imports reference these functions via grep.
- **Scenario**: `tsc --noEmit` — MUST pass with 0 errors.

### CD-7: Delete Empty Div from workouts/page

Remove the empty `<div className="flex gap-2 mt-auto pt-2" />` at `src/app/workouts/page.tsx:146`.

- **Scenario**: Page renders identically — visual diff confirms no change.

### CD-8: Delete Dead pb-safe Class from Nav

Remove `pb-safe` className reference from `src/components/Nav.tsx:91`. Not defined anywhere — no replacement needed.

- **Scenario**: `tsc --noEmit` — MUST pass with 0 errors.

### CD-9: Delete Decorative Icons from PlayHeader

Remove `volume_up` and `more_vert` icon spans from `src/components/PlayHeader.tsx:21-22`. No onClick, no aria role — pure decoration.

- **Scenario**: `tsc --noEmit` — MUST pass with 0 errors.

### CD-10: Remove Placeholder Data from StatsDashboard

Remove `PLACEHOLDER_PRS` data, "View All" button, and "Detailed View" button from `src/components/StatsDashboard.tsx`.

- **Scenario**: Component renders without these elements — visual diff confirms no regression.

### CD-11: Inline getTotalSeconds

Inline `getTotalSeconds(d: Duration): number` from `src/hooks/useStats.ts:40-42` into its single caller (line 46).

- MUST compute `(hours * 3600) + (minutes * 60) + seconds` identically.
- **Scenario**: `vitest run` — all tests MUST pass.

### CD-12: Remove Dead UI from History Page

Remove "Filters" button and "This Month" button from `src/app/history/page.tsx:168-186` — both have onClick with no handler.

- **Scenario**: Page renders without these buttons — visual diff confirms no regression.

### CD-13: Remove Motivational Card from Calendar

Remove the hardcoded motivational card from `src/app/calendar/page.tsx:335-352` — always shows "On track for a 4-week streak" with no real data backing.

- **Scenario**: Calendar sidebar renders without the card — visual diff confirms no regression.

### CD-14: Remove Placeholder Metric Cards from History Detail

Remove or collapse the 3 placeholder metric cards (Calories, Avg HR, Peak HR) from `src/app/history/[id]/page.tsx:160-199` — all show `—` with no real data.

- **Scenario**: Page renders without empty metric cards — visual diff confirms no regression.

## Test Scenarios

### TS-1: TypeScript Compilation

- GIVEN all deletions and extractions are applied
- WHEN running `tsc --noEmit`
- THEN exit code MUST be 0

### TS-2: Existing Tests

- GIVEN all changes applied
- WHEN running `vitest run`
- THEN all existing tests MUST pass

### TS-3: Visual Regression

- GIVEN the app builds with `next build`
- WHEN navigating to all pages (workouts, history, calendar, sequences, settings)
- THEN each page renders without console errors and matches the pre-cleanup layout
