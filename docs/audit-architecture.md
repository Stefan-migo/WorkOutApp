# Audit: Architecture & Code Quality

> Date: 2026-07-01
> Scope: Full architecture review — types, contexts, components, hooks, lib, config, tests, CSS

---

## 1. Architecture & Patterns

### 🔴 WorkoutContext underutilized
**File**: `src/context/WorkoutContext.tsx`

The context only exposes `useWorkouts` — but the app has 6+ entity hooks (sessions, weekPlans, exercises, sequences, programTemplates, stats). The Dashboard page calls `useWorkoutContext()`, `useSessions()`, and `useWeekPlans()` separately. The context wraps everything but provides minimal value.

**Fix**: Either remove the context and call hooks directly (simpler, more honest), or extend it to cover all entities.

### 🔴 Dashboard page — 261-line monolith
**File**: `src/app/page.tsx`

Dashboard has bento grid layout, greeting logic, weekProgress calc, session filtering, and multiple cards all inline. No component extraction.

**Fix**: Split into `HeroCard`, `MiniCalendarWidget`, `QuickActions`, `UpNextCard`.

### 🔴 WorkoutEditor — 415 lines, mixed concerns
**File**: `src/components/WorkoutEditor.tsx`

10+ inline handlers for interval manipulation (add, remove, move, cycle, child ops), render of interval tree with cycle blocks, timeline strip, detail sheet, and add-block UI. All in one file.

**Fix**: Extract interval manipulation logic into `useIntervals(initial: Interval[])` hook or use `useReducer`.

### 🟡 100% `'use client'` — no server components
**File**: All pages and components

The entire app is client-rendered. Next.js App Router is not leveraged for static/server rendering. Even the layout could be a server component with a client child.

**Fix**: Move layout metadata and static shell to server components. Only mark `'use client'` where interactivity is needed.

### 🟡 Container/presentational inconsistency
Some components are purely presentational (TimerRing ✅, ProgressBar ✅), others mix logic and rendering (StatsDashboard, WorkoutEditor).

---

## 2. TypeScript Quality

### 🔴 Duplicated `Sequence` interface
**File**: `src/types/workout.ts:41-49` and `:51-59`

The `Sequence` interface is defined twice, identically.

**Fix**: Delete lines 51-59.

### 🟡 Strict mode incomplete
**File**: `tsconfig.json`

`strict: true` is set, but missing:
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noUncheckedIndexedAccess: true`

**Fix**: Add these to catch dead code and unsafe access at compile time.

### 🟡 Optional props with overload in IntervalRow
**File**: `src/components/IntervalRow.tsx`

8 props, only 3 required. `onMoveUp?`, `onMoveDown?`, `isFirst?`, `isLast?` are technically optional but always passed.

**Fix**: Either make them required or group into `movement?: { onMoveUp, onMoveDown, isFirst, isLast }`.

### 🔵 No `any` types in the codebase ✅
All type escapes use `unknown` or are properly typed. Good discipline.

---

## 3. Code Quality & Maintenance

### 🟠 Duplicated SEGMENT_* maps
**Files**: `TimelineStrip.tsx`, `IntervalRow.tsx`, `WorkoutEditor.tsx`

The same `Record<string, string>` mappings for interval type colors exist in 3+ files. Adding a new interval type requires updating every copy.

**Fix**: Move to a shared constant, e.g. `src/lib/segment-styles.ts`.

### 🟠 10 handlers in WorkoutEditor without useReducer
**File**: `src/components/WorkoutEditor.tsx`

`handleAdd`, `handleChange`, `handleRemove`, `handleMoveUp`, `handleMoveDown`, `handleCycleCountChange`, `handleChildChange`, `handleRemoveChild`, `handleChildMoveUp`, `handleChildMoveDown` — all mutate `intervals` via `setIntervals(prev => ...)`.

**Fix**: `useReducer` with typed actions (`ADD_INTERVAL`, `REMOVE_INTERVAL`, `MOVE_UP`, `MOVE_DOWN`, etc.).

### 🟡 No Error Boundaries
The app has zero error boundaries. If `useLocalStorage` throws or a hook crashes, the entire app white-screens.

**Fix**: Add at least one global `<ErrorBoundary>` in layout.tsx.

### 🟡 useLocalStorage — silent quota errors
**File**: `src/hooks/useLocalStorage.ts`

When localStorage is full, the empty `catch` block swallows the error. React state updates but data is lost without the user knowing.

**Fix**: Add `console.warn` at minimum. Ideally show a toast notification.

---

## 4. Test Coverage

### 🔴 CRITICAL — interval-engine.ts has no Vitest tests
**File**: `src/lib/interval-engine.ts`

`flattenWorkout`, `totalDuration`, `durationAt` are the core business logic. Has an inline self-check (`runEngineTests()`) with `assert` — but this does NOT run in CI, does NOT produce coverage reports, and is invisible to the test runner.

**Fix**: Migrate inline self-check to proper `__tests__/interval-engine.test.ts` with Vitest.

### 🔴 CRITICAL — sequence-engine.ts has no Vitest tests
**File**: `src/lib/sequence-engine.ts`

Same pattern: inline `runEngineTests()` with asserts.

**Fix**: Migrate to proper Vitest test file.

### 🔴 CRITICAL — calendar-utils.ts has no Vitest tests
**File**: `src/lib/calendar-utils.ts`

`getMonday`, `formatWeekRange` — simple functions but critical for calendar correctness.

**Fix**: Add `__tests__/calendar-utils.test.ts`.

### 🔴 CRITICAL — useLocalStorage.ts has no tests
**File**: `src/hooks/useLocalStorage.ts`

This is the ENTIRE persistence layer. Workouts, sessions, exercises, weekPlans, sequences, templates — every entity depends on it. Zero tests.

**Fix**: Add `__tests__/useLocalStorage.test.ts`.

### 🟠 TimerControls, TimerDisplay, PlayHeader, Nav — no tests
Core timer UI components have no coverage.

### 🟡 WorkoutEditor.test.ts — only tests `createInterval`
37 lines, only tests the `createInterval` function. Nothing about save, handlers, or rendering.

### 🔵 Existing tests are good quality ✅
`useTimer.test.ts`, `useStats.test.ts`, `useIntervalNotification.test.ts`, `TimerRing.test.tsx` — proper mocking, edge cases, testing-library patterns.

---

## 5. Performance

### 🟡 Material Symbols full CDN in layout
**File**: `src/app/layout.tsx`

The entire Material Symbols icon set is loaded (all weight and fill variations). Only ~20 icons are used across the app.

**Fix**: Bundle only used icons, or switch to inline SVGs.

### 🟡 3 font families from Google Fonts
Inter (400, 600, 700) + JetBrains Mono (500, 700) + Material Symbols. ~300KB+ in fonts.

**Fix**: Use `next/font` for self-hosting to eliminate FOUT layout shift.

### 🟡 Flash of default state in localStorage
**File**: `src/hooks/useLocalStorage.ts`

`useState(initialValue)` renders the default, then `useEffect` post-hydration updates to the real value. Causes visible flash if data exists.

**Fix**: Use lazy initializer: `useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? initialValue } catch { return initialValue } })`.

### 🔵 WorkoutEditor recomputes on every keystroke
`flattenWorkout` in `useMemo` and `totalDurationSec` recalculate on every interval change. With <100 intervals this is not a problem.

---

## 6. CSS Architecture

### 🟠 Body styles hardcoded — not using CSS variables
**File**: `src/app/globals.css:183-187`

```css
body {
  background-color: #f8f9ff;
  color: #0b1c30;
}
```

Should be `var(--color-background)` and `var(--color-on-background)`.

### 🟠 `@utility max-w-*` with `!important`
**File**: `src/app/globals.css:140-154`

```css
@utility max-w-sm { max-width: 24rem !important; }
```

The `!important` is necessary due to `--spacing-*` shadowing but makes utilities fragile.

**Fix**: Rename spacing tokens to avoid shadowing (e.g., `--spacing-4` instead of `--spacing-sm`).

### 🟡 ExercisePicker uses hardcoded colors (zinc/blue)
**File**: `src/components/ExercisePicker.tsx`

Colors like `bg-blue-600`, `text-zinc-500`, `bg-zinc-800` bypass the design token system. Note: this file is also dead code (see ponytail audit).

### 🟡 No dark mode support
The DESIGN.md mentions timer dark mode but there's no `prefers-color-scheme: dark` media query.

**Fix**: Add dark mode CSS variables in globals.css.

### 🟡 Duplicate font-* definitions
`--font-headline-md`, `--font-body-md`, etc. are defined twice in globals.css with identical values.

### 🔵 Glassmorphism uses hardcoded colors
`glass-card` uses hardcoded `rgba(255,255,255,0.8)` and `#e2e8f0` instead of `--color-surface` and `--color-outline-variant`.

---

## Priority Matrix

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 5 | Duplicated Sequence, interval-engine/sequence-engine/calendar-utils/useLocalStorage without Vitest tests |
| 🟠 High | 6 | SEGMENT_* dedup, 10 handlers without useReducer, body hardcoded, `@utility !important`, StatsDashboard placeholders, WorkoutEditor 415 lines |
| 🟡 Medium | 10 | Server/client split, localStorage flash, ErrorBoundaries, ExercisePicker colors, dark mode, font dupes, props overload |
| 🔵 Low | 4 | dirtyRef unused, Material Symbols bundle, glassmorphism tokens, PlayHeader decor |
