# Notifications & Export

## Purpose

Browser notifications when the tab is hidden during a timer and JSON export of all user data from localStorage.

## Requirements

### Notifications

| ID | Description | Keyword |
|----|-------------|---------|
| NE-1 | SHALL request `Notification` permission on first timer start gesture (not on page load) | MUST |
| NE-2 | SHALL dispatch a notification when timer auto-advances AND `document.hidden` is `true` | MUST |
| NE-3 | SHALL include in the notification body: workout name, current interval name, and "N of M intervals" | MUST |
| NE-4 | SHALL, on notification click, focus the browser tab (MUST NOT navigate to a URL) | MUST |
| NE-5 | SHALL silently skip notification dispatch when `Notification.permission` is `"denied"` (no repeated prompts, no console errors) | MUST |
| NE-6 | SHALL use `navigator.serviceWorker.ready` if a service worker is registered, falling back to `new Notification(...)` | SHOULD |

#### Scenario: Tab visible, timer advances
- GIVEN timer is running with tab focused (`document.hidden` is `false`)
- WHEN timer auto-advances to the next interval
- THEN no notification is shown
- AND the beep plays as normal

#### Scenario: Tab hidden, timer advances
- GIVEN timer is running with tab hidden (`document.hidden` is `true`) and notification permission granted
- WHEN timer auto-advances to the next interval
- THEN a notification is shown with the workout name, current interval name, and "N of M intervals"
- AND clicking the notification focuses the tab

#### Scenario: Permission denied
- GIVEN `Notification.permission` is `"denied"`
- WHEN timer auto-advances with tab hidden
- THEN no notification is dispatched
- AND no prompt is shown
- AND no error is surfaced to the user

#### Scenario: Permission requested on first start
- GIVEN notification permission has not been requested yet
- WHEN user taps start on the timer for the first time
- THEN the browser prompts for notification permission
- AND the timer still starts regardless of the permission response

### Export

| ID | Description | Keyword |
|----|-------------|---------|
| EX-1 | SHALL render a button labeled "Export JSON" on the `/stats` page | MUST |
| EX-2 | SHALL, on click, collect all localStorage keys matching `workoutapp.*` into a single JSON object keyed by collection name | MUST |
| EX-3 | SHALL trigger download as `workoutapp-export-{YYYY-MM-DD}.json` with `Content-Type: application/json` | MUST |
| EX-4 | SHALL handle empty data by producing valid JSON where each collection maps to an empty array | MUST |
| EX-5 | SHALL recover from corrupt localStorage entries by skipping the corrupt key and exporting all valid keys | MUST |

#### Scenario: Export with data
- GIVEN localStorage contains workouts, sessions, and sequences under `workoutapp.*` keys
- WHEN user clicks "Export JSON"
- THEN a JSON file downloads containing all keys in a single object like `{"workouts":[...],"sessions":[...],"sequences":[...]}`
- AND the filename follows `workoutapp-export-{YYYY-MM-DD}.json`

#### Scenario: Export with no data
- GIVEN no `workoutapp.*` keys exist in localStorage
- WHEN user clicks "Export JSON"
- THEN a valid JSON file downloads: `{}`
- AND no error is shown

#### Scenario: Corrupt localStorage entry
- GIVEN one `workoutapp.*` key contains unparseable data
- WHEN user clicks "Export JSON"
- THEN the corrupt key is skipped
- AND all valid keys are included in the download
- AND no error is surfaced to the user

#### Scenario: Missing export button on stats page
- GIVEN user visits `/stats`
- THEN a button labeled "Export JSON" is visible
- AND it is not disabled
