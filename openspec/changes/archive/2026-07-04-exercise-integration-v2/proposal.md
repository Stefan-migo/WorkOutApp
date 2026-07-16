# Proposal: Exercise Integration v2

## Intent

Exercise library grew from 20 to 800+ items, but the UI hasn't scaled. Exercise selection in workouts uses a flat `<select>` — images, muscles, difficulty, and instructions are hidden everywhere. This change surfaces exercise richness at every touchpoint: favorites, library, workout editor, and timer play pages.

## Scope

### In Scope
- Favorites system: localStorage hook, star toggle on cards, favorites filter tab
- Library redesign: compact cards, denser grid, collapsible filter sections
- Rich ExercisePicker: replaces `<select>` in IntervalDetailSheet — thumbnail + metadata
- IntervalRow exercise preview: thumbnail + name + primary muscles chips
- ExercisePanel upgrade: accepts full `Exercise` object, shows instructions + gallery + metadata

### Out of Scope
- Auth/user profiles (deferred to Supabase)
- Favorites sync across devices (localStorage-only)
- Video/GIF upload (images only)
- Exercise create/edit UX (unchanged)

## Capabilities

### New Capabilities
- `exercise-favorites`: toggle + localStorage persistence + filtered views

### Modified Capabilities
- `exercise-library`: compact cards, favorites filter tab, collapsible filters
- `exercise-picker`: rich card display (images, metadata, badges) instead of flat list
- `workout-editor`: IntervalDetailSheet uses rich picker, IntervalRow shows preview

## Approach

Five chained PR slices (~150–250 lines each):

1. **Favorites hook + UI** — `useFavorites` localStorage hook, star toggle on `/exercises` cards, "Favorites" filter tab
2. **Library redesign** — Compact card layout, smaller thumbnails, collapsible filter groups, favorites section pinned at top
3. **Rich ExercisePicker** — New component replaces `<select>` in IntervalDetailSheet; shows thumbnail, name, category, difficulty, force/mechanic badges; search + category filter preserved
4. **IntervalRow preview** — Show exercise thumbnail + name + primary muscles when exerciseId set
5. **ExercisePanel upgrade** — Accept full `Exercise` prop; render image gallery, numbered instructions, all metadata chips (muscles, force, mechanic, difficulty, equipment)

## Affected Areas

| Area | Impact | Changes |
|------|--------|---------|
| `src/hooks/useFavorites.ts` | New | localStorage favorites hook |
| `src/components/IntervalDetailSheet.tsx` | Modified | `<select>` → ExercisePicker |
| `src/components/IntervalRow.tsx` | Modified | Exercise thumbnail + muscles |
| `src/components/ExercisePanel.tsx` | Modified | Accept `Exercise` object |
| `src/components/ExercisePicker.tsx` | New | Rich card picker component |
| `src/app/exercises/page.tsx` | Modified | Compact layout, favorites tab |
| `src/app/workouts/[id]/play/page.tsx` | Modified | Pass full Exercise to panel |
| `src/app/sequences/[id]/play/page.tsx` | Modified | Pass full Exercise to panel |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Picker perf with 800+ items | Low | Debounce search; virtualize if needed |
| localStorage key collision | Low | Namespace `workoutapp.favoriteExercises` |
| Chained PR conflicts | Med | Sequential slices, rebase each PR |

## Rollback Plan

Revert individual PR commits. No schema/data migration — fully client-side. `git revert` each merge commit.

## Dependencies

None.

## Success Criteria

- [ ] Star toggle persists across reloads (localStorage)
- [ ] "Favorites" filter shows only favorited exercises
- [ ] ExercisePicker shows thumbnail + category + difficulty + badges
- [ ] IntervalRow displays exercise thumbnail + primary muscles
- [ ] ExercisePanel renders instructions list + image gallery + full metadata
