# Design: Phase 4 — Calendar & Programming

## Technical Approach

Day-level weekly calendar with 7-column CSS Grid. `WeekPlan` per-week aggregate stored in localStorage via existing `useLocalStorage` pattern. `DayAssignment` modal uses native `<dialog>`. Pure JS date math — no date libraries. `ProgramTemplate` as reusable week blueprint. Workout/sequence duration computed via existing `flattenWorkout()` at schedule time.

## Architecture Decisions

### Decision: Day-Level Assignment vs Time-Slot Grid

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Time-slot rows (hour-based) | More flexible, overlap logic, heavier UX | ❌ Rejected |
| Day-level (one workout/sequence per day) | Simpler, matches MVP need | ✅ **Chosen** |

**Rationale**: Day-level is simpler, matches the primary use case ("what am I doing Monday?"), and avoids intra-day conflict/overlap logic. Ponytail — minimum useful model. The proposal's time-slot concept deferred until UX validates need for intra-day planning.

### Decision: WeekPlan Aggregate vs Individual ScheduledBlock

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Individual `ScheduledBlock` records | Flexible queries, more writes | ❌ Rejected |
| `WeekPlan` with `days[7]` tuple | Single read loads full week, schema-enforced ordering | ✅ **Chosen** |

**Rationale**: Single localStorage read loads the full week. The 7-tuple guarantees day ordering and week-level consistency. Matches week-at-a-glance UX. Replaces the proposal's `ScheduledBlock` with a simpler aggregate model.

### Decision: ProgramTemplate as Week Blueprint

**Choice**: Full `WeekPlan`-like template with 7 days, applied as bulk copy.
**Alternatives considered**: Single-day template, recurring-rule engine, RFC-style repeat config.
**Rationale**: A reusable week blueprint (e.g. "Push/Pull/Legs", "Upper/Lower") is the primary use case for programming. Bulk-apply to any target week. Simpler than a recurrence engine, and templates can later feed into a recurring scheduler.

### Decision: Native `<dialog>` + CSS Grid

**Choice**: `<dialog>` element and `grid grid-cols-7` from Tailwind.
**Rationale**: Zero dependencies. Native dialog provides built-in focus trap, escape-to-close, and inert behavior. CSS Grid is the right tool for a 7-column layout. Ponytail — stdlib/native first.

### Decision: Pure JS Date Math vs date-fns/luxon

**Choice**: Manual `Date` + integer math.
**Alternatives**: date-fns (68 kB), luxon (93 kB), dayjs (12 kB).
**Rationale**: Four pure functions — getMonday, formatWeekRange, previousWeek, nextWeek. Not worth adding a dependency for trivial arithmetic. Ponytail — stdlib first.

## Data Flow

```
Calendar Page
  │
  ├─ useWeekPlans() ────────── WeekPlan CRUD ──── localStorage("workoutapp.weekplans")
  ├─ useProgramTemplates() ─── Template CRUD ──── localStorage("workoutapp.programtemplates")
  ├─ useWorkoutContext() ───── workouts[] ──────── for modal picker
  ├─ useSequences() ────────── sequences[] ─────── for modal picker
  └─ calendar-utils.ts ─────── pure date helpers (no deps)

DayAssignmentModal (native <dialog>)
  ├─ Radio: Workout list | Sequence list (from context + sequences)
  ├─ Notes textarea
  └─ onAssign(dayIndex, assignment) → useWeekPlans().saveWeekPlan(updated)

Template workflow:
  Template list sidebar → "Apply" → copies template.days[] into target WeekPlan.days[]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modify | Add `DayAssignment`, `WeekPlan`, `ProgramTemplate` |
| `src/hooks/useWeekPlans.ts` | Create | WeekPlan CRUD + `getWeekPlan(date)` auto-creates if missing |
| `src/hooks/useProgramTemplates.ts` | Create | ProgramTemplate CRUD (same pattern as `useWorkouts.ts`) |
| `src/lib/calendar-utils.ts` | Create | `getMonday()`, `formatWeekRange()`, `previousWeek()`, `nextWeek()`, `getDayOfWeek()` |
| `src/components/DayAssignmentModal.tsx` | Create | Native `<dialog>` with radio group, notes, assign/clear/cancel |
| `src/app/calendar/page.tsx` | Create | Calendar page: 7-column grid, week nav, template sidebar, modal |
| `src/app/globals.css` | Modify | Calendar grid utility classes if needed |

## Interfaces / Contracts

```typescript
// Added to src/types/workout.ts
export interface DayAssignment {
  workoutId?: string
  sequenceId?: string
  notes?: string
}

export interface WeekPlan {
  id: string
  title?: string
  startDate: string   // ISO YYYY-MM-DD of the Monday
  days: [DayAssignment | null, DayAssignment | null, DayAssignment | null,
         DayAssignment | null, DayAssignment | null, DayAssignment | null,
         DayAssignment | null]
  createdAt: number
  updatedAt: number
}

export interface ProgramTemplate {
  id: string
  title: string
  description?: string
  days: (DayAssignment | null)[]  // length 7
  createdAt: number
  updatedAt: number
}
```

```typescript
// src/lib/calendar-utils.ts
// ponytail: pure js date math — no date-fns/luxon
export function getMonday(date: Date): string        // ISO YYYY-MM-DD
export function formatWeekRange(startDate: string): string  // "Mar 30 - Apr 5, 2026"
export function previousWeek(startDate: string): string
export function nextWeek(startDate: string): string
export function getDayOfWeek(date: Date): number     // 0=Mon ... 6=Sun
```

**Storage keys**:
- `workoutapp.weekplans` — `WeekPlan[]`
- `workoutapp.programtemplates` — `ProgramTemplate[]`

**WeekPlan `id`**: Derived from startDate, e.g. `week-2026-06-29`. Enables idempotent getWeekPlan.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `calendar-utils.ts` (4 pure functions) | Inline assert-based self-check per existing project pattern (`runEngineTests()` in `interval-engine.ts`) |
| Unit | `useWeekPlans.getWeekPlan()` auto-create | Inline self-check |
| Manual | Grid rendering, modal assign/clear, week nav, template apply | Visual verification |
| Not applicable | No test framework configured (`openspec/config.yaml: runner: null`) | Follow project's test-free pattern |

## Open Questions

- None. Design follows established project patterns (localStorage hooks, inline self-checks) and ponytail discipline (native dialog, CSS Grid, pure JS date math).
