# Delta: active-timer — Phase 2 Timer Pages

> **Change**: phase-2-timer-pages
> **Domain**: active-timer (modified)
> **Persistence**: hybrid

## MODIFIED Requirements

### AT-1 — Timer Ring (replaces plain countdown)

SVG circle (viewBox 0 0 100 100, 72×72 desktop / 64×64 mobile CSS) with centered display-timer numerals (JetBrains Mono 84px / 64px, tabular-nums, weight 700, -0.04em tracking). Track: #1E293B, stroke-width 4, no fill. Progress stroke: interval-colored (`prepare:#F59E0B`, `work:#84cc16`, `rest:#fb7185`, `cooldown:#818cf8`), stroke-linecap round, stroke-dashoffset transition 0.35s, rotate(-90deg) origin 50% 50%. Drift correction via Date.now per AT-8. MUST NOT use animation frames or timer libraries.
*(Previously: plain HH:MM:SS monospace countdown)*

#### Scenario: Full execution with ring
- GIVEN a workout Prepare(10s) → Work(30s) → CoolDown(10s)
- WHEN timer starts
- THEN numerals show 00:00:10, progress stroke #F59E0B at full offset, ring track #1E293B visible
- WHEN advancing to Work
- THEN stroke transitions to #84cc16, numerals show 00:00:30
- WHEN advancing to CoolDown
- THEN stroke transitions to #818cf8

#### Scenario: Tab hidden and revisited (unchanged)
- GIVEN timer running
- WHEN user switches tabs for 10s and returns
- THEN displayed time reflects actual elapsed (drift correction via Date.now)

### AT-2 — Progress Bar (dark variant)

Track #1E293B, progress fill white, pill-shaped (rounded-full, h-2). MUST show % total completed. Cycle/set counters below bar in label-caps gray-400: "Set N of M", "Cycle N of M". Per-interval countdown display moved to TimerRing label (AT-18).
*(Previously: light theme bar with per-interval countdown above)*

#### Scenario: Progress bar dark
- GIVEN a workout with 10 intervals
- WHEN timer runs
- THEN bar track #1E293B, progress white, pill caps, counters below bar in gray-400

#### Scenario: Flat workout hides indicators (unchanged)
- GIVEN a flat workout with no nested intervals
- THEN no cycle/set indicators shown

#### Scenario: Progress bar with flattened input (unchanged)
- GIVEN 15 intervals via flatten
- THEN bar advances proportionally across all 15

### AT-3 — Pause/Resume (Material Symbols)

Single toggle button: "pause" icon when running, "play_arrow" when paused. MUST freeze countdown, preserve elapsed. Styling: 80px rounded-full, bg-white, text-primary, shadow-[0_4px_20px_rgba(255,255,255,0.15)]. Icons: Material Symbols Outlined, font-variation-settings FILL 1.
*(Previously: emoji text button)*

#### Scenario: Pause and resume (behavior unchanged)
- GIVEN timer running at 00:00:15
- WHEN user taps pause, waits 5s, taps resume
- THEN countdown resumes at 00:00:15, icon toggles between pause and play_arrow

### AT-4 — Skip and Rewind (was: Skip only)

"skip_next" advances to next interval at full duration. "replay_10" decrements timeLeft by 10s, clips at 0, preserves drift correction. Icons: Material Symbols Outlined. Buttons: 14×14 rounded-full, border-white/20, hover:bg-white/10.
*(Previously: skip only, emoji)*

#### Scenario: Skip to next (unchanged)
- GIVEN on Prepare interval → tap skip → advances to Work at full duration

#### Scenario: Rewind clips at zero
- GIVEN timer at 00:00:05 → tap replay_10 → timeLeft snaps to 00:00:00, auto-advance triggers

### AT-9 — Dark Theme (exact background)

Background MUST be #091426, text white. Glass panels: rgba(255,255,255,0.05), backdrop-filter blur(12px), 1px border rgba(255,255,255,0.1). Burgundy/secondary tokens replaced with dark equivalents: primary-container #1E293B, surface-tint #545f73. @supports (backdrop-filter: blur()) fallback to semi-opaque bg. Tap targets ≥44px. Monospace numerals for high contrast during movement.
*(Previously: generic dark bg, burgundy accent tokens)*

#### Scenario: Dark theme renders
- GIVEN any play page loads
- THEN bg is #091426, text white, glass elements apply backdrop-filter blur
- THEN all burgundy tokens replaced (no #ac3400, no #fd6b36 present)

## ADDED Requirements

### AT-16 — Play Header

Sticky glass panel at top, z-50. Close button (close icon) → router.back(). Session title: headline-md, white, font-bold. Workout name: body-md, gray-400. Right side: volume_up and more_vert icons. All icons Material Symbols Outlined, text-white. gap-4 between header items.

#### Scenario: Header renders on play page
- GIVEN user navigates to workouts/[id]/play or sequences/[id]/play
- THEN sticky glass panel shows at top with: close icon, session title, workout name, volume_up, more_vert

### AT-17 — Interval Type Label

Label above timer numerals. MUST use label-caps (12px/700/0.05em tracking, uppercase). Text color MUST match ring progress stroke for the current interval. tracking-widest for extra letter spacing.

#### Scenario: Label shows interval type
- GIVEN timer on Work interval
- THEN label shows "WORK" in #84cc16 above numerals

### AT-18 — Next Interval Label

Label below timer numerals: "Next: {type} ({duration})". MUST use data-sm (JetBrains Mono 14px/500), text-gray-400. Derived from flattened intervals array — no per-tick recalculation.

#### Scenario: Next interval shown
- GIVEN timer on Prepare(10s), next is Work(30s)
- THEN label reads "Next: Work (00:30)"

### AT-19 — Timer Controls Layout

3-button row centered: replay_10 | pause/play toggle | skip_next. Center button: 80px rounded-full, bg-white, text-primary, shadow. Side buttons: 14×14 rounded-full, border-white/20, hover:bg-white/10. gap-lg between buttons. All buttons Material Symbols Outlined with consistent font-variation-settings (FILL 1).

#### Scenario: Controls render
- GIVEN timer page loaded
- THEN 3-button row renders, center button 80px white bg, side buttons 14×14 border-white/20

### AT-20 — Exercise Panel

Glass card (glass-panel, rounded-xl, p-md) centered below timer ring. Image area: w-full h-40, bg-primary-container (#1E293B), rounded-lg. Shows exercise name centered as placeholder text when no image available. Exercise name: headline-lg, white, mb-xs. Description: body-md, gray-300. Chips: rounded-full, bg-surface-tint/20, label-caps, text-white, border-white/10, gap-2. Chip section MUST NOT render empty containers when no tags.

#### Scenario: Exercise panel with chips
- GIVEN exercise "Goblet Squats", description "Keep your chest up", tags [Kettlebell, Quads]
- WHEN timer runs
- THEN panel shows: image area with centered "Goblet Squats" placeholder, name, description, two chips

#### Scenario: No tags hides chips
- GIVEN exercise with empty tags array
- THEN chip section is not rendered (no empty containers)

### AT-21 — addTime(seconds)

useTimer MUST expose addTime(n: number). Clips timeLeft to [0, duration]. MUST apply same Date.now delta-correction contract as the tick. If n > remaining, clips to 0 (triggers auto-advance). If |n| > timeLeft, clips to 0.

#### Scenario: Rewind decrements
- GIVEN timer at 00:00:30 on Work(60s)
- WHEN addTime(-10) called
- THEN timeLeft is 00:00:20

#### Scenario: Clip at zero
- GIVEN timer at 00:00:05 on Work(60s)
- WHEN addTime(-10) called
- THEN timeLeft is 00:00:00, interval auto-advances to next

#### Scenario: Clip at duration
- GIVEN timer at 00:00:45 on Work(60s)
- WHEN addTime(20) called
- THEN timeLeft clips to 00:00:60 (duration cap)
