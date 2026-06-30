# Proposal: Phase 0 — Foundation (MVP)

## Intent

Build the MVP foundation — two core screens that make the app functional: a Workout Editor to create interval-based workouts and an Active Timer to execute them. Unblock dogfooding and validation before adding complexity.

## Scope

### In Scope
- Next.js 14+ scaffold (App Router, TypeScript, Tailwind CSS v4)
- Core data model: `Interval`, `Workout`, `Exercise` types
- Workout Editor: flat list of intervals (Prepare → Work × N → CoolDown)
- Active Timer: countdown, progress bar, skip/pause/restart
- localStorage persistence for workouts
- Hardcoded exercise data (4–5 exercises for Work intervals)
- Mobile-first responsive design, dark timer screen default

### Out of Scope
- Interval nesting (cycles, sets) — Phase 1
- Sequences — Phase 2
- Exercise library — Phase 3
- Calendar — Phase 4
- Programs — Phase 5
- PWA / offline / notifications — Phase 6

## Capabilities

### New Capabilities
- `workout-editor`: Create, edit, save workouts. Add/remove/reorder intervals. Set duration and type (Prepare, Work, Rest, CoolDown). Assign exercises to Work intervals.
- `active-timer`: Execute a saved workout. Countdown per interval, overall progress bar, pause/skip/restart controls. Auto-advance to next interval. Completion state.
- `local-persistence`: Save workouts to localStorage, load on app start, list saved workouts. Basic CRUD (no delete in MVP).
- `workout-data-model`: TypeScript types for `Interval`, `Workout`, `Exercise`. Pure domain types, no framework dependency.

### Modified Capabilities
None.

## Approach

- **Ponytail full**: `setInterval` for the timer, `localStorage` for persistence, no state management library (React state + context is enough).
- **Flat interval list**: intervals stored as `Interval[]` on `Workout` — no nesting yet.
- **Mobile-first**: responsive layout, touch-friendly controls (tap targets ≥ 44px).
- **Dark mode default**: timer screen uses dark background with large monospace numerals for readability in low-light gym environments.
- **React Server Components** for static pages, `"use client"` only where interactivity is needed (editor, timer).
- **Timer accuracy**: use `Date.now()` delta inside `setInterval` to correct drift, rather than trusting interval callbacks.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/` | New | App Router pages for editor and timer |
| `src/lib/types.ts` | New | Core data model types |
| `src/lib/storage.ts` | New | localStorage persistence layer |
| `src/lib/exercises.ts` | New | Hardcoded exercise data (4–5) |
| `src/components/` | New | UI components (IntervalList, Timer, ProgressBar, etc.) |
| `package.json` | Modified | Next.js + Tailwind dependencies |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timer drift with `setInterval` | Low | Use `Date.now()` delta to correct drift on each tick |
| localStorage quota exceeded | Low | Workout data is tiny (< 100 KB) for MVP scale |
| Tailwind v4 breaking changes | Low | Pin exact version in `package.json` |

## Rollback Plan

All work is additive (new files in `src/`). Rollback = delete the `src/` directory and revert `package.json` to pre-scaffold state. No migrations to reverse. No data loss risk since localStorage is per-origin and unaffected by code rollback.

## Dependencies

- Node.js 18+ (Next.js 14 requirement)
- Existing product vision and screen specs in `docs/`

## Success Criteria

- [ ] User can create a workout with Prepare → 3 Work intervals (each with an exercise) → CoolDown
- [ ] User can start the workout and see the countdown decrement in real time
- [ ] User can pause, skip to next interval, and restart the timer
- [ ] User can save the workout and reload it from localStorage on next visit
- [ ] Timer auto-advances through all intervals and shows a completion state
