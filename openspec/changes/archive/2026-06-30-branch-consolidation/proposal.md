# Proposal: Branch Consolidation — Rebase 6 feature branches + untracked work into `main`

## Intent

WorkOutApp has 6 feature branches and untracked work from 4 SDD phases (1–4) that were
never consolidated into `main`. The project is fragmented — `npm run dev` fails with 20+
TS errors, untracked files import non-existent modules, and `feat/phase-4-foundation`
(HEAD) starts from Phase 0, omitting Phases 1–3 entirely. This change merges everything
into a single `main` branch and restores the dev build.

## Scope

### In Scope
- Create `main` from `feat/phase-0-foundation`
- Merge 6 branches in topological order: phase-0 → phase-1-model-engine → phase-1-components → phase-2-foundation → phase-2-editor (+ stash) → phase-4-foundation
- Commit untracked files (Phase 3 exercise library, Phase 4 PR#2 calendar UI)
- Fix all TS/import errors so `npm run dev` passes

### Out of Scope
- Restoring deleted `openspec/` artifacts from the stash (already archived)
- Phase 3/4 spec-level delta merges into main specs
- Code review or refactoring of merged code
- Adding test infrastructure

## Capabilities

> No spec-level behavior changes — this is pure consolidation.
> All capabilities already exist across branches and untracked files.

### New Capabilities
None.

### Modified Capabilities
None. Spec-level behavior is unchanged — code moves between branches, no requirements change.

## Approach

1. `git checkout -b main feat/phase-0-foundation`
2. `git merge feat/phase-1-model-engine` — linear, no conflicts
3. `git merge feat/phase-1-components` — fast-forward (already ahead of phase-1-engine)
4. `git merge feat/phase-2-foundation` — linear, no conflicts
5. `git merge feat/phase-2-editor` — no expected conflicts (depends on phase-2-foundation)
6. `git stash apply stash@{0}` — restores Phase 2 editor refinements + removes old openspec dirs
7. `git add` + commit untracked Phase 3 files (exercise pages, seed, hooks, picker)
8. `git merge feat/phase-4-foundation` — **conflicts expected**: phase-4 branched from phase-0 and shares files modified by phases 1–2 (interval-engine, types, hooks). Resolve manually.
9. `git add` + commit untracked Phase 4 PR#2 files (calendar page, DayAssignmentModal)
10. Fix remaining TS errors, run `npm run dev` until clean

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/` (all) | Modified | Merges from 6 branches + stash + untracked |
| `openspec/` | Cleaned up | Stash deletes old phase-0 artifacts (already archived) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Phase 4 merge conflicts (diverged from phase-0) | High | Merge phase-4 last; resolve conflicts manually |
| Stash conflicts (modifies files changed by phases 1–2) | Medium | Apply stash after phases 1-2 are merged; resolve manually |
| Missing dependencies from Phase 3 untracked files | Medium | Untracked imports may reference packages not installed; add to package.json if needed |
| Phase 3 types don't match Phase 2 model | Low | Phase 3 was built on Phase 2 types; verify during TS fix step |

## Rollback Plan

```bash
git checkout --orphan temp-main $(git commit-tree -m "rollback-savepoint" HEAD^{tree})
git branch -D main
git checkout -b main feat/phase-0-foundation
```
Before step 1, tag the final state of each branch as `pre-consolidation/<branch-name>`.
Before each merge, create a lightweight tag (`merge-savepoint/<step>`).

## Dependencies

- Git access to all remote branches (all local — no external blockers)
- Familiarity with the codebase to resolve Phase 4 merge conflicts

## Success Criteria

- [ ] `git log --oneline main` shows all commits from all 6 branches + stash + untracked
- [ ] `npm run dev` starts without TS errors
- [ ] All pages render: workouts, sequences, exercises, history, calendar, timer
- [ ] localStorage hooks persist data across all features
