# Proposal: Rep-Based Workout Mode

## Intent

Strength training isn't timed — it's rep-based. WorkOutApp today is purely timed (Tabata/HIIT model). Users doing strength, powerlifting, or bodybuilding can't track reps and weight per set. This change adds a `mode` toggle on workouts so each workout can be `timed` (existing behavior) or `reps` (new), with work intervals showing target reps + weight input on completion.

## Scope

### In Scope
1. **Type system**: `WorkoutMode = 'timed' | 'reps'` on `Workout`. `Interval.reps?` (nullable, only for work intervals). `CompletedInterval.plannedReps`, `actualReps`, `weight` fields.
2. **Editor mode toggle**: Workout editor header with `timed`/`reps` switch. When `reps`, work intervals show reps input instead of duration. Non-work intervals keep duration.
3. **Play mode — rep flow**: Work intervals display exercise + target reps. "Complete" button advances interval. Post-completion dialog asks *"How many reps?"* (default: planned) + optional weight field.
4. **Workout header display**: Duration badge on rep-based workouts shows `N exercises · M total reps` instead of total time.
5. **Session tracking**: `CompletedInterval` stores `plannedReps`, `actualReps`, `weight` for rep-mode intervals. History UI shows rep/weight data.
6. **Mixed cycles**: Per-interval mode override — cycle can mix rep-based and timed work intervals (e.g., 12 reps push-ups + 30s plank).

### Out of Scope
- UI/UX polish with Storybook (separate phase)
- Sequence-mode reps (sequences stay timed only)
- Drag & drop reordering improvements
- Rep-based warmup/cooldown
- Rest timer customization per rep interval

## Capabilities

### New Capabilities
- `rep-based-workout-mode`: Workout-level `timed`/`reps` mode, editor changes, rep tracking in play mode, post-work rep input dialog, mixed-cycle support

### Modified Capabilities
- `workload-data-model`: Add `WorkoutMode`, `Interval.reps`, extend `CompletedInterval` with rep/weight fields
- `workout-editor`: Add mode toggle header, reps field on work intervals, conditional duration/reps UI
- `active-timer`: Add "Complete" button behavior, post-completion rep dialog, non-timer flow for work intervals
- `session-history`: Display rep and weight data in history detail
- `interval-engine`: No spec-level changes (pure functions unchanged)

## Approach

**Phase 1 — Types + Editor**: Add `WorkoutMode` type, extend `Workout` and `CompletedInterval`, add mode toggle in editor, reps field in bottom-sheet for work intervals. Legacy workouts default to `timed`.

**Phase 2 — Play mode**: New play path for rep-mode workouts: show exercise + reps, "Complete" button skips timer, post-completion dialog saves reps/weight. Session save writes new `CompletedInterval` fields.

**Phase 3 — Mixed cycles**: Per-interval `mode` override. Editor shows rep toggle on work intervals. Play route detects mixed intervals and switches between timer and rep-complete UI per interval.

**Phase 4 — Tests**: Unit + integration for types, editor mode logic, play mode rep flow, session save, legacy backward compat, mixed-cycle edge cases.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/workout.ts` | Modified | Add `WorkoutMode`, `reps` on `Interval`, extend `CompletedInterval` |
| `src/app/workouts/[id]/edit/page.tsx` | Modified | Mode toggle in editor header |
| `src/components/workout/WorkoutEditor.tsx` | Modified | Conditional reps/duration UI in bottom-sheet |
| `src/components/workout/IntervalDetailSheet.tsx` | Modified | Reps field for work intervals in reps mode |
| `src/app/workouts/[id]/play/page.tsx` | Modified | Mode-aware play: timer vs rep complete |
| `src/hooks/useTimer.ts` | Modified | Skip interval when mode=reps (no countdown for work) |
| `src/components/timer/ExercisePanel.tsx` | Modified | "Complete" button + post-completion dialog |
| `src/types/session.ts` | Modified | Save rep/weight in `CompletedInterval` |
| `src/components/history/SessionDetailPage.tsx` | Modified | Display rep/weight data |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legacy workouts without `mode` break | Low | Default `mode: 'timed'` in type + deserialization. Opt-out field, not breaking |
| JSONB backward compat in Supabase | Low | `mode` is optional JSONB key. Missing = `timed`. New fields nullable |
| Play mode progress UX with rep intervals | Medium | No countdown on work intervals feels like "stuck". Mitigate: show exercise + reps prominently, "Complete" button always visible, auto-advance on tap |
| Sequences with rep-mode workouts in cycle | Low | Sequences remain timed-only. Rep-mode workouts inside sequences fall back to timed |
| Rep input dialog blocks flow | Medium | Dialog is immediate after Complete, has default value, Cancel skips to next. No mandatory weight field |

## Rollback Plan

1. Revert `src/types/workout.ts` to remove `mode`, `reps`, new `CompletedInterval` fields
2. Revert editor changes (mode toggle, reps field)
3. Revert play mode changes (Complete button, dialog)
4. Existing sessions with rep data stay in DB — ignored by old code (extra JSONB keys are harmless)

## Dependencies

- None external. Pure type additions + component changes.

## Success Criteria

- [ ] All 32 existing specs tests pass unchanged (backward compatible)
- [ ] New rep-based workout creates, edits, saves, and loads correctly
- [ ] Play mode for rep workout shows exercise + reps, "Complete" advances, dialog saves data
- [ ] Mixed-cycle workout plays timer intervals as timer and rep intervals as rep-complete
- [ ] Session history shows rep/weight columns for rep-mode intervals
- [ ] Legacy workouts (no mode) load and play as `timed` without error
