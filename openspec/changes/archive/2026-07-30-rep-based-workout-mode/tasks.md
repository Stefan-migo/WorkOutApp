# Tasks: Rep-Based Workout Mode

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~820 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (types+editor) → PR 2 (play mode) → PR 3 (cycles+integration) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + Editor (core data model, reducer, editor components) | PR 1 | Base: main. Tests included per TDD. |
| 2 | Play Mode (runner bifurcation, RepCounter, RepCompleteDialog, rest controls) | PR 2 | Base: main. Depends on types from PR 1 but types are backward-compat optional fields — no source merge needed between PRs. |
| 3 | Cycles + Edge Cases (expandCycle, sequence fallback, integration tests) | PR 3 | Base: main. Depends on both PR 1 and PR 2. |

---

## PR 1 — Types + Editor (~350 líneas)

### Phase 1: Foundation — Type Extensions (TDD: test first)

- [x] **1.1** `src/types/workout.ts` — Add `WorkoutMode = 'timed' | 'reps'`, optional `mode` on `Workout` and `Interval`, optional `reps`/`weight` on `Interval`, optional `plannedReps`/`actualReps`/`weight` on `CompletedInterval`, optional `workMode` on `CycleTemplate`. All optional (backward compat).
  - CA: types compile, existing tests pass without changes.
  - Deps: none
  - Esfuerzo: ~15 líneas

- [x] **1.2** `src/lib/interval-engine.ts` — Add `getEffectiveMode(workout, interval): WorkoutMode` helper: `interval.mode ?? workout.mode ?? 'timed'`. Test 4 cases: no mode, workout mode, interval override, mixed.
  - CA: `getEffectiveMode` returns correct cascade for all 4 cases.
  - Deps: 1.1
  - Esfuerzo: ~20 líneas (5 code + 15 test)

- [x] **1.3** `src/lib/workout-reducer.ts` — Add `SET_MODE` action type + handler to change `workout.mode`. Test: dispatch `SET_MODE('reps')` updates mode.
  - CA: reducer handles `SET_MODE`, existing actions unchanged.
  - Deps: 1.1
  - Esfuerzo: ~15 líneas

### Phase 2: Editor Components (TDD: test first)

- [x] **1.4** `src/components/IntervalRow.tsx` — Show reps badge (`{reps} reps`) on intervals with `reps` value. Hide duration display for work intervals with reps. Test: renders badge when reps present, hides when absent.
  - CA: interval with reps=10 shows "10 reps". Legacy interval shows duration as before.
  - Deps: 1.1
  - Esfuerzo: ~25 líneas (15 code + 10 test)

- [x] **1.5** `src/components/IntervalDetailSheet.tsx` — For work intervals when effective mode is `'reps'`, show reps input + optional weight input. Hide duration field for those. Test: mode=reps renders reps field. mode=timed renders duration.
  - CA: mode=reps shows reps+weight inputs, hides duration. mode=timed shows duration, hides reps.
  - Deps: 1.1, 1.2
  - Esfuerzo: ~70 líneas (50 code + 20 test)

- [x] **1.6** `src/components/WorkoutEditor.tsx` — Mode toggle (`timed`/`reps`) in header. Dispatch `SET_MODE`. Pass effective mode down to `IntervalDetailSheet`. Bulk apply incluye reps defaults for new intervals. Test: toggle changes mode, new work intervals get reps default.
  - CA: header shows toggle, clicking changes mode, new intervals in reps mode show reps input.
  - Deps: 1.3, 1.5
  - Esfuerzo: ~80 líneas (60 code + 20 test)

- [x] **1.7** `src/components/WorkoutBuilder.tsx` — `CycleTemplate` gets `workMode` field. Propagate in `expandCycle` to interval `mode`. Test: cycle with workMode='reps' expands to intervals with mode='reps'.
  - CA: building a cycle with workMode='reps' produces intervals with reps mode. Legacy cycles still show timed.
  - Deps: 1.1, 1.2
  - Esfuerzo: ~50 líneas (35 code + 15 test)

### PR 1 Verification
- `npm run test` green
- Editor opens legacy workout (no mode) → shows timed toggle, no reps
- Toggle to reps → work intervals show reps input
- Build cycle with reps → intervals have mode='reps'

---

## PR 2 — Play Mode (~320 líneas)

### Phase 3: Play Mode Components (TDD: test first)

- [x] **2.1** `src/components/RepCounter.tsx` (NEW) — Display exercise name + target reps + "Complete" button. Test: renders exercise name, target reps, Complete button.
  - CA: shows "Bench Press — 10 reps" + [Complete] button.
  - Deps: 1.1
  - Esfuerzo: ~50 líneas (40 code + 10 test)

- [x] **2.2** `src/components/RepCompleteDialog.tsx` (NEW) — Dialog on Complete: `actualReps` input (default: plannedReps) + optional `weight` input. On confirm → callback. On cancel → skip. Test: default is plannedReps, weight optional, cancel fires onSkip.
  - CA: dialog shows with plannedReps prefilled, confirm calls onComplete(actualReps, weight), cancel calls onSkip.
  - Deps: 1.1
  - Esfuerzo: ~60 líneas (45 code + 15 test)

- [x] **2.3** `src/components/TimerControls.tsx` — Add `onAddTime?: (delta: number) => void` prop. During rest intervals, render +10/+20/+30 buttons. Test: clicking +20 calls `onAddTime(20)`.
  - CA: rest intervals show addTime buttons, work intervals do not. Clicking adds the delta.
  - Deps: none (new prop, backward compat)
  - Esfuerzo: ~25 líneas (15 code + 10 test)

- [x] **2.4** `src/components/TimerRing.tsx` — Hide (render null) when interval mode=reps AND type=work. Test: reps+work renders null, timed+work renders ring.
  - CA: RepCounter replaces ring for reps work intervals. Rest intervals still show ring.
  - Deps: 1.2
  - Esfuerzo: ~15 líneas (10 code + 5 test)

### Phase 4: Play Page Wiring

- [x] **2.5** `src/app/workouts/[id]/play/page.tsx` — Bifurcate per interval: `getEffectiveMode(workout, interval) === 'reps' && type === 'work'` → render `RepCounter` + on Complete → `RepCompleteDialog` → save `CompletedInterval` with `plannedReps, actualReps, weight`. Rest/timed intervals use existing timer. Rest intervals pass `addTime` to TimerControls. Test: reps work shows RepCounter, timed work shows timer, rest shows addTime buttons.
  - CA: full play loop works for both modes. Legacy timed workouts play identically.
  - Deps: 2.1, 2.2, 2.3, 2.4
  - Esfuerzo: ~130 líneas (100 code + 30 test)

### PR 2 Verification
- Play reps workout → work intervals show RepCounter + Complete
- Complete → dialog with actualReps prefilled
- Confirm → advances to rest interval with +10/+20/+30 buttons
- Legacy timed workout → plays identically to before

---

## PR 3 — Cycles + Edge Cases (~150 líneas)

### Phase 5: Cycles + Fallbacks

- [x] **3.1** `src/lib/detect-cycles.ts` o `src/lib/interval-engine.ts` — `expandCycle` propagates `workReps`/`workWeight` from `CycleTemplate` to expanded intervals. Test: cycle with workReps=10 expands to intervals with reps=10.
  - CA: expanding a cycle with reps produces intervals with those reps values.
  - Deps: 1.7
  - Esfuerzo: ~35 líneas (25 code + 10 test)

- [x] **3.2** `src/app/workouts/[id]/play/page.tsx` — Sequence play: detect reps-mode workout in sequence, fallback to timed (ignore mode). Test: sequence containing reps workout plays as timed.
  - CA: reps workout inside a sequence runs all intervals as timed (no RepCounter).
  - Deps: 2.5
  - Esfuerzo: ~30 líneas (20 code + 10 test)

### Phase 6: Integration Tests

- [x] **3.3** `src/app/workouts/[id]/play/__tests__/page.test.tsx` — Add integration describe blocks: legacy timed full play, pure reps flow (Complete → dialog → advance), mixed cycle (timed work + reps work + rest), cancel dialog (skip, no data saved). Mock `saveSession` for assertion.
  - CA: all spec scenarios covered by integration tests.
  - Deps: 3.1, 3.2
  - Esfuerzo: ~70 líneas

### PR 3 Verification
- Cycle with reps expands correctly
- Sequence with reps workout plays as timed
- `npm run test` full green
- Manual E2E: create reps workout, play it, verify session saved with rep data

---

## Summary

| PR | Tasks | Focus | Est. Lines |
|----|-------|-------|-----------|
| PR 1 | 1.1–1.7 | Types + Editor | ~350 |
| PR 2 | 2.1–2.5 | Play Mode | ~320 |
| PR 3 | 3.1–3.3 | Cycles + Integration | ~150 |
| **Total** | **15** | | **~820** |

### Sequencing

PR 1 → PR 2 → PR 3 (stacked-to-main). Each PR builds on types from PR 1 but since all new fields are optional, they compile independently — no cross-PR merge dependency. PR 3 requires both PR 1 and PR 2 features to exist for integration tests.

### Note

History UI (SH-7, SH-3 from spec) explicitly deferred — not in scope per design decision.
