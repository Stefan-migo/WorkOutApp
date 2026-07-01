# Design: Phase 6 — Notifications & Export

## Technical Approach

Two independent browser-native features layered on the existing timer:

1. **Notifications** — new `useIntervalNotification` hook (matching `useBeep` pattern) checks `document.hidden`, requests permission on first call, dispatches `Notification` API on interval transition. Wired into both play pages alongside the existing `beep()` call.
2. **Export** — new pure lib function `exportAllData()` reads all `workoutapp.*` localStorage keys, builds a JSON object, triggers browser download. Button on the existing `/stats` page.

Both use zero external dependencies — Notification API, Blob, and anchor click are all browser-native.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Notification placement | Hook vs inline in component | **Hook** (`useIntervalNotification`) | Matches existing `useBeep` pattern; testable, keeps play pages clean |
| Export implementation | Lib function vs inline in component | **Lib function** (`export-data.ts`) | Pure function, unit-testable without React, no UI coupling |
| Export button location | `/stats` vs new `/settings` | **Existing `/stats`** | No user-facing preference to configure (permission is browser-managed). YAGNI for settings page |
| Permission request timing | On mount vs on first start | **First start gesture** | Spec NE-1: deferred to user interaction to avoid blocking autoplay and respecting browser permission policies |

## Data Flow

```
Timer onComplete
  ├── beep()  [existing — always plays]
  └── notify(workoutName, idx+1, total)  [new]
        ├── document.hidden?  NO  → skip
        ├── permission denied?      → skip
        ├── permission default?     → request → skip if denied
        └── permission granted      → new Notification(...)
                                      └── onclick → window.focus()

Export button click
  └── exportAllData()
        ├── Object.keys(localStorage).filter(k => k.startsWith('workoutapp.'))
        ├── for each: JSON.parse(value), skip on error (corrupt entry)
        ├── extract collection name from key suffix
        └── Blob → URL.createObjectURL → <a>.click → download
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useIntervalNotification.ts` | **Create** | Hook: returns `{ notify }`, handles permission + dispatch + hidden check |
| `src/lib/export-data.ts` | **Create** | Pure function: collect all `workoutapp.*` keys, build JSON, trigger download |
| `src/components/StatsDashboard.tsx` | **Modify** | Add "Export All Data" button calling `exportAllData` |
| `src/app/workouts/[id]/play/page.tsx` | **Modify** | Add `useIntervalNotification()`, call `notify(...)` in timer `onComplete` |
| `src/app/sequences/[id]/play/page.tsx` | **Modify** | Same — add notification call alongside `beep()` |

## Interfaces

```typescript
// src/hooks/useIntervalNotification.ts
export function useIntervalNotification(): {
  notify: (workoutName: string, currentIndex: number, totalIntervals: number) => void
}

// src/lib/export-data.ts
export function exportAllData(): void  // pure, reads localStorage, triggers download
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `exportAllData` | Mock `localStorage` with empty/corrupt/normal data; verify blob creation and anchor click trigger |
| Unit | `useIntervalNotification` | `renderHook` with mocked `Notification`; test permission request flow and dispatch |
| Visual | Export button presence | StatsDashboard renders button when sessions exist |

## Migration / Rollout

No migration required. Both features are additive:
- Notifications: permission prompt appears on first timer start, transparent otherwise
- Export: button appears on /stats, no data transformation needed

`ponytail:` Both features are <40 lines each, zero new dependencies, no state migration.

## Open Questions

None.
