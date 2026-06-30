# Statistics Specification

**Purpose**: Display aggregated training progress — totals, streaks, weekly volume, and recent sessions — derived from completed workout history. Pure readonly from existing session data.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| ST-1 | `/stats` SHALL display summary cards: total workouts completed, total workout time (hours), current streak (consecutive days with ≥1 session), sessions this week | MUST |
| ST-2 | `/stats` SHALL display a weekly volume chart using pure CSS bars — each bar represents one ISO week, height proportional to total duration for that week | MUST |
| ST-3 | Chart SHALL default to last 12 weeks, SHALL show week labels | MUST |
| ST-4 | `/stats` SHALL display a recent sessions list (last 10) with date, name, duration, type (workout/sequence) | MUST |
| ST-5 | Empty state SHALL show "Complete your first workout to see stats" with link to `/workouts` | MUST |
| ST-6 | All data SHALL derive from localStorage `workoutapp.sessions` — no new persistence | MUST |
| ST-7 | Data SHALL be computed client-side in a `"use client"` component | MUST |
| ST-8 | Streak SHALL count consecutive calendar days (UTC) with ≥1 completed session, going backward from today | MUST |
| ST-9 | `/stats` page SHALL be an RSC shell wrapping the client component | MUST |

## Scenarios

### Scenario: Fresh install — no sessions
- GIVEN localStorage has no `workoutapp.sessions` key or empty array
- WHEN user navigates to `/stats`
- THEN the empty state renders with "Complete your first workout to see stats" and a link to `/workouts`
- AND no summary cards, chart, or session list are shown

### Scenario: Single session completed
- GIVEN 1 session with total duration 45 min, completed today
- WHEN user navigates to `/stats`
- THEN total workouts card shows "1", total time shows "0.75h", sessions this week shows "1", current streak shows "1"
- AND the weekly chart shows one bar for the current week

### Scenario: Multiple sessions across different weeks
- GIVEN sessions with durations 30 min (week A), 60 min (week A), 45 min (week B)
- WHEN user navigates to `/stats`
- THEN week A bar height is proportional to 90 min, week B bar proportional to 45 min
- AND the chart displays ≤12 bars with ISO week labels
- AND the recent sessions list shows all sessions ordered by date descending

### Scenario: Consecutive day streak
- GIVEN sessions completed each day for 5 consecutive days (UTC)
- WHEN user navigates to `/stats`
- THEN current streak shows "5"

### Scenario: Streak breaks on gap
- GIVEN sessions on Mon, Tue, Thu (no session on Wed), and today is Thu
- WHEN user navigates to `/stats`
- THEN current streak shows "1" — only Thursday counts backward from today, the Wed gap resets the streak
