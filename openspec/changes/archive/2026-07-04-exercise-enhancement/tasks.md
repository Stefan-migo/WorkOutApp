# Tasks: Exercise Enhancement

## 1. Review Workload Forecast

| Metric | Estimate |
|--------|----------|
| **Total estimated lines** | ~1,300–1,550 |
| **Review budget** | 400 lines (hard cap) |
| **PRs required** | 3 (force-chained, stacked-to-main) |

Forecast is **High** — well beyond a single 400-line review. Chained PRs are confirmed.

---

## 2. Work Units

| PR | Theme | Est. Lines | Review Load | Dependencies | Spec Coverage |
|----|-------|-----------|-------------|--------------|--------------|
| **PR 1** | Data Layer — model extension + free-exercise-db seed + type migration | ~380–450 | ✅ within budget | None | EL-1, EL-8, FI-1, FI-2, FI-4, FI-5, FI-7 |
| **PR 2** | Exercise Builder UI + Detail Page | ~550–650 | ❌ over budget, each phase reviewable independently | PR 1 | EB-1–EB-7, ED-1–ED-9, EL-11 (card update) |
| **PR 3** | IndexedDB Image Storage + Filter Upgrades | ~370–450 | ✅ within budget | PR 1 | EL-13, EL-14 (filters), FI-3, FI-6 |

> **Note on seed strategy**: The design.md (Section "Seed at runtime via `fetch()`") chooses runtime fetch from GitHub raw URL, cached in localStorage. The earlier proposal mentions embedding the JSON. Tasks follow the **design.md** as the authoritative source. Confirm if you want to pin a specific release tag URL before PR 1 implementation.

---

### PR 1: Data Layer — Model Extension + Seed

**Theme**: Extend `Exercise` type, create free-exercise-db mapper, replace seed logic, ensure backward compatibility with `muscleGroups`.

**Files changed**: ~5–6 files, ~380–450 lines

#### Phase 1.1 — Model types (`src/types/workout.ts`)
- [ ] 1.1.1 Add `primaryMuscles: string[]`, `secondaryMuscles: string[]`, `instructions: string[]`, `force?: 'push' | 'pull' | 'static'`, `mechanic?: 'compound' | 'isolation'`, `images: string[]`, `source: 'user' | 'free-exercise-db'` to `Exercise` interface
- [ ] 1.1.2 Keep `muscleGroups?: string[]` as-is (deprecated, readable by existing localStorage data)
- [ ] 1.1.3 Ensure `Interval.exerciseId` is unchanged — no schema migration needed

#### Phase 1.2 — Field mapper (`src/lib/free-exercise-db-mapper.ts`) — **new file**
- [ ] 1.2.1 Define `RawExercise` type matching free-exercise-db JSON structure
- [ ] 1.2.2 Implement `mapFreeExerciseDbEntry(raw): Exercise` with field mapping:
  - `primaryMuscles` → `primaryMuscles`
  - `secondaryMuscles` → `secondaryMuscles`
  - `level` → `difficulty` (map `expert` → `advanced`)
  - `instructions` → `instructions` (array, preserve order)
  - `equipment` → `equipment` (string → `string[]`, split on comma)
  - `images` → `images` (URL array)
  - `force`, `mechanic` → mapped directly
  - `category` → infer from `primaryMuscles` / existing field
  - `source: 'free-exercise-db'`
  - Generate stable `id` from slugified name
- [ ] 1.2.3 Implement `fetchAndSeedExercises(): Promise<Exercise[]>` — fetches JSON from a configurable GitHub raw URL, maps each entry, returns array
- [ ] 1.2.4 Export `FREE_EXERCISE_DB_URL` constant (configurable, point to a tagged release)

#### Phase 1.3 — Seed replacement (`src/lib/exercise-seed.ts`)
- [ ] 1.3.1 Remove 20 hardcoded entries
- [ ] 1.3.2 Replace with re-export of `fetchAndSeedExercises` from mapper (or keep as thin re-export layer)
- [ ] 1.3.3 Keep file for backward compat with import in `useExercises.ts` (contents change)

#### Phase 1.4 — Hook integration (`src/hooks/useExercises.ts`)
- [ ] 1.4.1 Add seed-from-fetch logic: on first mount, if `exercises.length === 0`, call `fetchAndSeedExercises()` and `setExercises(mapped)`
- [ ] 1.4.2 Ensure seed fires only once (use a `seeded` ref, same pattern as current code)
- [ ] 1.4.3 Handle fetch failure gracefully: log warning, keep empty array (user can still create exercises manually)
- [ ] 1.4.4 Add `muscleGroups` backward compat: if an exercise has `muscleGroups` but not `primaryMuscles`, treat `muscleGroups` as `primaryMuscles` for display

#### Phase 1.5 — Tests
- [ ] 1.5.1 **Unit** (`src/lib/__tests__/free-exercise-db-mapper.test.ts`): test field mapping with fixture data
  - `level: "expert"` → `difficulty: "advanced"`
  - `equipment: "barbell"` → `equipment: ["barbell"]`
  - `equipment: "barbell, dumbbell"` → `equipment: ["barbell", "dumbbell"]`
  - `instructions` array preserved as-is
  - Source exercises get `source: 'free-exercise-db'` and stable `id`
- [ ] 1.5.2 **Unit** (`src/lib/__tests__/exercise-seed.test.ts`): test seed flow
  - Empty localStorage triggers fetch
  - Non-empty localStorage skips fetch
  - Fetch failure logs warning, returns empty
- [ ] 1.5.3 **Unit**: verify `muscleGroups` backward compat — exercise with only `muscleGroups` displays correctly via fallback
- [ ] 1.5.4 Update `src/app/exercises/__tests__/ExercisesPage.test.tsx` mock data to include new fields (smoke test only — full card display changes in PR 2)

#### Phase 1.6 — Specs sync
- [ ] 1.6.1 Update `openspec/specs/exercise-library/spec.md` delta with new field definitions (EL-1, EL-8)

---

### PR 2: Exercise Builder UI + Detail Page

**Theme**: Replace basic `ExerciseFormDialog` with the rich Exercise Builder, create the `/exercises/[id]` detail page, update card display and delete dialog.

**Files changed**: ~7–8 files, ~550–650 lines

> **⚠ Review note**: This PR exceeds 400-line budget. Each phase below is independently reviewable. Phase 2.1–2.2 (Builder) and Phase 2.3–2.4 (Detail page + card updates) can be split across two stacked PRs if needed.

#### Phase 2.1 — Tag chip component (`src/components/TagChips.tsx`) — **new file**
- [x] 2.1.1 Create reusable `TagChips` component: chip display with remove button, autocomplete input that suggests from a provided list of existing values
- [x] 2.1.2 Support `onAdd(tag)`, `onRemove(tag)`, `suggestions: string[]`, `placeholder` props
- [x] 2.1.3 Derive suggestions from all exercises' existing field values (passed as prop, not fetched internally)
- [x] 2.1.4 Keyboard support: Enter to add, Backspace to remove last, arrow navigation in suggestions dropdown

#### Phase 2.2 — Builder dialog (`src/components/ExerciseFormDialog.tsx` — full replacement)
- [x] 2.2.1 Replace entire component with rich builder layout:
  - **Name input** (text, required)
  - **Category selector** (existing dropdown, unchanged)
  - **Tag chips** for `primaryMuscles` (autocomplete from all exercises' `primaryMuscles` values)
  - **Tag chips** for `secondaryMuscles` (autocomplete from all exercises' `secondaryMuscles` values)
  - **Tag chips** for `equipment` (autocomplete from all exercises' `equipment` values)
  - **Force selector** (radio/chips: push / pull / static)
  - **Mechanic selector** (radio/chips: compound / isolation)
  - **Difficulty selector** (existing dropdown, unchanged)
  - **Step editor** (numbered list with add/remove/reorder buttons — ponytail: up/down buttons, full DnD when UX demands it)
  - **Image URL input** (text field, adds URL to `images[]`)
  - **Live preview card** (renders name, category badge, primary muscles chips, first image)
- [x] 2.2.2 Support create (empty form) and edit (pre-populated from existing exercise) modes
- [x] 2.2.3 Validation: `name` non-empty required (blocks save), `force` radio push/pull/static, `mechanic` radio compound/isolation
- [x] 2.2.4 Update props interface — simplify: no more `muscleInput`/`equipmentInput` strings, use structured `form` state passed from parent

#### Phase 2.3 — Detail page (`src/app/exercises/[id]/page.tsx`) — **new file**
- [x] 2.3.1 Route `GET /exercises/[id]` renders full exercise view when `[id]` exists
- [x] 2.3.2 Display **image gallery**: CSS scroll-snap on mobile, max-w-[600px] on desktop (ponytail: CSS overflow-x scroll with snap, no JS carousel)
- [x] 2.3.3 Display **metadata chips**: name (h1), category badge, difficulty badge, force badge, mechanic badge
- [x] 2.3.4 Display **instructions** as a numbered `<ol>` list
- [x] 2.3.5 Display **primaryMuscles**, **secondaryMuscles**, **equipment** as tag chips
- [x] 2.3.6 Action buttons: Edit (opens builder pre-populated), Delete (opens ExerciseDeleteDialog), Add to Workout (navigates to `/workouts/new?exerciseId={id}`)
- [x] 2.3.7 404 state: "Exercise not found" with link back to `/exercises`

#### Phase 2.4 — Card display update (`src/app/exercises/page.tsx`)
- [x] 2.4.1 Update `EMPTY_FORM` to include new fields (`primaryMuscles`, `secondaryMuscles`, `instructions`, `force`, `mechanic`, `images`)
- [x] 2.4.2 Update card rendering: difficulty badge, force badge, mechanic badge, primary muscles chips (first 3), first image thumbnail or SVG placeholder
- [x] 2.4.3 Update `allMuscleGroups` derivation to aggregate from `primaryMuscles` + `secondaryMuscles` (with `muscleGroups` fallback) — was already done in PR 1
- [x] 2.4.4 Wire new builder props (remove `muscleInput`, `equipmentInput`; pass structured form + tag data)
- [x] 2.4.5 Add click-to-navigate on card → `/exercises/[id]` with `e.stopPropagation()` on action buttons

#### Phase 2.5 — Delete dialog update (`src/components/ExerciseDeleteDialog.tsx`)
- [x] 2.5.1 Add `exerciseName: string` prop; show "Delete {name}?" in confirmation text
- [x] 2.5.2 Keep existing workout reference count display (unchanged)

#### Phase 2.6 — Tests
- [x] 2.6.1 **Component** (`src/components/__tests__/ExerciseFormDialog.test.tsx`): builder validation
  - Empty name shows error, save blocked ✅
  - Step reorder persists on save ✅
  - Tag add/remove works ✅
  - Preview card shows form data ✅
- [x] 2.6.2 **Component** (`src/app/exercises/[id]/__tests__/page.test.tsx`): detail page — 15 tests
  - Existing exercise renders all sections (metadata, instructions list, chips, images, action buttons) ✅
  - Missing ID renders "Exercise not found" ✅
  - Edit button opens builder pre-populated ✅
  - Delete opens confirmation dialog ✅
  - "Add to Workout" navigates correctly ✅
- [x] 2.6.3 Update `src/app/exercises/__tests__/ExercisesPage.test.tsx` — 5 new card display tests
  - Difficulty badge, primary muscles chips, image thumbnail, SVG placeholder, card click navigation ✅

#### Phase 2.7 — Specs sync
- [x] 2.7.1 Create `openspec/specs/exercise-detail-view/spec.md`

---

### PR 3: IndexedDB Image Storage + Filter Upgrades

**Theme**: Image blob storage in IndexedDB, upgrade search filters with force/mechanic/difficulty/category chips.

**Files changed**: ~5–6 files, ~370–450 lines

#### Phase 3.1 — IndexedDB hook (`src/hooks/useIndexedDB.ts`) — **new file**
- [x] 3.1.1 Implement `useIndexedDB()` hook returning:
  - `getImages(exerciseId: string): Promise<{blobUrl: string, blobId: string}[]>` — returns blob URLs + IDs
  - `saveImage(exerciseId: string, file: File): Promise<string>` — stores blob, returns blob ID
  - `deleteImage(exerciseId: string, blobId: string): Promise<void>` — removes blob
  - `getUsage(): Promise<number>` — total bytes used
- [x] 3.1.2 Open database `workoutapp-images` with object store `images` keyed by auto-increment
- [x] 3.1.3 Enforce 10MB cap per exercise: before saving, sum existing blobs for that exercise; reject if new total exceeds cap
- [x] 3.1.4 Revoke blob URLs on cleanup to prevent memory leaks
- [x] 3.1.5 Ponytail: no fallback — IndexedDB is available in all modern browsers, tests use fake-indexeddb

#### Phase 3.2 — Image integration in hook layer (`src/hooks/useExercises.ts`)
- [x] 3.2.1 Integrate `useIndexedDB` into `useExercises`: expose `saveExerciseImage`, `deleteExerciseImage`, `getExerciseImages` alongside existing CRUD
- [x] 3.2.2 On detail page load, fetch images from IndexedDB and convert to blob URLs for rendering (combined gallery: external URLs + IDB blob URLs)
- [x] 3.2.3 Ponytail: skip external URL caching in IDB — YAGNI. External URLs render directly from the `images` array. IDB is for user uploads only.
- [x] 3.2.4 Ponytail: lazy-load images via `loading="lazy"`, not a virtualizer

#### Phase 3.3 — Filter chips in ExerciseSearchHeader (`src/components/ExerciseSearchHeader.tsx`)
- [x] 3.3.1 Add filter chip group: **Force** (all / push / pull / static) — static options (YAGNI: derive from all exercises)
- [x] 3.3.2 Add filter chip group: **Mechanic** (all / compound / isolation) — static options
- [x] 3.3.3 Add filter chip group: **Difficulty** (all / beginner / intermediate / advanced) — static options
- [x] 3.3.4 Add filter chip group: **Category** (all / strength / cardio / stretching / plyometrics / strongman / powerlifting / mobility / other) — static list
- [x] 3.3.5 Add new props: `forceFilter`, `mechanicFilter`, `difficultyFilter`, `categoryFilter` and their setters (optional — section only renders when all four are provided)
- [x] 3.3.6 Layout: new row below existing muscle group + equipment filters, same chip pattern (ChipGroup helper component)

#### Phase 3.4 — Filter integration in exercises page (`src/app/exercises/page.tsx`)
- [x] 3.4.1 Add state for new filters: `forceFilter`, `mechanicFilter`, `difficultyFilter`, `categoryFilter`
- [x] 3.4.2 Use static filter options (YAGNI: derive from all exercises — force/mechanic/difficulty/category have fixed valid sets)
- [x] 3.4.3 Extend filtered exercise logic in `useMemo` to include all new filter dimensions
- [x] 3.4.4 Pass new filter props to `ExerciseSearchHeader`

#### Phase 3.5 — Tests
- [x] 3.5.1 **Unit** (`src/hooks/__tests__/useIndexedDB.test.ts`): IndexedDB hook — 9 tests
  - Save image blob, retrieve it, verify blob URL is valid
  - 10MB cap: save images totaling <10MB passes, exceeding 10MB rejects
  - Delete image removes blob from store
  - `getUsage()` returns correct byte count
  - Multi-exercise isolation ensures exercises don't leak into each other
  - Unmount revocation cleans up blob URLs
  - Empty exercise (no images) returns empty array
  - Uses `fake-indexeddb` polyfill
- [x] 3.5.2 **Component** (`src/components/__tests__/ExerciseSearchHeader.test.tsx`): filter chips — 17 tests
  - Force filter renders Push/Pull/Static options
  - Clicking a filter chip activates it, clicking again deactivates
  - Each group shows All button that clears the filter
  - Secondary filter section only renders when all four on* handlers are provided
  - Renders all 18 static option chips (Force 3, Mechanic 2, Difficulty 3, Category 8)
- [x] 3.5.3 **Integration**: detail page tests updated — mock includes new `getExerciseImages`/`saveExerciseImage`/`deleteExerciseImage` returning empty data
- [x] 3.5.4 Ponytail: skip integration tests for filter combination and image caching — YAGNI. Filter logic is a simple useMemo with && checks. Image caching from external URLs was deferred (YAGNI).

#### Phase 3.6 — Specs sync
- [x] 3.6.1 Create `openspec/specs/exercise-image-storage/spec.md`
- [x] 3.6.2 Update `openspec/specs/exercise-picker/spec.md` delta (expanded exercise display fields)

---

## 3. Execution Order

```
PR 1 ──▶ PR 2 ──▶ PR 3
 │         │         │
 │         ├── Phase 2.1–2.2 (Builder)
 │         ├── Phase 2.3 (Detail page)
 │         └── Phase 2.4–2.7 (Card + tests)
 │                   │
 │                   └── Phase 3.1–3.2 (IndexedDB images)
 │                   └── Phase 3.3–3.6 (Filters + tests)
```

- PR 1 blocks everything — model types must exist before any UI consumes them.
- PR 2 phases could split into two stacked PRs if the combined diff exceeds 400 lines.
- PR 3 depends on PR 1 for types, but is independent of PR 2 (images and filters don't need the builder or detail page).

## 4. Spec Coverage Matrix

| Spec | PR 1 | PR 2 | PR 3 |
|------|------|------|------|
| free-exercise-db-integration (FI-1–FI-7) | FI-1, FI-2, FI-4, FI-5, FI-7 | — | FI-3, FI-6 |
| exercise-library delta (EL-1, EL-8, EL-11, EL-13, EL-14) | EL-1, EL-8 | EL-11 | EL-13, EL-14 |
| exercise-builder (EB-1–EB-7) | — | EB-1–EB-7 | — |
| exercise-detail-page (ED-1–ED-9) | — | ED-1–ED-9 | — |

## 5. Risks & Mitigations

| Risk | PR | Mitigation |
|------|----|-----------|
| free-exercise-db GitHub raw URL changes or becomes unavailable | PR 1 | Pin to a release tag, not `main`. Add user-visible error toast on fetch failure. |
| `idb` dependency not installed | PR 3 | Use native IndexedDB API directly in the hook — no extra dependency needed. Ponytail-compatible. |
| Card display diff in PR 2 plus builder + detail page may push over 400 lines | PR 2 | Split PR 2 into two: 2a (builder) and 2b (detail page + card updates). |
| Existing ExercisesPage test mocks need full rewrite for new fields | PR 1/2 | Phase 1.5.4 updates mock data minimally; Phase 2.6.3 does the full rewrite. |
