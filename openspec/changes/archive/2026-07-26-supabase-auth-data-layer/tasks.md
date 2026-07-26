# Tasks: Supabase Auth + Data Layer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1750 |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + client factories + deps | PR 1 | Base for all other PRs |
| 2 | Auth context + middleware + login | PR 2 | Depends on PR 1 client factories |
| 3 | Data hooks batch 1 (workouts, sessions, exercises) | PR 3 | Depends on PR 2 auth |
| 4 | Data hooks batch 2 (sequences, week_plans, templates, favorites) | PR 4 | Depends on PR 2 auth |
| 5 | Storage + migration | PR 5 | Depends on PR 2 + PR 3 (exercises) |

---

## PR 1: Schema + Client Factories + Package.json (~350 lines)

Chain base: `main` (first PR)

- [x] 1.1 Install `@supabase/ssr` in package.json — `npm install @supabase/ssr`
- [x] 1.2 Create `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] 1.3 Create `supabase/migrations/20260725_create_tables.sql` — 7 tables, indexes, RLS policies, seed public exercises
- [x] 1.4 Create `src/lib/supabase/client.ts` — browser singleton via `createBrowserClient`
- [x] 1.5 Create `src/lib/supabase/server.ts` — per-request server client via `createServerClient`
- [x] 1.6 Create `src/lib/supabase/middleware.ts` — edge client factory for middleware.ts
- [x] 1.7 Create `src/lib/supabase/__tests__/client-factories.test.ts` — mock `@supabase/ssr`, verify 3 factories init correctly
- [x] 1.8 Create `supabase/seed.sql` — 20 public exercises with `user_id IS NULL` for RLS reading
- [x] 1.9 Verify `npm test` passes, migration runs against local Supabase

**Files**: package.json, `.env.local`, `supabase/migrations/*.sql`, `supabase/seed.sql`, `src/lib/supabase/{client,server,middleware}.ts`, `src/lib/supabase/__tests__/client-factories.test.ts`
**Deps**: None
**AC**: All 3 factories create valid clients; SQL creates 7 tables with RLS + seed data; `pnpm build` passes; `pnpm test` passes.

---

## PR 2: Auth — Context + Middleware + Login Page (~380 lines)

Chain base: `main` (after PR 1 merges)

- [x] 2.1 Create `src/context/AuthContext.tsx` — exposes `{ user, session, loading, signIn, signUp, signOut }`, hydrates from SSR cookie, migration gate stub
- [x] 2.2 Create `src/middleware.ts` — `createServerClient` for cookie refresh, redirect `/login?redirect=` for protected routes (public: `/login`, `/auth/callback`, `/_next/*`, `/favicon.ico`)
- [x] 2.3 Create `src/app/(auth)/login/page.tsx` — email+password form, signIn/signUp toggle, client-side validation, Supabase error display
- [x] 2.4 Create `src/app/auth/callback/route.ts` — exchange auth code for session via `createServerClient`
- [x] 2.5 Modify `src/app/layout.tsx` — wrap `<AuthProvider>` outside `<WorkoutProvider>`
- [x] 2.6 Create `src/context/__tests__/AuthContext.test.tsx` — mock `supabase.auth.*` methods, assert state transitions per spec UA-1–UA-10
- [ ] 2.7 Manual: verify sign up → protected route → logout → redirect flow end-to-end

**Files**: `AuthContext.tsx`, `middleware.ts`, `app/(auth)/login/page.tsx`, `app/auth/callback/route.ts`, `layout.tsx`, `__tests__/AuthContext.test.ts`
**Deps**: PR 1 (client factories)
**AC**: User can sign up/log in/log out; middleware redirects unauthenticated to `/login`; `AuthContext` hydrates without auth flash; tests cover all UA scenarios.

---

## PR 3: Data Layer — Batch 1: Workouts, Sessions, Exercises (~370 lines)

Chain base: `main` (after PR 2 merges)

- [x] 3.1 Rewrite `src/hooks/useWorkouts.ts` — `supabase.from('workouts')` select/insert/update/delete with `{ data, isLoading, error }` return
- [x] 3.2 Rewrite `src/hooks/useSessions.ts` — `supabase.from('sessions')` append-only insert with loading/error
- [x] 3.3 Rewrite `src/hooks/useExercises.ts` — `supabase.from('exercises')` select (public + user rows), CRUD, image ops via storage.ts stub
- [x] 3.4 Create `src/hooks/__tests__/useWorkouts.test.ts` — mock `supabase.from('workouts')` chain, assert CRUD calls and state transitions
- [x] 3.5 Create `src/hooks/__tests__/useSessions.test.ts` — mock append-only insert, verify no update/delete exposed
- [x] 3.6 Create `src/hooks/__tests__/useExercises.test.ts` — mock select with RLS filter for public + own rows, assert image op stubs

**Files**: `useWorkouts.ts`, `useSessions.ts`, `useExercises.ts`, `__tests__/useWorkouts.test.ts`, `__tests__/useSessions.test.ts`, `__tests__/useExercises.test.ts`
**Deps**: PR 2 (auth for `user_id`), PR 1 (client factories)
**AC**: All 3 hooks return `{ data, isLoading, error }`; CRUD targets correct Supabase tables; network errors surface as error state; tests pass.

---

## PR 4: Data Layer — Batch 2: Sequences, Week Plans, Templates, Favorites (~360 lines)

Chain base: `main` (after PR 3 merges)

- [x] 4.1 Rewrite `src/hooks/useSequences.ts` — `supabase.from('sequences')` select/insert/update/delete with `{ data, isLoading, error }`
- [x] 4.2 Rewrite `src/hooks/useWeekPlans.ts` — `supabase.from('week_plans')` CRUD, auto-create plan on miss by week ID
- [x] 4.3 Rewrite `src/hooks/useProgramTemplates.ts` — `supabase.from('program_templates')` select/insert/update/delete
- [x] 4.4 Rewrite `src/hooks/useFavorites.ts` — `supabase.from('favorites')` row-based toggle via `unique(user_id, exercise_id)` constraint
- [x] 4.5 Rewrite `src/hooks/__tests__/useFavorites.test.ts` — swap localStorage mock for Supabase mock chain assertions
- [x] 4.6 Create `src/hooks/__tests__/useSequences.test.ts` — mock chain, verify CRUD calls
- [x] 4.7 Create `src/hooks/__tests__/useWeekPlans.test.ts` — mock chain, verify auto-create + CRUD
- [x] 4.8 Create `src/hooks/__tests__/useProgramTemplates.test.ts` — mock chain, verify CRUD

**Files**: `useSequences.ts`, `useWeekPlans.ts`, `useProgramTemplates.ts`, `useFavorites.ts`, `__tests__/useFavorites.test.ts`, `__tests__/useSequences.test.ts`, `__tests__/useWeekPlans.test.ts`, `__tests__/useProgramTemplates.test.ts`
**Deps**: PR 2 (auth), PR 3 (same pattern)
**AC**: All 4 hooks call correct Supabase tables; week_plans auto-create on miss; favorites toggle via upsert; all tests pass.

---

## PR 5: Storage + Migration (~380 lines)

Chain base: `main` (after PR 3/4 merge — needs exercises table + auth)

- [x] 5.1 Create `src/lib/supabase/storage.ts` — `uploadImage(exerciseId, file)` with file type (`image/*`) and size cap (10 MB), `listImages(exerciseId)`, `deleteImage(path)`, public bucket `exercise-images`
- [x] 5.2 Rewrite `src/hooks/useIndexedDB.ts` — delegate get/save/delete to Supabase Storage, keep IndexedDB as offline fallback
- [x] 5.3 Create `src/lib/supabase/migrate-local.ts` — read 7 localStorage entities + IndexedDB images, upsert each entity with per-entity try/catch, set `workoutapp.migrated` flag
- [x] 5.4 Wire migration trigger in `AuthContext.tsx` — after `signIn`, check `workoutapp.migrated`, call `migrateLocal()` on first auth
- [x] 5.5 Create `src/lib/supabase/__tests__/storage.test.ts` — mock `supabase.storage.from()` chain, assert upload/list/delete with validation
- [x] 5.6 Create `src/lib/supabase/__tests__/migrate-local.test.ts` — mock localStorage keys + Supabase upsert, assert flag gating, empty-skip, and per-entity failure handling

**Files**: `supabase/storage.ts`, `useIndexedDB.ts`, `migrate-local.ts`, `AuthContext.tsx` (migration gate), `__tests__/storage.test.ts`, `__tests__/migrate-local.test.ts`
**Deps**: PR 2 (auth), PR 3 (exercises table for Storage URLs)
**AC**: Storage upload/list/delete with validation; migration reads localStorage + IndexedDB and upserts; `workoutapp.migrated` flag prevents re-run; partial failure tolerated; tests pass.
