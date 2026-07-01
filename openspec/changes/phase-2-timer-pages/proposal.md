# Proposal: Phase 2 — Timer / Play Pages

## Intent

Current play pages (`workouts/[id]/play` and `sequences/[id]/play`) are functional but visually bare — no progress ring, no glassmorphism, no exercise detail card, emoji buttons instead of Material Symbols. The Open Design prototype (`active-timer.html`) defines a premium dark-mode timer experience. This phase closes that gap without changing the underlying state machine or timer logic.

## Scope

### In Scope
- Redesign both play pages with new component composition matching `active-timer.html`
- `TimerRing` component: SVG circular progress, color-coded per `IntervalType`
- `ExercisePanel` component: glass card with image placeholder, name, description, chips
- `PlayHeader` component: sticky glass bar with close button + session title + workout name
- Redesign `TimerControls`: Material Symbols, add rewind‑10s button
- Add `addTime(seconds)` to `useTimer` hook
- Redesign `TimerDisplay` to embed inside `TimerRing` and accept `intervalType`
- Use `#0F172A` dark background (matches DESIGN.md "Active Timer Mode")

### Out of Scope
- Image upload / data model for exercise images (field doesn't exist yet)
- Animation on interval transitions or page mount
- Drag-and-drop interval reordering during play
- Sound/music integration beyond existing `useBeep`
- Share, social, or live‑activity features

## Capabilities

### New Capabilities
None — all changes are visual/component redesign of existing behavior.

### Modified Capabilities
- **`active-timer`**: Spec-level changes to AT‑1 (plain countdown → ring‑wrapped), AT‑2 (progress bar → ring + enhanced mini timeline), AT‑3 (emoji pause/resume → Material Symbols), AT‑4 (skip only → skip + rewind). AT‑8 (drift correction) unchanged. AT‑9 (dark bg) now uses exact `#0F172A`. AT‑14/AT‑15 (cycles/sets) visual only.

## Approach

Replace inline JSX in both play pages with a layout of new components. The pages stay thin orchestrators — they manage phase state, pass data down. Each component owns its visual domain:

- `PlayHeader` — absolute top, glass backdrop, close router.back(), workout/sequence title
- `TimerRing` — SVG circle with reactive `stroke-dashoffset`, renders `TimerDisplay` as centered child, color from `intervalType → color` map
- `ExercisePanel` — fixed‑height image area (shows exercise name as placeholder text), name, description, chip list
- `TimerControls` — rewind‑10s, play/pause toggle, skip‑next buttons using Material Symbols
- `ProgressBar` — keeps the pill‑style bar but updated for dark theme

`useTimer.addTime(seconds)` clips at 0 and at `duration` — same delta‑correction contract as the existing tick.

## Affected Areas

| Area | Impact |
|------|--------|
| `src/hooks/useTimer.ts` | **Modified** — add `addTime(n)` |
| `src/components/TimerDisplay.tsx` | **Modified** — accept `intervalType`, wrap inside ring |
| `src/components/TimerControls.tsx` | **Modified** — Material Symbols, rewind button |
| `src/components/ProgressBar.tsx` | **Modified** — dark‑theme style pass |
| `src/components/TimerRing.tsx` | **New** — SVG progress ring |
| `src/components/ExercisePanel.tsx` | **New** — glass exercise card |
| `src/components/PlayHeader.tsx` | **New** — sticky glass header |
| `src/app/workouts/[id]/play/page.tsx` | **Modified** — new layout composition |
| `src/app/sequences/[id]/play/page.tsx` | **Modified** — new layout composition |

## Key Decisions

1. **Ring color per interval type**: `{ prepare: #F59E0B, work: #84cc16, rest: #fb7185, cooldown: #818cf8 }` — mapped from the DESIGN.md interval‑state palette.
2. **Rewind as `addTime(seconds)` on `useTimer`**: Keeps rewind logic inside the hook where delta correction lives. Clamps to `[0, duration]`.
3. **No functional image loading**: Image area renders exercise name in centered muted text. Image field is future work.
4. **Phase state machine unchanged**: The `idle → active → complete` (workout) and `idle → active → workout-summary → complete` (sequence) flows stay untouched — visual only.
5. **Material Symbols over icon lib**: Already referenced in `active-timer.html`, zero new deps. Add `<link>` to root layout.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `addTime` desync from interval boundary check | Low | Clamp + test: rewind at 0 is no‑op, rewind past 0 snaps to 0 |
| Ring SVG layout shift during hydration | Low | Fixed viewBox + aspect-ratio wrapper |
| Sequence page double progress bars (sequence + workout) | Medium | Remove duplicate; sequence bar above header, ring replaces workout bar |
| Glass `backdrop-filter` stutter on low‑end Android | Low | `@supports (backdrop-filter: blur())` fallback to semi‑opaque bg |

## Rollback Plan

All changes in 8 files (5 modify, 3 create). Full revert: `git checkout -- src/components/ src/hooks/useTimer.ts src/app/workouts/[id]/play/page.tsx src/app/sequences/[id]/play/page.tsx`. Remove new files with `git clean`. No migration needed — data model untouched.

## Dependencies

- Material Symbols font: add `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">` to app layout (already used in design prototype)
- Existing Tailwind v4, Next.js 14, `useTimer` hook

## Success Criteria

- [ ] Both play pages render the glass‑panel layout with no visual regression on idle/active/complete phases
- [ ] Timer ring animates smoothly; stroke color matches interval type
- [ ] Rewind‑10s decrements `timeLeft`, clips at 0, doesn't break auto‑advance
- [ ] ExercisePanel shows exercise name as centered placeholder text in image area
- [ ] Existing `active-timer` spec scenarios pass (timer accuracy, pause/resume, skip, auto‑advance)
