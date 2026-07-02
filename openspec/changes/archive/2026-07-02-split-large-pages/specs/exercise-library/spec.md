# Delta for Exercise Library

**Type**: Refactoring — zero behavior change

## Refactoring Overview

Extract inline sub-components from a single 501-line page into dedicated files. All requirements (EL-1 through EL-12) and their scenarios from `openspec/specs/exercise-library/spec.md` remain **unchanged** in behavior. Only code organization changes.

## Structural Changes

| Extraction | Target | Exported As | Receives |
|------------|--------|-------------|----------|
| `ExerciseSearchHeader` (search + filter bar) | `src/components/ExerciseSearchHeader.tsx` | Named export `ExerciseSearchHeader` | `search`, `filter`, `onSearchChange`, `onFilterChange` as props |
| `ExerciseFormDialog` (create/edit form in `<dialog>`) | `src/components/ExerciseFormDialog.tsx` | Named export `ExerciseFormDialog` | `exercise?`, `onSave`, `onClose` as props |
| `ExerciseDeleteDialog` (delete confirmation) | `src/components/ExerciseDeleteDialog.tsx` | Named export `ExerciseDeleteDialog` | `exercise`, `referenceCount`, `onConfirm`, `onCancel` as props |

### File Impact

| File | Before | After | Change |
|------|--------|-------|--------|
| `src/app/exercises/page.tsx` | ~501 lines | ~200 lines | Inline components removed, imports added |

### Verification

- `next build` passes with zero errors
- Exercises page renders identically before and after extraction
- All exercise-library spec scenarios remain testable without modification

## Affected Requirements

No requirements are ADDED, MODIFIED, REMOVED, or RENAMED. All existing requirements in `openspec/specs/exercise-library/spec.md` remain in full effect.
