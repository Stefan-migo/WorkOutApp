# Audit Fix Plan — SDD Phase Breakdown

> Date: 2026-07-01
> Source audits: `docs/audit-ponytail.md`, `docs/audit-frontend-backend-gap.md`, `docs/audit-architecture.md`

## Strategy

Each phase is an **independent SDD cycle** (proposal → spec → design → tasks → apply → verify → archive). Each phase produces a mergeable state with no regressions. Phases are ordered by risk/reward: clean mechanical work first, UX fixes second, infrastructure hardening third, testing last.

---

## Phase 1: 🧹 Dead Code & Deduplication

**Goal**: Remove ~420 lines of dead code. Zero behavior changes.

**Scope**:
1. Delete `ExercisePicker.tsx` (196 lines — never imported)
2. Remove duplicate `Sequence` interface from `workout.ts`
3. Consolidate `formatDuration`/`formatTime` into `src/lib/format.ts` (merge 10 copies → 1)
4. Consolidate `IntervalType`→color maps into `src/lib/segment-styles.ts` (merge 12+ maps → 1)
5. Delete dead code:
   - `markDirty` / `hasChanges` from `WorkoutEditor.tsx`
   - `getNextWorkoutId()` / `isComplete()` from `sequence-engine.ts`
   - Empty `<div>` in `workouts/page.tsx`
   - `pb-safe` from `Nav.tsx`
   - Decorative `volume_up`/`more_vert` from `PlayHeader.tsx`
   - `getTotalSeconds` inline into caller in `useStats.ts`
6. Remove `PLACEHOLDER_PRS` and "View All"/"Detailed View" buttons from `StatsDashboard.tsx`

**Risk**: Low. Pure deletions + extractions. TypeScript will catch any missed references.

**Test impact**: Some tests may reference deleted code — update imports to point to shared files.

---

## Phase 2: 🖼️ Fix Placeholder UI & Frontend Gaps

**Goal**: Every button and UI element actually works or is removed. No more misleading UX.

**Scope**:
1. **StatsDashboard**: 
   - Rename "Export CSV" → "Export JSON" (accurate label)
   - Remove "Detailed View" button (no handler)
   - Remove "View All" link (no handler)
   - Remove `PLACEHOLDER_PRS` section (no PR data model yet)
2. **History page**: Remove "Filters" and "This Month" buttons (empty onClick)
3. **History detail**: Replace 3 placeholder metric cards (Calories, Avg HR, Peak HR) with single "Coming soon" card or remove them
4. **Calendar sidebar**: Remove hardcoded motivational card or compute real streak data from sessions
5. **Exercises page**: Fix "Add to Workout" to either:
   - Actually add the exercise to a new workout (prepopulate)
   - Or change label to "Create Workout with this exercise"

**Risk**: Medium. Touches UX. Need to verify no visual regressions.

**Test impact**: Update any snapshots or tests referencing removed elements.

---

## Phase 3: 🔧 Architecture Hardening

**Goal**: Catch bugs earlier, prevent data loss, and align CSS with design tokens.

**Scope**:
1. **tsconfig.json**: Add `noUnusedLocals: true`, `noUnusedParameters: true`, `noUncheckedIndexedAccess: true`
2. **globals.css**: 
   - Replace hardcoded `body` colors with `var(--color-background)` / `var(--color-on-background)`
   - Fix duplicate `--font-*` definitions
   - Make `glass-card` use `--color-surface` and `--color-outline-variant`
3. **ErrorBoundary**: Add global `<ErrorBoundary>` to `layout.tsx`
4. **useLocalStorage.ts**: 
   - Use lazy initializer to prevent flash of default state
   - Add `console.warn` on quota errors (data loss prevention)
5. **Optional**: Rename `--spacing-*` keys to avoid shadowing `max-w-*` utilities

**Risk**: Medium. TypeScript strictness may surface new errors (fix them, don't suppress). Error boundary is additive (safe).

---

## Phase 4: 🧪 Test Migration

**Goal**: Move all inline self-checks to proper Vitest tests that run in CI. Cover the persistence layer.

**Scope**:
1. **interval-engine.test.ts**: Migrate `runEngineTests()` inline asserts to proper Vitest `describe`/`it`/`expect` blocks
2. **sequence-engine.test.ts**: Same migration
3. **calendar-utils.test.ts**: New tests for `getMonday`, `formatWeekRange`
4. **useLocalStorage.test.ts**: Tests for get/set/delete, quota error handling, JSON parse errors, default values
5. **Run `vitest run`** — verify 0 failures with new tests included

**Risk**: Low. Adding tests doesn't change production code. Coverage improves from current to >80% for lib/ modules.

---

## Phase 5: 🎯 Refactoring (Post-Audit — Optional)

**Goal**: Architectural improvements for long-term maintainability. NOT part of mandatory audit fix — do only if the user requests it.

**Scope**:
1. **WorkoutEditor**: Extract `useIntervals` hook or `useReducer` for interval manipulation (415 lines → ~250)
2. **Dashboard**: Extract `HeroCard`, `MiniCalendarWidget`, `QuickActions`, `UpNextCard` (261 lines → ~80)
3. **Server/client split**: Move `layout.tsx` to server component, only mark `'use client'` where interactivity lives
4. **Material Symbols**: Bundle only used ~20 icons instead of full CDN
5. **Dark mode**: Add `prefers-color-scheme: dark` CSS variables
6. **next/font**: Self-host Inter + JetBrains Mono to eliminate FOUT

**Risk**: Medium-High. Refactoring touches working code. Must be done after tests are in place (Phase 4).

---

## Delivery Order

```
Phase 1 (🧹 Cleanup) → Phase 2 (🖼️ UI Fix) → Phase 3 (🔧 Hardening) → Phase 4 (🧪 Tests) → [Phase 5 — Optional]
```

Each phase is:
- A full SDD cycle (proposal → spec → design → tasks → apply → verify → archive)
- Independently mergeable (no cross-phase dependencies except Phase 5 needs Phase 4)
- Run via `/sdd-new <phase-name>` for exploration + proposal, then `/sdd-ff` for fast-forward planning

---

## File Change Estimates

| Phase | Files changed | Lines removed | Lines added | Net |
|-------|---------------|---------------|-------------|-----|
| 1: Cleanup | ~15 | ~450 | ~80 | **-370** |
| 2: UI Fix | ~6 | ~100 | ~20 | **-80** |
| 3: Hardening | ~6 | ~30 | ~60 | **+30** |
| 4: Tests | ~10 | ~50 | ~250 | **+200** |
| **Total** | **~37** | **~630** | **~410** | **-220** |
