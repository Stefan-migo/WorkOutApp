# Tasks: Exercise Integration v2

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~870 (5 PRs × 120–220) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | 5 stacked PRs |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Favorites hook + star toggle | PR 1 | base=main; standalone, no deps |
| 2 | Library layout redesign | PR 2 | base=main; compact cards, filter bar, favorites tab |
| 3 | Rich ExercisePicker component | PR 3 | base=main; new picker + IntervalDetailSheet wiring |
| 4 | IntervalRow + WorkoutEditor wiring | PR 4 | base=main; exercise preview row, pass exercises to sheet |
| 5 | ExercisePanel upgrade + play pages | PR 5 | base=main; full Exercise prop, gallery + instructions + metadata |

---

## PR 1 — Favorites hook + star toggle (~180 lines)

### Phase 1.1: Foundation

- [x] 1.1.1 Create `src/hooks/useFavorites.ts` — localStorage key `workoutapp.favorites`, return `{ favoriteIds, toggleFavorite, isFavorite, favoriteExercises, removeFavorite }` with `favoriteExercises` derived by mapping IDs against exercises list.

### Phase 1.2: UI Implementation

- [x] 1.2.1 Add star toggle button to exercise cards in `src/app/exercises/page.tsx` — filled star when favorited, outline when not, calls `toggleFavorite(id)` on click, stops propagation.
- [x] 1.2.2 Add star toggle button to `src/app/exercises/[id]/page.tsx` — same star icon in header area.

### Phase 1.3: Testing

- [x] 1.3.1 Write unit tests for `useFavorites` — mock localStorage, verify toggle adds/removes ID, verify `isFavorite`, verify `favoriteExercises` derivation and orphan ID filtering.
- [x] 1.3.2 Update `src/app/exercises/__tests__/ExercisesPage.test.tsx` — verify star renders and toggles on card click.

---

## PR 2 — Library layout redesign (~200 lines)

### Phase 2.1: Foundation

- [x] 2.1.1 Add "Favorites" filter tab to `src/app/exercises/page.tsx` — star icon tab in filter row, when active filters to `favoriteIds` only with empty state "No favorites yet — star exercises to add them".
- [x] 2.1.2 Compact card layout in `src/app/exercises/page.tsx` — 48x48 image thumbnail, name truncated to one line, difficulty/force/mechanic badges, primary muscles chips (max 3, "+N" overflow), category badge top-right.

### Phase 2.2: Grid + Filter Bar

- [x] 2.2.1 Update grid responsiveness — `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` with proportional gaps.
- [x] 2.2.2 Make filter bar sticky — sticky at top of exercise list, collapsible filter sections with chevron toggle and active count badge on collapsed groups.
- [x] 2.2.3 Category section headers — sticky headers with name + count, collapsible sections.

### Phase 2.3: Testing

- [x] 2.3.1 Update `ExercisesPage.test.tsx` — verify favorites filter tab shows only favorited exercises, verify compact card layout renders thumbnail + badges.

---

## PR 3 — Rich ExercisePicker component (~220 lines)

### Phase 3.1: Foundation

- [x] 3.1.1 Create `src/components/ExercisePicker.tsx` — opens as `<dialog>` with search input, multi-dimension filter buttons (category/force/mechanic/difficulty), rich card options showing 40x40 thumbnail + name + category badge + muscles chips + difficulty/force/mechanic badges + favorite star.
- [x] 3.1.2 Implement mini preview card in ExercisePicker — when selected, shows 40x40 thumbnail + name + category + muscles + difficulty/force/mechanic + equipment (max 3) + first 2 instructions + "View Full Details" link.

### Phase 3.2: Integration

- [x] 3.2.1 Replace `<select>` in `src/components/IntervalDetailSheet.tsx` with ExercisePicker for work-type intervals — show mini preview card when exerciseId is set, "Select Exercise" button opens picker dialog.
- [x] 3.2.2 Import `useExercises` in `src/components/WorkoutEditor.tsx` and pass `exercises` array to `IntervalDetailSheet`.

### Phase 3.3: Testing

- [x] 3.3.1 Write integration test for ExercisePicker — render with exercises, simulate search + filter + selection, verify callback fires with correct id.
- [x] 3.3.2 Update IntervalDetailSheet tests — verify picker trigger and mini preview card render after selection.

---

## PR 4 — IntervalRow preview + WorkoutEditor wiring (~120 lines)

### Phase 4.1: Implementation

- [x] 4.1.1 Update `src/components/IntervalRow.tsx` — when `exerciseId` is set on work interval, show exercise preview with 32x32 thumbnail + exercise name (link to `/exercises/[id]`) + primary muscles chips (max 2).
- [x] 4.1.2 Verify `src/components/WorkoutEditor.tsx` — already passes `exercises` to IntervalDetailSheet (wired in PR 3), exercise lookup uses existing `getExercise()`.

### Phase 4.2: Testing

- [x] 4.2.1 Update IntervalRow tests — verify preview section renders for work intervals with exerciseId, verify rest intervals show no preview.
- [x] 4.2.2 Verify edge case: IntervalRow with no exerciseId shows no preview section.

---

## PR 5 — ExercisePanel upgrade + play pages (~150 lines)

### Phase 5.1: Implementation

- [x] 5.1.1 Rewrite `src/components/ExercisePanel.tsx` — accept `exercise?: Exercise` prop instead of flat name/description/imageUrl/chips. Render image gallery (scroll-snap), numbered instructions list (collapsible), all metadata chips (primary/secondary muscles, equipment, force, mechanic, difficulty, category), source badge. Show "Exercise not found (ID: ...)" when undefined.
- [x] 5.1.2 Update `src/app/workouts/[id]/play/page.tsx` — pass full `exercise` object to ExercisePanel instead of flat props.
- [x] 5.1.3 Update `src/app/sequences/[id]/play/page.tsx` — same pattern, pass full `exercise` object.

### Phase 5.2: Testing

- [x] 5.2.1 Write tests for ExercisePanel — verify render with full exercise, verify "not found" fallback, verify SVG placeholder when images array is empty.
- [x] 5.2.2 Update play page tests — verify full Exercise object is passed from both workout and sequence play pages.

---

## Execution Order

1. **PR 1** (base: main) — Favorites hook, zero deps, standalone
2. **PR 2** (base: main) — Library layout, uses `useFavorites` from PR 1
3. **PR 3** (base: main) — ExercisePicker + IntervalDetailSheet integration
4. **PR 4** (base: main) — IntervalRow preview, depends on PR 3 wiring
5. **PR 5** (base: main) — ExercisePanel + play pages, lowest dependency

Each PR is stacked to **main** sequentially. Rebase each PR before review to avoid conflicts with the preceding merge. Total ~870 changed lines across 5 reviews of 120–220 lines each.
