# Tasks: Phase 6 — Sound, Notifications & Export

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~160-200 total |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Notifications → PR 2: Export |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Notes |
|------|------|-----------|------|-------|
| 1 | Notifications (hook + play page wiring) | PR 1 | `main` | Independent feature, no deps |
| 2 | Export (lib + stats button) | PR 2 | `main` | Independent feature, no deps |

## PR 1: Notifications

### Phase 1: Hook — `useIntervalNotification`

- [x] 1.1 RED: Write failing test — `renderHook` with mocked `Notification`, verify permission request and dispatch on `document.hidden`
- [x] 1.2 GREEN: Create `src/hooks/useIntervalNotification.ts` — returns `{ notify }` handling permission check/request, hidden check, and `new Notification(...)` dispatch
- [x] 1.3 REFACTOR: Clean up — ensure `ponytail:` comment noting browser-native, no deps

### Phase 2: Play page wiring

- [x] 2.1 Wire `useIntervalNotification` into `src/app/workouts/[id]/play/page.tsx` — call `notify(...)` in timer `onComplete` alongside `beep()`
- [x] 2.2 Same wiring into `src/app/sequences/[id]/play/page.tsx`

### Phase 3: Verify

- [x] 3.1 Verify tests pass (`vitest run`), verify permission prompt appears on first start gesture

## PR 2: Export

### Phase 1: Lib — `exportAllData`

- [ ] 1.1 RED: Write failing test — mock `localStorage` with empty/corrupt/normal `workoutapp.*` keys, verify blob creation and `<a>.click` trigger
- [ ] 1.2 GREEN: Create `src/lib/export-data.ts` — `exportAllData()` reads `workoutapp.*` keys, builds JSON, triggers download via Blob + anchor click
- [ ] 1.3 REFACTOR: Clean up — add `ponytail:` comment noting browser-native, no deps

### Phase 2: UI wiring

- [ ] 2.1 Add "Export All Data" button to `src/components/StatsDashboard.tsx`, call `exportAllData` on click
- [ ] 2.2 Visual test: button renders when sessions exist

### Phase 3: Verify

- [ ] 3.1 Verify tests pass, manual check that downloaded JSON contains all user data keys
