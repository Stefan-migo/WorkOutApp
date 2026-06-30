# Tasks: Phase 4 — Calendar & Programming

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 380–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation) → PR 2 (UI) |
| Delivery strategy | ask-on-risk → resolved: stacked-to-main |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + utils + hooks | PR 1 | Foundation: `workout.ts` types, `calendar-utils.ts`, `useWeekPlans.ts`, `useProgramTemplates.ts` |
| 2 | Modal + calendar page + CSS | PR 2 | UI layer: `DayAssignmentModal.tsx`, `calendar/page.tsx`, globals.css tweaks |

PR 1 base = `main`; PR 2 base = `main` (or stacked on PR 1 branch if reviewing sequentially).

## Phase 1: Foundation — Types & Utils

- [x] **1.1** `src/types/workout.ts`: Add `DayAssignment`, `WeekPlan`, `ProgramTemplate` interfaces per design contract
- [x] **1.2** `src/lib/calendar-utils.ts`: Implement `getMonday()`, `formatWeekRange()`, `previousWeek()`, `nextWeek()`, `getDayOfWeek()` — pure JS Date math, no deps. Add inline `runCalendarTests()` self-check per project pattern
- [x] **1.3** `src/hooks/useWeekPlans.ts`: CRUD hook via `useLocalStorage('workoutapp.weekplans')` — `saveWeekPlan()`, `deleteWeekPlan()`, `getWeekPlan(date)` auto-creates 7-empty-day WeekPlan on miss with `week-YYYY-MM-DD` id scheme
- [x] **1.4** `src/hooks/useProgramTemplates.ts`: CRUD hook via `useLocalStorage('workoutapp.programtemplates')` — `saveTemplate()`, `deleteTemplate()`, same CRUD pattern as `useWorkouts.ts`

## Phase 1.5: Dependencies for UI (added — Sequence type + hook needed by modal)

- [x] **1.5** `src/types/workout.ts`: Add `Sequence` interface (from Phase 2 — needed for stale reference check and modal)
- [x] **1.6** `src/hooks/useSequences.ts`: CRUD hook via `useLocalStorage('workoutapp.sequences')` (same pattern as `useWorkouts.ts`)

## Phase 2: UI — Modal & Calendar Page

- [x] **2.1** `src/components/DayAssignmentModal.tsx`: Native `<dialog>` with radios for workouts list / sequences list, notes `<textarea>`, Assign / Clear / Cancel buttons. Props: `dayIndex`, `currentAssignment`, `onAssign(dayIndex, assignment)`, `onClear(dayIndex)`, `onClose()`, `workouts`, `sequences`
- [x] **2.2** `src/app/calendar/page.tsx`: `'use client'` — week state via `currentMonday` + prev/next nav; 7-column CSS grid day cells showing workout title+duration or "Rest" badge; integrates modal for assign/clear; template sidebar: list, apply, save-with-title-prompt, delete; stale reference shows "(deleted)"
- [x] **2.3** `src/app/globals.css` (if needed): No changes needed — Tailwind `grid grid-cols-7` covers the layout
