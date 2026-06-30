# Tasks: Branch Consolidation — 6 feature branches + untracked work into `main`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-250 (conflict resolutions + untracked files) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single operation — can't chain a consolidation |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Consolidate all branches into `main` + fix conflicts + verify | PR 1 | Single operation. Phase 4 conflicts need manual resolution. |

## Phase 1: Pre-consolidation Setup

- [x] 1.1 Tag all 6 branches as `pre-consolidation/<branch-name>` for rollback safety
- [x] 1.2 Save stash list: `git stash list` — verify stash `@{0}` is the phase-2-editor one

## Phase 2: Branch Merges (topological order)

- [x] 2.1 `git checkout -b main feat/phase-0-foundation` — create main
- [x] 2.2 `git merge feat/phase-1-model-engine` — fast-forward, no conflicts
- [x] 2.3 `git merge feat/phase-1-components` — fast-forward, no conflicts (same commit as feat/phase-1-integration)
- [x] 2.4 `git merge feat/phase-2-foundation` — fast-forward, no conflicts
- [x] 2.5 `git merge feat/phase-2-editor` — fast-forward, no conflicts
- [x] 2.6 `git stash apply stash@{1}` (phase-2-editor stash, index shifted) — no conflicts
- [x] 2.7 Commit stash changes — `git add -A` + commit `chore: apply phase-2 integration work`
- [x] 2.8 `git merge feat/phase-4-foundation` — 1 conflict in `src/types/workout.ts`, resolved additive (kept all types)
- [x] 2.9 Commit untracked Phase 3 + Phase 4 PR#2 files — in progress

## Phase 3: Build Fixes

- [ ] 3.1 Run `npx tsc --noEmit` — fix all TS errors (import paths, missing exports, type mismatches)
- [ ] 3.2 Fix any missing packages imported by untracked files — add to `package.json` if needed
- [ ] 3.3 Iterate `npm run dev` until it starts without errors

## Phase 4: Verification

- [ ] 4.1 `git log --oneline main` — verify all branches + stash + untracked commits are present
- [ ] 4.2 Verify pages render: workouts, sequences, exercises, history, calendar, timer

## Phase 5: Cleanup

- [ ] 5.1 Delete stale feature branches (local): `feat/phase-0-foundation`, `feat/phase-1-model-engine`, `feat/phase-1-components`, `feat/phase-2-foundation`, `feat/phase-2-editor`, `feat/phase-4-foundation`
- [ ] 5.2 Delete stale feature branches (remote, if pushed)
