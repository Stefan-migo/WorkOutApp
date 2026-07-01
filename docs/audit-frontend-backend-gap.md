# Audit: Frontend-Backend Gap Analysis

> Date: 2026-07-01
> Scope: All 14 pages, 17 components, 11 hooks
> App type: Pure frontend (localStorage persistence)

## Summary

Since this is a pure frontend app, "backend" refers to the data/hooks layer. The audit identifies UI elements that render but have no corresponding data support — buttons with empty handlers, placeholders that never populate, and features implied by the UI but not backed by the data model.

---

## 🟢 Works Correctly

- **Dashboard** — greeting, date, today's workout, workout count, hero card, quick actions. All backed by `useWorkoutContext`, `useSessions`, `useWeekPlans`.
- **Workout list page** — CRUD via `useWorkoutContext` (`saveWorkout`, `deleteWorkout`, `getWorkout`).
- **Workout new/edit** — full editor with intervals. `useWorkoutContext` persistence.
- **Workout play** — timer controls work via `useTimer`, completion saves to `useSessions`.
- **Sequences list/new/play** — `useSequences` CRUD + sequence-engine for expansion.
- **Exercises list** — `useExercises` CRUD, categories, seed data.
- **Calendar** — week plans via `useWeekPlans`, day assignments via `DayAssignmentModal`.
- **History list** — sessions via `useSessions`.
- **Stats Dashboard** — volume chart, strain gauge, consistency heatmap via `useStats`.
- **Nav** — all 7 routes point to existing pages. Bottom nav shows first 5 correctly.

---

## 🟡 Placeholder / Decorative / Non-Functional

### StatsDashboard
| Element | Issue | File |
|---------|-------|------|
| "Personal Records" section | Data hardcoded (`PLACEHOLDER_PRS`). No PR data model exists. | `StatsDashboard.tsx:53-58` |
| "View All" link in PRs | Clicking does nothing (no handler). | `StatsDashboard.tsx:246` |
| "Detailed View" button | Renders but no `onClick` handler. | `StatsDashboard.tsx:129-133` |
| "Export CSV" button | Downloads JSON, not CSV. The label is wrong. | `StatsDashboard.tsx:123-127` |

### History Page
| Element | Issue | File |
|---------|-------|------|
| "Filters" button | `onClick` handler is empty — does nothing. | `history/page.tsx:168-172` |
| "This Month" dropdown/button | `onClick` handler is empty — does nothing. | `history/page.tsx:173-186` |

### History Detail
| Element | Issue | File |
|---------|-------|------|
| "Calories" metric card | Always shows `—`. No calorie tracking in data model. | `history/[id]/page.tsx:160-199` |
| "Avg HR" metric card | Always shows `—`. No heart rate tracking in data model. | `history/[id]/page.tsx:160-199` |
| "Peak HR" metric card | Always shows `—`. No heart rate tracking in data model. | `history/[id]/page.tsx:160-199` |

### Calendar
| Element | Issue | File |
|---------|-------|------|
| Motivational card | Hardcoded "On track for a 4-week streak" — never reflects actual data. | `calendar/page.tsx:335-352` |

### Exercise Page
| Element | Issue | File |
|---------|-------|------|
| "Add to Workout" | Navigates to an empty new workout without actually adding the exercise. | `exercises/page.tsx` |

### PlayHeader
| Element | Issue | File |
|---------|-------|------|
| `volume_up` icon | Decorative — no `onClick`, no handler. | `PlayHeader.tsx:21` |
| `more_vert` icon | Decorative — no `onClick`, no handler. | `PlayHeader.tsx:22` |

---

## 🔴 Missing Data Support

These UI elements imply data that does not exist in the model:

| Data gap | Where it surfaces | Root cause |
|----------|-------------------|------------|
| **Personal Records** | StatsDashboard | No `PersonalRecord` type or collection in data model |
| **Calories burned** | History detail | No calorie tracking in `Session` / `CompletedInterval` |
| **Heart rate** | History detail | No HR tracking in `Session` / `CompletedInterval` |
| **RPE (Rate of Perceived Exertion)** | Timeline (derived) | Currently derived from work/rest ratio — no actual RPE input |
| **4-week streak** | Calendar sidebar | No streak computation exists outside `useStats` |
| **CSV export** | StatsDashboard | Only `exportAllData()` (JSON) exists in `export-data.ts` |

---

## 🔵 Navigation Audit

| Route | Page exists? | In Nav? | Notes |
|-------|-------------|---------|-------|
| `/` (Dashboard) | ✅ | ✅ | |
| `/workouts` | ✅ | ✅ | |
| `/workouts/new` | ✅ | ❌ | Via "Create" button |
| `/workouts/[id]/edit` | ✅ | ❌ | Dynamic route |
| `/workouts/[id]/play` | ✅ | ❌ | Dynamic route |
| `/sequences` | ✅ | ✅ | |
| `/sequences/new` | ✅ | ❌ | Via "Create" button |
| `/sequences/[id]/play` | ✅ | ❌ | Dynamic route |
| `/exercises` | ✅ | ✅ | |
| `/calendar` | ✅ | ✅ | |
| `/history` | ✅ | ✅ | |
| `/history/[id]` | ✅ | ❌ | Dynamic route |
| `/stats` | ✅ | ✅ | |

All routes resolve. No 404s from navigation.

---

## Recommendations by Severity

### Fix immediately (misleading UX)
1. **"Export CSV" → "Export JSON"** or implement CSV export. Label is wrong.
2. **"Add to Workout"** in exercises should actually add the exercise, or remove the button.
3. **"Filters" / "This Month"** in History — either implement filtering or remove the buttons.

### Fix (remove or make honest)
4. **HR/Calories cards** in history detail — either remove or replace with "Coming soon".
5. **Motivational card** in calendar — either compute real streak or remove.
6. **"Detailed View" / "View All"** in StatsDashboard — remove non-functional buttons.

### Defer (model change needed)
7. **Personal Records** — requires new data type and tracking.
8. **CSV export** — requires mapping data to CSV format.
9. **Calories/HR tracking** — requires changes to `CompletedInterval` or new tracking model.
