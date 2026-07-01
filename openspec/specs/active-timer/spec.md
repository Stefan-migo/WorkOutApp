# Active Timer

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| AT-1 | SVG circle (viewBox 0 0 100 100, 72×72 desktop / 64×64 mobile CSS) with centered timer numerals (JetBrains Mono, tabular-nums, weight 700, -0.04em tracking). Progress stroke color per interval type: prepare #F59E0B, work #84cc16, rest #fb7185, cooldown #818cf8. Track #1E293B, stroke-width 4, stroke-linecap round, stroke-dashoffset transition 0.35s, rotate(-90deg) origin 50% 50%. Drift correction via Date.now per AT-8. MUST NOT use animation frames or timer libraries. | MUST |
| AT-2 | Dark-themed progress bar showing % total completed. Track #1E293B, fill white, pill-shaped (rounded-full, h-2). Cycle/set counters below bar in label-caps gray-400: "Set N of M", "Cycle N of M". Per-interval countdown display shown in TimerRing label (AT-18). | MUST |
| AT-3 | Pause/resume via single Material Symbols toggle button ("pause" when running, "play_arrow" when paused). Freezes countdown, preserves elapsed. 80px rounded-full, bg-white, text-primary, shadow-[0_4px_20px_rgba(255,255,255,0.15)]. font-variation-settings FILL 1. | MUST |
| AT-4 | Skip to next interval (skip_next icon) advances to next at full duration. Rewind 10s (replay_10 icon) decrements timeLeft by 10s, clips at 0, preserves drift correction. All icons Material Symbols Outlined. Buttons: 14×14 rounded-full, border-white/20, hover:bg-white/10. | MUST |
| AT-5 | Restart from first interval — resets all state | MUST |
| AT-6 | Auto-advance on `remaining === 0` — play a brief beep/sound, move to next | MUST |
| AT-7 | Completion state when all intervals done — show "Workout Complete" screen | MUST |
| AT-8 | Correct drift using `Date.now()` delta on each 1s tick | MUST |
| AT-9 | Background MUST be #091426, text white. Glass panels: rgba(255,255,255,0.05), backdrop-filter blur(12px), 1px border rgba(255,255,255,0.1). No burgundy tokens (#ac3400, #fd6b36). @supports (backdrop-filter: blur()) fallback to semi-opaque bg. Tap targets ≥44px. Monospace numerals. | MUST |
| AT-10 | All tap targets ≥ 44px | MUST |
| AT-11 | Timer runs in `"use client"` component — no RSC for interactivity | MUST |
| AT-12 | Single `setInterval` at 1s; no animation frame, no external timer libs | MUST |
| AT-13 | Timer SHALL display "Cycle N/M" indicator when current interval is inside a cycle group (parent with cycleCount > 1) | MUST |
| AT-14 | Timer SHALL display "Set N/M" indicator when current interval is inside a cycle with setCount > 1 | MUST |
| AT-15 | Cycle/set indicators SHALL derive from the flattened array — no per-tick recalculation of nesting | MUST |
| AT-16 | Sticky glass panel at top, z-50. Close button (close icon) → router.back(). Session title: headline-md, white, font-bold. Workout name: body-md, gray-400. Right side: volume_up and more_vert icons. All icons Material Symbols Outlined, text-white. gap-4 between header items. | MUST |
| AT-17 | Label above timer numerals. MUST use label-caps (12px/700/0.05em tracking, uppercase). Text color MUST match ring progress stroke for current interval. tracking-widest for extra letter spacing. | MUST |
| AT-18 | Label below timer numerals: "Next: {type} ({duration})". MUST use data-sm (JetBrains Mono 14px/500), text-gray-400. Derived from flattened intervals array — no per-tick recalculation. | MUST |
| AT-19 | 3-button row centered: replay_10 | pause/play toggle | skip_next. Center button: 80px rounded-full, bg-white, text-primary, shadow. Side buttons: 14×14 rounded-full, border-white/20, hover:bg-white/10. gap-lg between buttons. All buttons Material Symbols Outlined with consistent font-variation-settings (FILL 1). | MUST |
| AT-20 | Glass card (glass-panel, rounded-xl, p-md) centered below timer ring. Image area: w-full h-40, bg-primary-container (#1E293B), rounded-lg. Shows exercise name centered as placeholder text when no image available. Exercise name: headline-lg, white, mb-xs. Description: body-md, gray-300. Chips: rounded-full, bg-surface-tint/20, label-caps, text-white, border-white/10, gap-2. Chip section MUST NOT render empty containers when no tags. | MUST |
| AT-21 | useTimer MUST expose addTime(n: number). Clips timeLeft to [0, duration]. MUST apply same Date.now delta-correction contract as the tick. If n > remaining, clips to 0 (triggers auto-advance). If |n| > timeLeft, clips to 0. | MUST |

## Scenarios

### Scenario: Full execution with ring
- GIVEN a workout Prepare(10s) → Work(30s) → CoolDown(10s)
- WHEN timer starts
- THEN numerals show 00:00:10, progress stroke #F59E0B at full offset, ring track #1E293B visible
- WHEN advancing to Work
- THEN stroke transitions to #84cc16, numerals show 00:00:30
- WHEN advancing to CoolDown
- THEN stroke transitions to #818cf8

### Scenario: Tab hidden and revisited
- GIVEN timer running
- WHEN user switches tabs for 10s and returns
- THEN displayed time reflects actual elapsed time (drift correction via Date.now)

### Scenario: Pause and resume
- GIVEN timer running at 00:00:15
- WHEN user taps pause, waits 5s, taps resume
- THEN countdown resumes at 00:00:15, icon toggles between pause and play_arrow

### Scenario: Skip to next
- GIVEN on Prepare interval
- WHEN user taps skip_next
- THEN timer advances to Work at full duration

### Scenario: Rewind clips at zero
- GIVEN timer at 00:00:05 on Work(60s)
- WHEN user taps replay_10
- THEN timeLeft snaps to 00:00:00, auto-advance triggers

### Scenario: Auto-advance at zero
- GIVEN timer at 00:00:01 on Prepare
- WHEN 1 second passes
- THEN Prepare countdown reaches 00:00:00 and auto-advances to next interval

### Scenario: All intervals complete
- GIVEN timer on last interval (CoolDown) at 00:00:01
- WHEN 1 second passes
- THEN "Workout Complete" screen shown with restart option

### Scenario: Dark theme renders
- GIVEN any play page loads
- THEN bg is #091426, text white, glass elements apply backdrop-filter blur
- THEN all burgundy tokens replaced (no #ac3400, no #fd6b36 present)

### Scenario: Cycle and set visible during execution
- GIVEN a cycle group with `cycleCount=5`, `setCount=4`, current position is cycle 3, set 2
- WHEN timer is running
- THEN display shows "Cycle 3/5" and "Set 2/4" below the progress bar

### Scenario: Flat workout hides cycle/set indicators
- GIVEN a flat workout with no nested intervals
- WHEN timer is running
- THEN no cycle/set indicators are shown (backward compatible)

### Scenario: Progress bar continues working with flattened input
- GIVEN a workout with cycles expanded to 15 intervals via flatten
- WHEN timer runs
- THEN progress bar advances proportionally across all 15 intervals

### Scenario: Header renders on play page
- GIVEN user navigates to workouts/[id]/play or sequences/[id]/play
- THEN sticky glass panel shows at top with: close icon, session title, workout name, volume_up, more_vert

### Scenario: Label shows interval type
- GIVEN timer on Work interval
- THEN label shows "WORK" in #84cc16 above numerals

### Scenario: Next interval shown
- GIVEN timer on Prepare(10s), next is Work(30s)
- THEN label reads "Next: Work (00:30)"

### Scenario: Controls render
- GIVEN timer page loaded
- THEN 3-button row renders, center button 80px white bg, side buttons 14×14 border-white/20

### Scenario: Exercise panel with chips
- GIVEN exercise "Goblet Squats", description "Keep your chest up", tags [Kettlebell, Quads]
- WHEN timer runs
- THEN panel shows: image area with centered "Goblet Squats" placeholder, name, description, two chips

### Scenario: No tags hides chips
- GIVEN exercise with empty tags array
- THEN chip section is not rendered (no empty containers)

### Scenario: Rewind decrements
- GIVEN timer at 00:00:30 on Work(60s)
- WHEN addTime(-10) called
- THEN timeLeft is 00:00:20

### Scenario: Clip at zero
- GIVEN timer at 00:00:05 on Work(60s)
- WHEN addTime(-10) called
- THEN timeLeft is 00:00:00, interval auto-advances to next

### Scenario: Clip at duration
- GIVEN timer at 00:00:45 on Work(60s)
- WHEN addTime(20) called
- THEN timeLeft clips to 00:00:60 (duration cap)
