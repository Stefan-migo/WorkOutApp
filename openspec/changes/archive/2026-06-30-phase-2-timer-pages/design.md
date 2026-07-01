# Design: Phase 2 — Timer / Play Pages

## Technical Approach

Replace inline JSX in both play pages with a component layout matching `active-timer.html`: TimerRing wraps TimerDisplay (centered), ExercisePanel shows current exercise, PlayHeader is sticky glass bar, TimerControls gets Material Symbols + rewind. No changes to the interval state machine — purely visual.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Ring color source | `segment-prepare/work/rest/cooldown` CSS vars | Inline map in TimerRing | Colors already used by TimelineStrip; single source of truth |
| addTime delta model | Adjust `elapsedRef` + cap tick to `[0, duration]` | Reset startTimeRef | Keeps Date.now drift correction intact (spec AT-8 contract) |
| Chip data source | `Exercise.muscleGroups` mapped to chips | New `tags` field on type | Field exists; spec says "tags" but actual data uses `muscleGroups` |
| Image placeholder | Exercise name centered in image area | Blank grey box | No image field exists (out of scope); name works as affordance |
| Page dark bg | `bg-[#091426]` on wrapper, overrides layout | Modifying layout globally | Play pages are full-bleed dark; other pages stay light |
| Material Symbols | Already loaded in `layout.tsx` | Adding script | Zero new deps; line 31-34 already has the stylesheet link |

## Component Tree

```
Page (workouts/[id]/play or sequences/[id]/play)
├── PlayHeader              — sticky glass, close+title+workout name+icons
├── TimerRing               — SVG circle, centered child content
│   └── TimerDisplay        — interval label + numerals + next label
├── ExercisePanel           — glass card, image area+name+desc+chips
├── TimerControls           — replay_10 | pause/play (80px) | skip_next
└── ProgressBar             — dark pill bar + set/cycle counters
```

## TimerRing SVG Math

- viewBox `0 0 100 100`, center cx=50 cy=50, r=45
- Circumference C = 2 × π × 45 ≈ 282.74 (spec rounds to 283)
- Track: `stroke="#1E293B"`, stroke-width=4, no fill
- Progress: `stroke-dasharray="283"`, `stroke-dashoffset="283 * (1 − progress)"`
- rotation: `transform="rotate(-90)"` origin 50% 50% so progress starts at 12 o'clock
- transition: `stroke-dashoffset 0.35s` (CSS class)
- Color: read from `--color-segment-{type}` computed style or inline CSS var

Progress is calculated per-interval: `1 − timeLeft / interval.duration`.

## Data Flow: addTime(seconds)

```
addTime(n):
  1. newTimeLeft = clamp(timeLeft + n, 0, duration)
  2. delta = timeLeft − newTimeLeft   // positive = rewind
  3. elapsedRef.current += delta      // adjust drift baseline
  4. setTimeLeft(newTimeLeft)         // immediate UI update
```

Next tick: `remaining = Math.max(0, Math.min(duration, Math.round(duration − elapsedRef − Date.now_delta)))`.

The `Math.min(duration, …)` guard prevents the elapsedRef going negative (fast-forward) from producing remaining > duration.

## ExercisePanel Props

```typescript
interface ExercisePanelProps {
  name: string
  description?: string
  tags?: string[]       // maps from Exercise.muscleGroups
  imagePlaceholder?: string  // defaults to name
}
```

Renders nothing if no exercise (gates on caller). Chips section is conditional: renders only when `tags.length > 0`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modify | Update segment colors to spec values (prepare=#F59E0B, work=#84cc16, rest=#fb7185, cooldown=#818cf8) |
| `src/hooks/useTimer.ts` | Modify | Add `addTime(n)`, cap tick to `[0, duration]` |
| `src/components/TimerRing.tsx` | Create | SVG progress ring, renders children centered |
| `src/components/TimerDisplay.tsx` | Modify | Accept `intervalType` + `nextInterval`, show label, use display-timer classes |
| `src/components/TimerControls.tsx` | Modify | Material Symbols + rewind btn, remove restart, 80px center |
| `src/components/ProgressBar.tsx` | Modify | Dark theme: track #1E293B, fill white, pill h-2, set/cycle counters |
| `src/components/ExercisePanel.tsx` | Create | Glass card: image area + name + desc + chips |
| `src/components/PlayHeader.tsx` | Create | Sticky glass bar: close + title + workout name + icons |
| `src/app/workouts/[id]/play/page.tsx` | Modify | New component composition, dark bg, pass flatten data |
| `src/app/sequences/[id]/play/page.tsx` | Modify | Same composition, integrate sequence progress |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `useTimer.addTime` | RED: write test → GREEN: implement → assert clip at 0, clip at duration, drift preserved |
| Unit | `TimerRing` | Render with progress 0/0.5/1, verify SVG attributes and dashoffset |
| Unit | `ExercisePanel` | Render with/without chips, verify conditional rendering |
| Integration | Both play pages | Render each phase (idle/active/complete), verify composition |

## Open Questions

None — all decisions resolved in proposal + spec.
