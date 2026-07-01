# Tasks: Phase 3 — Architecture Hardening

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 110–160 (core) — CA-2 adds 150–250+ |
| 400-line budget risk | Low (core) — High (with CA-2) |
| Chained PRs recommended | Yes (only if CA-2 is opted in) |
| Suggested split | PR 1 (core) → PR 2 (optional CA-2 if chosen) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes (conditional on CA-2)
Chain strategy: pending
400-line budget risk: Low (core) / High (core + CA-2)

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Core hardening — TS flags, ErrorBoundary, CSS tokens, localStorage | PR 1 | Base: main. ~110–160 lines. |
| 2 | Optional spacing rename — `--spacing-{sm,md,lg,xl}` → `--spacing-{8,16,24,32}` | PR 2 | Base: main (independent). ~150–250+ lines. Only if user approves. |

**Decision needed before apply**: Yes — the user must confirm whether CA-2 (spacing rename) is in scope. If yes, use chained PRs (PR 1 core → PR 2 rename). If no, single PR is fine (~120 lines).

> **⚠️ Design doc missing**: `openspec/changes/phase-3-architecture-hardening/design.md` was not found. Tasks derived directly from spec. Risk: Low — spec is detailed enough for all tasks.

---

## Phase 1: TypeScript Hardening

- [x] 1.1 `tsconfig.json` — Add `noUnusedLocals: true`, `noUnusedParameters: true`, `noUncheckedIndexedAccess: true` to `compilerOptions`
- [x] 1.2 Run `tsc --noEmit`, fix all compilation errors across affected files (params prefixed with `_`, add `undefined` checks for indexed access, delete unused locals)

## Phase 2: Error Boundary

- [x] 2.1 Create `src/components/ErrorBoundary.tsx` — class component with `componentDidCatch`, fallback UI with error message, `console.error` logging; `'use client'` directive
- [x] 2.2 `src/app/layout.tsx` — Wrap `{children}` in `<ErrorBoundary>` before `<WorkoutProvider>`

## Phase 3: CSS Token Cleanup (CA-1)

- [x] 3.1 `src/app/globals.css` — Replace body `background-color: #f8f9ff` → `var(--color-background)` and `color: #0b1c30` → `var(--color-on-background)`
- [x] 3.2 `src/app/globals.css` — Deduplicate `--font-*` compound definitions: keep lines 67–72 (`--font-headline`, `--font-body`, `--font-label`, `--font-mono`, `--font-timer`, `--font-data`), remove lines 127–135 (`--font-headline-md`, `--font-body-md`, etc.)
- [x] 3.3 `src/app/globals.css` — Replace `.glass-card` hardcoded values: `background: rgba(255,255,255,0.8)` → `background: var(--color-surface)`, `border: 1px solid #e2e8f0` → `border: 1px solid var(--color-outline-variant)`

## Phase 4: LocalStorage Safety (LP-8)

- [x] 4.1 `src/hooks/useLocalStorage.ts` — Replace `useState<T>(initialValue)` with lazy callback `useState<T>(() => { ... })` that reads from `window.localStorage.getItem(key)` inside try/catch
- [x] 4.2 `src/hooks/useLocalStorage.ts` — Remove the `useEffect` post-hydration read (no longer needed — lazy init covers it)
- [x] 4.3 `src/hooks/useLocalStorage.ts` — In `setValue` catch block, add `console.warn('Storage quota exceeded for key:', key)` before the silent fallback

## Phase 5: Optional — Spacing Rename (CA-2) — Conditional

> **Decision gate**: Only do this phase if user explicitly approves. CA-2 is SHOULD/MAY per spec.

- [x] 5.1 `src/app/globals.css` — Rename `--spacing-sm: 8px` → `--spacing-8: 8px`, `--spacing-md: 16px` → `--spacing-16`, `--spacing-lg: 24px` → `--spacing-24`, `--spacing-xl: 32px` → `--spacing-32` (keep `--spacing-xs` and `--spacing-margin-*` as-is)
- [x] 5.2 `src/app/globals.css` — Remove `!important` from all `@utility max-w-*` definitions (the rename fixes the shadowing; Tailwind utilities now work natively)
- [x] 5.3 Update all `*.tsx` files using renamed spacing utilities: replace `p-sm` → `p-8`, `p-md` → `p-16`, `p-lg` → `p-24`, `p-xl` → `p-32`, `gap-sm` → `gap-8`, `gap-md` → `gap-16`, `gap-lg` → `gap-24`, `gap-xl` → `gap-32`, `py-sm` → `py-8`, `py-md` → `py-16`, `py-lg` → `py-24`, `px-sm` → `px-8`, `px-md` → `px-16`, `px-lg` → `px-24`, `mt-xs` stays, `mb-sm` → `mb-8`, `mb-md` → `mb-16`, `mb-lg` → `mb-24`, `pb-sm` → `pb-8`, `pb-xs` stays, `pt-sm` → `pt-8`, `mr-md` → `mr-16`, `pl-sm` → `pl-8`, `pr-md` → `pr-16`
