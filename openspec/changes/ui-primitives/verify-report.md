```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:c7fa4b99a194e4901c20e98094d0ff64cef819033286b229880537f4a3f7f474
verdict: pass
blockers: 0
critical_findings: 0
requirements: 8/8
scenarios: 12/12
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:c7fa4b99a194e4901c20e98094d0ff64cef819033286b229880537f4a3f7f474
build_command: npm run build-storybook
build_exit_code: 0
build_output_hash: sha256:4b9491a640213b047c9ada67e37ed73062b6f58f03307a87cee0e0c525654662
```

## Verification Report

**Change**: ui-primitives (PR 2 of design-system)
**Version**: ui-primitives spec (UIP-1..UIP-8, 12 scenarios)
**Mode**: Strict TDD
**Candidate**: 4 stacked slices 2a–2d, merged to `main` via PRs #7, #8, #9, #10. HEAD `73afd73` (Merge PR #10). Verified on `main` (read-only; no code modified).

**Verdict**: APPROVE WITH WARNINGS — 2 WARNING, 2 SUGGESTION, 0 CRITICAL

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 34 (2a: 10, 2b: 8, 2c: 8, 2d: 8) |
| Tasks marked [x] in tasks.md | 24 (2b, 2c, 2d complete) |
| Tasks unchecked | 10 — all slice 2a (2a.1–2a.10); see WARNING 1 |
| Tasks demonstrably implemented | 34/34 — 2a work is on main and gate-green (tsc 0, 662/662, 4/4 audit, build OK) |

### Evidence Gates (all 5 run on HEAD 73afd73)
| # | Command | Result | Tail |
|---|---------|--------|------|
| 1 | `npx tsc --noEmit` | ✅ exit 0 | no output |
| 2 | `npm test` | ✅ 662 passed / 0 failed — 63 files | `Test Files  63 passed (63)`, `Tests  662 passed (662)`, `Duration 236.21s` |
| 3 | `npm run test:a11y` | ✅ 84 passed / 0 failed — 12 files (chromium + axe) | `Test Files  12 passed (12)`, `Tests  84 passed (84)`, `Duration 52.03s` |
| 4 | `npm run audit:tokens` | ✅ 4 passed / 0 failed | `Test Files  1 passed (1)`, `Tests  4 passed (4)`, `Duration 4.09s` |
| 5 | `npm run build-storybook` | ✅ exit 0 | `✓ built in 8.85s`, `Storybook build completed successfully` |

Strict envelope: `test_command: npm test`, exit 0, `test_output_hash sha256:c7fa4b99…f474`; `build_command: npm run build-storybook`, exit 0, `build_output_hash sha256:4b9491a6…4662`.

### Spec Compliance Matrix (12 scenarios)
| Requirement | Scenario | Test / Evidence | Result |
|-------------|----------|-----------------|--------|
| UIP-1 | Storybook lists primitives | Barrel `index.ts` L4–19 exports all 8; 8 colocated CSF3 stories (`tags: ['autodocs']`); build-storybook exit 0; a11y suite imports all 8 story modules | ✅ COMPLIANT |
| UIP-2 | Unlabeled IconButton fails a11y | `IconButtonProps['aria-label']: string` required (IconButton.tsx L7) — TS-enforced; axe passes 4 labeled stories | ✅ COMPLIANT (type-level MUST; cannot render unlabeled) |
| UIP-3 | Card variants in dark mode | Browser axe on Default/Raised/Inset stories (84/84); token surfaces `bg-surface`/`shadow-card-hover`/`bg-bg` (Card.tsx L14–18) | ✅ COMPLIANT |
| UIP-3 | Badge meaning beyond color | Badge.tsx L19–20 comment; story text conveys meaning (Neutral/Primary/Success/…) | ✅ COMPLIANT |
| UIP-4 | Labeled field | Input.test.tsx: `for`/`id` association; axe on Default story | ✅ COMPLIANT |
| UIP-4 | Error announced | Input.tsx L68–69 `aria-invalid` + `aria-describedby`, chip near field L73–77; axe on WithError story | ✅ COMPLIANT |
| UIP-5 | Empty state with action | EmptyState.test.tsx (icon/title/body/action, 4 tests); stories Default/WithAction | ✅ COMPLIANT |
| UIP-6 | ESC close | Dialog.test.tsx L76–90 (`cancel` preventDefault + `onOpenChange(false)`); browser play ESC path (Dialog.stories.tsx L95–97) | ✅ COMPLIANT |
| UIP-6 | Backdrop close | Dialog.test.tsx L92–109 (target===dialog closes, content click does not); browser play backdrop path (L102–106) | ✅ COMPLIANT |
| UIP-6 | Reduced motion | Dialog.test.tsx L111–125 asserts `motion-reduce:translate-x-0 motion-reduce:transition-none`; Sheet story | ✅ COMPLIANT |
| UIP-7 | Play runs in CI | `npm run test:a11y` 84/84 in real chromium; plays: Button Sizes (click spy), Card Interactive, SearchInput ClearAffordance, Dialog OpenCloseFlow (open→ESC→backdrop→focus-restore) | ✅ COMPLIANT |
| UIP-8 | Sheet replaces duplicated CSS | Sheet variant implemented (Dialog.tsx L31–32); page migration to primitives is PR 3 scope (design L131) — future-scoped GIVEN, standard established | ✅ COMPLIANT (interpreted per design, matches PR 1 precedent) |

**Compliance summary**: 12/12 scenarios compliant

### Correctness (Static Evidence, UIP-1..8)
| Requirement | Status | Notes |
|------------|--------|-------|
| UIP-1 set + barrel | ✅ Implemented | 8 primitives + 8 stories + 8 unit tests + a11y compose; barrel complete (index.ts L4–19) |
| UIP-2 Button/IconButton | ✅ Implemented | Native `<button>` (Button.tsx L45); 4 variants, 3 sizes, pill/elevated; disabled `opacity-50 pointer-events-none`; IconButton md `h-11 w-11` = 44×44px (Constraint); required aria-label |
| UIP-3 Card/Badge | ✅ Implemented | Card default/raised/inset + interactive; Badge 9 tones incl. `segment-*`; presentational only |
| UIP-4 Input/SearchInput | ✅ Implemented | Visible label, `useId` default id, error chip + aria wiring; SearchInput `type="search"`, clear `aria-label="Clear search"` → `onChange('')` + refocus (SearchInput.tsx L60–64) |
| UIP-5 EmptyState | ✅ Implemented | Optional `icon` (aria-hidden), `title` h2, `body`, `action` (EmptyState.tsx L25–37) |
| UIP-6 Dialog/Sheet | ✅ Implemented | Native `<dialog>` controlled (Dialog.tsx L46–53 guard `!dialog.open`); backdrop `e.target === ref.current`; cancel preventDefault; close idempotent; `aria-modal` + `aria-labelledby` via useId; fixed/sheet; motion-reduce gated |
| UIP-7 plays + axe | ✅ Implemented | Play functions per interactive story; axe asserted explicitly per story (a11y test L22–36) |
| UIP-8 overlay standard | ✅ Implemented (established) | Dialog/Sheet is the standard; legacy overlay replacement is PR 3 scope per design |

### Coherence (Design DD-1..DD-8)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| DD-1 (D8) flat layout + barrel | ✅ Yes | 8 flat files + colocated stories/tests + `index.ts` |
| DD-2 (D11) plain Record maps | ✅ Yes | All 8 components use `Record<variant, string>`; no cva/asChild |
| DD-3 (D9) controlled native `<dialog>` | ✅ Yes | Dialog.tsx matches D9 contract exactly |
| DD-4 (D10) a11y infra | ⚠️ Partial | Dev deps installed; but shipped as separate `vitest.browser.config.ts` (not `test.projects` consolidation); `npx vitest run --project storybook` is inoperative (no projects) — real gate `npm run test:a11y` (see SUGGESTION 1) |
| DD-5 one browser compose test | ✅ Yes | `ui-primitives.a11y.test.ts` composes all 8 story files |
| DD-6 preview bg fix | ✅ Yes | preview.tsx L16 `var(--color-bg)`; zero raw hexes / stale Material var |
| DD-7 token-only audit | ✅ Yes | `npm run audit:tokens` 4/4; rule 3 scans ALL src files incl. `__tests__` and comments (token-audit.test.ts L56–64) — zero hex/rgba in primitives/stories/tests |
| DD-8 typography | ✅ Yes | Only `text-headline-md`, `text-body-md`, `text-label-caps`, `text-data-sm` used; grep for `text-body-sm`/`headline-sm`/`label-lg`/`text-data-md` in `src/components/ui/` → zero matches |

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | apply-progress (#1205) documents RED→GREEN per slice (2d in detail; 2a/2b/2c batch summaries) |
| All tasks have tests | ✅ | 9 test files on disk for 8 primitives + a11y compose |
| RED confirmed (tests exist) | ✅ | All 9 test files exist and import production components |
| GREEN confirmed (tests pass) | ✅ | 662/662 unit + 84/84 browser re-run in verify |
| Triangulation adequate | ✅ | Button: 4 variants + 3 sizes + pill + elevated + disabled; Badge: 9 tones; Dialog: 5 jsdom cases (open/close, aria, cancel, backdrop-vs-content, sheet); a11y: 84 browser cases |
| Safety Net for modified files | ✅ | Prior suites documented (620/620 in 2a, 662/662 final) |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit (jsdom) | 662 | 63 | vitest 4.1.10 + jsdom 29 |
| Integration (browser) | 84 | 12 | vitest browser + playwright chromium + axe-core |
| E2E | 0 | 0 | (not installed; plays run in-browser within vitest project) |
| **Total** | **746** | **75** | |

### Assertion Quality
**Assertion quality**: ✅ All assertions verify real behavior — Dialog tests assert open-attr sync, `defaultPrevented`, `onOpenChange` call args, backdrop-vs-content target distinction; Badge/Input/EmptyState tests pin the exact token class maps (the D11 design contract — same pattern as PR 1 TimerRing style-value assertions); no tautologies, no ghost loops, no type-only assertions. Minor caveat in SUGGESTION 2.

### Issues Found
**CRITICAL**: None

**WARNING**:
1. **tasks.md slice 2a tasks never marked complete** (openspec/changes/ui-primitives/tasks.md L33–44). 10/34 checkboxes (2a.1–2a.10) remain `[ ]`; git history shows "mark slice complete" commits for 2b/2c/2d (`da03e29`, `c87231b`, `87d0d6a`) but none for 2a. The work itself IS complete and verified (Button/IconButton/barrel/infra on main; tsc 0, suite green, audit 4/4, build OK). Tracking gap only — the checkbox row misleads future audits into thinking 2a is pending. Fix: a `chore(openspec): mark slice 2a tasks complete` commit.
2. **Three documented a11y deviations from design.md class maps** — all one defect class (dark-tint text fails WCAG AA), all resolved identically (`text-{tone}`/`text-muted` → `text-fg-2`):
   - Badge (2b): design L79–80 `text-success/warn/danger` on `/15` and `text-segment-*` on `/10` tints → `text-fg-2` (Badge.tsx L19–23 comment: measured 1.23–3.58:1, below AA 4.5:1; neutral already light-on-dark).
   - Input (2c): design L102–104 label `text-muted` (3.74:1) and error `text-danger` (3.25:1) on page bg → label `text-fg-2` (8.64:1), error `bg-danger/15 text-fg-2` chip (7.18:1) (Input.tsx L19–24 comment).
   - EmptyState (2d): design L113 body `text-muted` (3.74:1) → `text-fg-2` (8.64:1) (EmptyState.tsx L15–19 comment).
   Verified: consistent across all three, documented in code comments, pinned in tests (Badge.test.tsx L37–49, Input.test.tsx L56–63, EmptyState.test.tsx L58/L63), justified by measured contrast against the real axe in chromium. UIP-7 (MUST a11y) wins; no spec broken. Per decision gate, a design deviation is WARNING; this one is spec-protective and non-blocking.

**SUGGESTION**:
1. **DD-4 implemented as separate browser config instead of `test.projects` consolidation** (vitest.browser.config.ts vs design L153). The design's planned command `npx vitest run --project storybook` does not work ("No projects matched"); the effective gate is `npm run test:a11y`. Documented in apply-progress; gate-equivalent and green — worth aligning design.md wording or config in a future infra pass.
2. **Class-map assertions in primitive unit tests are implementation-coupled** (e.g., Badge.test.tsx asserting exact token strings). Accepted repo pattern — D11 makes class maps the design contract, and jsdom cannot compute styles — so computed-style assertions would require moving all 8 to the browser project. Not actionable now; noted for the future browser-migration decision.

### Deviations (all documented in apply-progress #1205, verified in this run)
Consistent a11y class-map deviations (WARNING 2 above) + DD-4 infra implementation choice (SUGGESTION 1). No hidden or undocumented deviation found in the 8 primitives, barrel, stories, or tests.

### Verdict
APPROVE WITH WARNINGS — 12/12 spec scenarios compliant, 662/662 unit, 84/84 browser a11y, 4/4 token audit, tsc clean, storybook build clean; 2 WARNINGs (task-tracking gap for slice 2a; documented spec-protective a11y deviations), 2 SUGGESTIONs, 0 CRITICAL. Read-only verification; no code modified.
