# Proposal: Phase 4 — Calendar & Programming

## Intent

Weekly planning for workouts/sequences. Users can see their week at a glance, schedule templates on specific days, and navigate between weeks. Foundation for future sync, reminders, and recurring schedules.

## Scope

### In Scope
- Weekly calendar grid at `/calendar` — 7-day view with time-slot rows
- Template list (workouts + sequences) on same page — sidebar/tray below the grid
- Tap empty slot → modal always empty for picking template + time
- Tap scheduled block → options: remove or play
- `ScheduledBlock` type for scheduled sessions
- Persistence for scheduled blocks (localStorage `workoutapp.scheduled`)
- Week navigation: prev/next week buttons, default to current week
- Duration uses `flattenWorkout()` for expanded cycle/set-accurate time

### Out of Scope
- Drag-and-drop (tap-to-slot only)
- Recurring schedules, reminders, notifications
- Sync, export, or share
- Month or day views, agenda list

## Capabilities

### New Capabilities
- `calendar-programming`: Weekly schedule view with calendar grid, template list, slot scheduling, and week navigation

### Modified Capabilities
- `workload-data-model`: Add `ScheduledBlock { id, date, startTime, type: 'workout'|'sequence', refId, title, duration }` type
- `local-persistence`: Add `workoutapp.scheduled` key for CRUD on scheduled blocks

## Approach

New `/calendar` client page (`'use client'`). Pure week-grid component renders 7 columns × time-slot rows. Template list (workouts + sequences) renders beside/under the grid from existing `useWorkoutContext` + `useSequences`. Tapping an empty slot opens a native `<dialog>` modal (always empty — user picks template + time). Scheduling creates a `ScheduledBlock` via new `useSchedule` hook backed by `workoutapp.scheduled` localStorage. Duration computed at schedule time via `flattenWorkout()`. Week navigation is a simple `weekOffset` state (`0` = current).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modified | Add `ScheduledBlock` interface |
| `src/hooks/useSchedule.ts` | New | Scheduled block CRUD hook |
| `src/app/calendar/page.tsx` | New | Calendar page (client component) |
| `src/hooks/useLocalStorage.ts` | Unchanged | Reused by useSchedule |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Multiple items in same slot | Low | Simple list per slot, no overlap calc |
| Template deleted after scheduling | Low | Scheduled block keeps a snapshot title |

## Rollback Plan

Revert all files listed above. localStorage keys are additive — no migration needed. If the page breaks, remove `/calendar` route folder.

## Dependencies

None.

## Success Criteria

- [ ] `/calendar` renders current 7-day week with time columns
- [ ] Templates (workouts + sequences) listed alongside the grid
- [ ] Empty slot tap → modal → schedule persists to localStorage
- [ ] Week prev/next buttons change grid correctly
- [ ] Duration shows `flattenWorkout()` expanded time
- [ ] All existing pages (`/workouts`, `/sequences`, `/history`) unchanged
