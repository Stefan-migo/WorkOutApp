# Tasks: Phase 4 — Test Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250–350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | 3 Vitest test files for core lib modules | PR 1 | Single PR, all independent, well under 400 lines |

## Phase 1: Test Files — Core Lib Modules

- [x] 1.1 Create `src/lib/__tests__/interval-engine.test.ts` — migrated inline `runEngineTests()` asserts to `describe`/`it`/`expect`. Covers `flattenWorkout`, `totalDuration`, `durationAt`, including empty input, flat passthrough, cycle/set expansion, rest insertion, nested DFS, mixed structure, and boundary values (elapsed at/outside range). 13 tests.
- [x] 1.2 Create `src/lib/__tests__/sequence-engine.test.ts` — migrated inline asserts from `runEngineTests()`. Covers `getTotalRounds`, `getRoundAt`, `getProgress`, `resolveWorkouts` with empty sequence, single workout, repeat counts, negative/out-of-bounds indices, missing workout IDs, progress capping at 100%. 16 tests.
- [x] 1.3 Create `src/lib/__tests__/calendar-utils.test.ts` — proper Vitest tests covering `getMonday` (Monday self, midweek, Sunday, year boundary), `formatWeekRange` (same week, cross-month, cross-year), `previousWeek`/`nextWeek`, `getDayOfWeek` (Mon–Sun). 18 tests.
- [x] 1.4 Run `npm test` — all 3 new test files pass, existing tests show no regressions (150 total tests, 0 failures).

## Review Notes

- Inline `runEngineTests()` and `runCalendarTests()` in the source files are **kept as-is** — removing them would be a production code change outside scope. Future cleanup PR can delete them.
- Test style follows existing `src/lib/__tests__/export-data.test.ts` conventions: `import { describe, it, expect } from 'vitest'`, no test setup helpers beyond what's needed.
- Each test file mirrors the exact scenarios from the inline self-checks plus edge cases not covered by the inline asserts.
