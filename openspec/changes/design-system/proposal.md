# Proposal: Design System for WorkOutApp

## Intent

App is functional but visually inconsistent: 30+ inline button instances, 3 coexisting modal patterns, hardcoded dark-palette utilities on play screens, and `SEGMENT_COLORS` TS hexes drifting from `@theme` tokens. Goal: a Storybook-first, token-driven design system built component by component, ordered by reuse — consistent identity, faster page work, accessible defaults, and living documentation.

## Scope

### In Scope
- Foundations: token gap fixes (segment drift, dark-screen hardcodes), tokens/typography/colors docs, `@storybook/addon-a11y`
- 7-8 `ui/` primitives with stories: Button (variants), IconButton, Card/Surface, Badge, Input, EmptyState, Dialog/Sheet
- First migration pass: highest-repetition pages (play dark screens, simplest list pages)
- Play functions + a11y checks on new stories, run in Vitest via SB10 `storybookTest`

### Out of Scope
- shadcn/ui wholesale, Radix dependencies
- Chromatic / visual regression testing
- Dark-mode toggle UI (dark mode stays OS-driven)
- Figma / open-design bridge
- Remaining 12 primitives + full 16-page migration (future phases)

## Capabilities

### New Capabilities
- `design-system-foundation`: tokens as single source of truth, token gaps fixed, Storybook config + docs pages
- `ui-primitives`: shared primitives with stories, variants, and a11y
- `page-migration`: first pages converted to primitives, segment drift removed

### Modified Capabilities
- None — pure refactor, no behavior-level spec changes

## Approach

Brownfield, incremental, reuse-ordered: (1) fix token gaps (canonical segment palette + update `SEGMENT_COLORS`, `TimerRing` + tests; migrate dark screens to tokens) → (2) foundations stories/docs → (3) build `ui/` primitives on tokens, highest reuse first (Button → IconButton → Card → Badge → Input → EmptyState → Dialog/Sheet) → (4) migrate pages by repetition → (5) play functions + a11y → (6) CI via Vitest.

## Scenarios

- Dev builds a new page using only `ui/` primitives + tokens, no inline styles.
- Timer dark screens keep identical look after migration (no visual drift).
- Screen-reader user can open/close every dialog via keyboard; `prefers-reduced-motion` respected.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modified | token additions/fixes |
| `src/lib/segment-styles.ts` | Modified | `SEGMENT_COLORS` → tokens |
| `src/components/ui/*` | New | primitives + stories |
| `src/components/*.tsx` | Modified | migrate to primitives (first pass) |
| `.storybook/main.ts`, `preview.tsx` | Modified | a11y addon, docs config |

## Assumptions (pending user confirmation)

- **Segment colors**: `@theme` tokens canonical (blue/green/red/violet); `SEGMENT_COLORS` + tests updated. Alt: keep amber/lime/coral/indigo, move them into `@theme`.
- **Modal standard**: native `<dialog>` as semantic base with unified styles + sheet variant. No Radix.
- **Button API**: one primitive, `variant` prop (primary/ghost/outline/danger + pill/FAB).
- **First slice** = foundation + 7-8 primitives; remaining primitives in later changes.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep across 16 pages | High | Fixed first slice; chained PRs |
| Feature components coupled to hooks/state | Med | Migrate presentational parts only |
| Modal a11y (focus trap, ESC) | Med | a11y addon + play functions on Dialog stories |
| Spanish strings in `RepCompleteDialog` | Low | Fix to English during dark-screen migration |
| Token migration visual drift | Med | Per-page verify + story screenshots |

## Rollback Plan

Slices are independently revertible: primitives added additively (delete folder); page migration reverts per-file; segment swap reverts in one commit (single source of truth restored).

## Dependencies

- Storybook 10.5.5 (installed), `@storybook/addon-a11y` (new, dev-only). No runtime deps.

## Estimated Size

Primitives + migration ≈ 800–1100 changed lines → **exceeds 400-line budget** → 3 chained stacked-to-main PRs: (1) foundation + token fixes, (2) ui/ primitives + stories, (3) page migration.

## Success Criteria

- [ ] 7-8 primitives shipped with stories; play functions + a11y checks green
- [ ] `SEGMENT_COLORS` drift eliminated; play screens use tokens only
- [ ] 3-5 pages migrated; foundations docs live in Storybook
- [ ] Each chained PR stays within 400-line review budget

## Proposal question round

1. Segment palette: adopt `@theme` tokens or keep current hexes (moved into `@theme`)?
2. Modal standard: native `<dialog>` base or sheet-first?
3. First slice OK: foundation + 7-8 primitives?
4. Migration targets: play dark screens + which 2-3 list pages?
