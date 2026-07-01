# Tasks: Phase 2 — Timer / Play Pages

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~480 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (hooks+ring+shared) → PR 2 (components+pages) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Work Units

| Unit | Goal | Likely PR | Base |
|------|------|-----------|------|
| 1 | Foundation + TimerRing | PR 1 | main |
| 2 | Components + Pages | PR 2 | main |

## Phase 1: Foundation — Hook + Ring + Globals

- [x] 1.1 RED: Write `useTimer.addTime` test — rewind clips at 0, addTime preserves drift
- [x] 1.2 GREEN: Add `addTime(n)` to `useTimer`, cap tick to `[0, duration]`
- [x] 1.3 Update `globals.css` segment colors to spec (prepare=amber, work=green, rest=rose, cooldown=purple), add `.ring-progress` transition class
- [x] 1.4 RED: Write `TimerRing` render test — dashoffset at progress 0/0.5/1, track color
- [x] 1.5 GREEN: Create `TimerRing.tsx` — SVG circle r=45, 283 dasharray, `rotate(-90)`, centered children via absolute flex, color via computed CSS var

## Phase 2: Component Redesign

- [ ] 2.1 Modify `TimerDisplay` — accept `intervalType` (label above, colored) + `nextInterval` ("Next: X"), use display-timer classes, remove low-time pulse
- [ ] 2.2 Rewrite `TimerControls` — Material Symbols (replay_10, pause/play_arrow, skip_next), 80px center button, no restart
- [ ] 2.3 Dark-theme `ProgressBar` — track #1E293B, fill white, pill h-2, set/cycle counter labels
- [ ] 2.4 RED: Write `ExercisePanel` test — chips visible/hidden, placeholder text
- [ ] 2.5 GREEN: Create `ExercisePanel.tsx` — glass card, image area with name placeholder, description, conditional chips from `muscleGroups`
- [ ] 2.6 Create `PlayHeader.tsx` — sticky glass bar (`glass-panel`), close → `router.back()`, session title, workout name, volume_up + more_vert icons

## Phase 3: Page Integration

- [ ] 3.1 Restructure `workouts/[id]/play/page.tsx` — remove inline `|` badge/title/desc, compose PlayHeader + TimerRing(TimerDisplay) + ExercisePanel + TimerControls + ProgressBar, bg `#091426`
- [ ] 3.2 Restructure `sequences/[id]/play/page.tsx` — same composition, preserve round/workout-summary logic, integrate sequence progress indicator above header
- [ ] 3.3 Verify both pages render all phases (idle/active/complete) with new components — manual smoke test
