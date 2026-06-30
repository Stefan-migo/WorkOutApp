# Proposal: Phase 6 — Sound, Notifications & Export

## Intent

Timer auto-advances silently. When the tab is hidden, users miss interval transitions with no feedback. Completed data lives in localStorage with no way to extract it. This change adds three independent but complementary features: audio beep on transition, desktop notification when tab is hidden, and JSON export of all user data.

## Scope

### In Scope
- Beep via existing `useBeep` hook (Web Audio API, ~300ms 800Hz tone) — already built, wire into all timer transitions
- Desktop Notification using Browser Notification API on interval transition when `document.hidden === true`
- Notification permission request on first timer start (not on page load)
- JSON export: collect all localStorage `workoutapp.*` keys, one-click download as `workoutapp-export.json`
- Export button on `/stats` page (already exists, minimal addition)

### Out of Scope
- Custom sound files, uploads, pitch selection UI
- Push notifications / service worker registration
- CSV, PDF export formats
- Import functionality (deferred)
- Notification preferences UI (permission is browser-managed)

## Capabilities

### New Capabilities
- `data-export`: JSON blob download of all user data from localStorage keys (workouts, sequences, sessions, exercises, week plans, program templates)

### Modified Capabilities
- `active-timer`: Add notification dispatch on interval transition when tab hidden (NEW requirement to AT spec)
- `local-persistence`: Add read-only collect-all function for export (NO spec-level behavioral change — pure implementation detail)

## Approach

| Feature | Approach |
|---------|----------|
| **Beep** | Already have `useBeep()` hook. Call `beep()` in the `onComplete` callback in both play pages — already done, verify coverage on sequence player too |
| **Notification** | New `useIntervalNotification()` hook: check `Notification.permission`, request on first call, send on interval change when `document.hidden`. Wired into same play pages alongside beep |
| **Export** | Static function `exportAllData()`: read all `workoutapp.*` localStorage keys into one object, create blob, trigger `<a>` download. Button on `/stats` page |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/workouts/[id]/play/page.tsx` | Modified | Wire `useIntervalNotification` alongside existing beep |
| `src/app/sequences/[id]/play/page.tsx` | Modified | Same — wire notifications |
| `src/hooks/useIntervalNotification.ts` | New | Notification permission + dispatch when tab hidden |
| `src/lib/export.ts` | New | `exportAllData()` — collect + download |
| `src/app/stats/page.tsx` | Modified | Add export button |
| `openspec/specs/active-timer/spec.md` | Modified | Add notification requirement |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Notification permission prompt blocked by browser (FF, Safari) | Medium | Graceful fallback — silently skip if denied/unsupported |
| Audio autoplay policy blocks beep before user gesture | Low | Beep only fires after user taps "Start" — user gesture already satisfied |
| `localStorage` quota exceeded on export (large datasets) | Low | `JSON.stringify` can throw on circular — all data is plain objects, safe |

## Rollback Plan

Revert commits per feature. Features are independent — sound and notifications can be rolled without touching export. Each has its own commit.

## Dependencies

None. Web Audio API, Notification API, and Blob download are all browser-native.

## Success Criteria

- [ ] Beep plays on every interval transition in workout and sequence play
- [ ] Desktop notification fires on interval transition when tab is hidden (permission granted)
- [ ] Export button on `/stats` downloads valid JSON containing all user data
- [ ] No regressions in timer or session logging
