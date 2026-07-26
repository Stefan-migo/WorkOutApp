# Proposal: Supabase Auth + Data Layer

## Intent

Add multi-user support with cloud persistence by migrating from 100% localStorage to Supabase (Docker-local). Enables user accounts, cross-device data sync, and Supabase Auth for future features.

## Scope

### In Scope
1. Auth system: email+password signup/login, session management via AuthContext + middleware
2. Supabase client factories: browser, server, middleware (`@supabase/ssr`)
3. Database schema: 7 tables with RLS policies + SQL migration
4. Hook rewrites: all 7 data hooks call Supabase instead of localStorage
5. Storage migration: exercise images from IndexedDB → Supabase Storage
6. Data migration: one-time localStorage → Supabase on first login
7. Login page + auth callback route

### Out of Scope
1. Offline cache layer (deferred to Phase 3.2)
2. Social auth providers (Google, GitHub — future)
3. Admin panel or user management UI
4. Multi-device conflict resolution
5. Real-time subscriptions (Realtime — future)

## Capabilities

> Contract between proposal and specs phases. Each new capability becomes `openspec/specs/<name>/spec.md`.

### New Capabilities
- **user-auth**: AuthContext with user/session/signIn/signUp/signOut, middleware.ts route protection, email+password only.
- **supabase-data-layer**: Browser/server/middleware client factories, 7-table schema with RLS, hook rewrites for all CRUD operations.
- **supabase-storage**: Image storage in Supabase Storage bucket `exercise-images`, replaces IndexedDB.
- **data-migration**: One-time localStorage → Supabase upsert on first login, migration flag, toast feedback.

### Modified Capabilities
- **local-persistence**: Changes from primary data store to migration source (read once, then stale). Requirements shift from "persist all data" to "read for migration, fallback on Supabase failure."

## Approach

Option A — `@supabase/ssr` with three client factories (browser/server/middleware). `AuthContext` wraps the app + server components via middleware cookie refresh. Hooks rewrite to call Supabase via browser client. 7-table Postgres schema with user_id + RLS. Migration script reads localStorage on first login and upserts.

## Affected Areas

| Area | Impact | Changes |
|------|--------|---------|
| `package.json` | New deps | Add `@supabase/ssr`, `@supabase/supabase-js` |
| `middleware.ts` | New | Session refresh + route protection |
| `src/lib/supabase/` | New dir | client.ts, server.ts, middleware.ts, migrate-local.ts |
| `src/context/AuthContext.tsx` | New | Auth provider wrapping layout |
| `src/hooks/use*.ts` | Rewrite | 7 hooks → Supabase calls |
| `src/hooks/useIndexedDB.ts` | Replace | → Supabase Storage |
| `src/app/login/page.tsx` | New | Login/signup page |
| `src/app/auth/callback/route.ts` | New | OAuth callback |
| `src/app/layout.tsx` | Modify | Add AuthProvider wrapper |
| `supabase/migrations/` | New | SQL: schema + RLS + seed |
| `openspec/specs/local-persistence/spec.md` | Delta | Requirements change to migration source |
| `.env.local` | New | Supabase URL + anon key |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Next.js 16 + `@supabase/ssr` peer dep incompatibility | Medium | Verify before install; fallback to Option B if blocked |
| Async loading states (hooks become async) | High | Add Suspense boundaries, loading skeletons in all consumers |
| Test isolation (mocked Supabase ≠ real DB) | Medium | Unit tests mock chain calls; add integration tests against local Supabase in follow-up |
| Session timing (cookie refresh race) | Low | Supabase SSR middleware handles this; test across page navigations |
| Storage cost (images) | Low | 1GB free tier adequate for MVP; monitor usage |

## Rollback Plan

1. `git revert` all changes in this change
2. Uninstall `@supabase/ssr`, `@supabase/supabase-js`
3. Delete `supabase/migrations/` files (DB state remains but unused)
4. Restore all 7 hooks from git history
5. Verify app compiles and runs on localStorage-only mode

## Success Criteria

- [ ] User can sign up and log in with email+password
- [ ] Protected routes redirect to `/login` when unauthenticated
- [ ] All 7 data entities persist to Supabase and load correctly after login
- [ ] Existing localStorage data migrates to Supabase on first login
- [ ] Exercise images upload and serve from Supabase Storage
- [ ] All existing unit tests pass (updated mock assertions)
- [ ] `pnpm build` succeeds with 0 errors
