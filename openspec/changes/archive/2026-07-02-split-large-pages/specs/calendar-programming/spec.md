# Delta for Calendar Programming

**Type**: Refactoring — zero behavior change

## Refactoring Overview

Extract inline sub-components from a single 553-line page into dedicated files. All requirements (CP-1 through CP-4, CU-T1 through CU-T4) and their scenarios from `openspec/specs/calendar-programming/spec.md` remain **unchanged** in behavior. Only code organization changes.

## Structural Changes

| Extraction | Target | Exported As | Receives |
|------------|--------|-------------|----------|
| `DayRow` (day cell rendering) | `src/components/DayRow.tsx` | Named export `DayRow` | `day`, `weekStart`, `onDayClick`, etc. as props |
| `TodaysFocus` (today's workout card) | `src/components/TodaysFocus.tsx` | Named export `TodaysFocus` | `todayData`, `onStartWorkout` as props |
| `WeekNav` (prev/next week navigation) | `src/components/WeekNav.tsx` | Named export `WeekNav` | `weekStart`, `onPrev`, `onNext` as props |
| `TemplatesPanel` (template sidebar) | `src/components/TemplatesPanel.tsx` | Named export `TemplatesPanel` | `templates`, `onSave`, `onApply`, `onDelete` as props |
| `UpcomingList` (upcoming days list) | `src/components/UpcomingList.tsx` | Named export `UpcomingList` | `days`, `workouts`, `sequences` as props |

### Utility Migration

`deriveTypeLabel(type: WorkoutType | SequenceType): string` moves from page-level helper to `src/lib/calendar-utils.ts`. Pure function — same signature, same implementation. Shared by `DayRow` and `UpcomingList` after extraction.

### File Impact

| File | Before | After | Change |
|------|--------|-------|--------|
| `src/app/calendar/page.tsx` | ~553 lines | ~220 lines | Inline components removed, imports added |
| `src/lib/calendar-utils.ts` | — | +~5 lines | `deriveTypeLabel` added |

### Verification

- `next build` passes with zero errors
- Calendar page renders identically before and after extraction
- All calendar-programming spec scenarios remain testable without modification

## Affected Requirements

No requirements are ADDED, MODIFIED, REMOVED, or RENAMED. All existing requirements in `openspec/specs/calendar-programming/spec.md` remain in full effect.
