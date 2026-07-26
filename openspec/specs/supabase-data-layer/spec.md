# Supabase Data Layer

## Description

Postgres schema for 7 workout entities with Row-Level Security (RLS) scoped to `auth.uid()`. Three Supabase client factories (browser singleton / server per-request / middleware) created via `@supabase/ssr`. All 7 existing data hooks rewrite to call Supabase instead of localStorage, now exposing async loading and error states.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| SDL-1 | Three client factories SHALL exist: `createBrowserClient` (singleton), `createServerClient` (per-request), `createMiddlewareClient` | MUST |
| SDL-2 | 7 tables SHALL be created via idempotent SQL migration: workouts, exercises, sequences, sessions, week_plans, program_templates, favorites | MUST |
| SDL-3 | All 7 tables SHALL have RLS enabled with policies scoping all operations to `(select auth.uid()) = user_id` | MUST |
| SDL-4 | Public seed exercises SHALL have `user_id IS NULL` and be readable by all authenticated users | MUST |
| SDL-5 | All 7 hooks SHALL call Supabase via the browser client, not localStorage | MUST |
| SDL-6 | Each hook SHALL expose `{ data, isLoading, error }` state alongside CRUD methods | MUST |
| SDL-7 | Hooks SHALL catch network errors and return an error state — never throw uncaught | MUST |
| SDL-8 | The SQL migration SHALL be idempotent (`IF NOT EXISTS` on tables, `CREATE OR REPLACE` on policies) | MUST |
| SDL-9 | Nested data (intervals, days) SHALL be stored as JSONB columns, not normalized | SHOULD |

## Scenarios

### Scenario: Workouts load from Supabase after login
- GIVEN user is authenticated with `user_id = X`
- WHEN `useWorkouts()` mounts
- THEN it calls `supabase.from('workouts').select('*').eq('user_id', X)`
- AND returns the user's workouts in `data`

### Scenario: Supabase unreachable
- GIVEN the Supabase API is unreachable
- WHEN any data hook mounts or makes a request
- THEN `isLoading` transitions to `false`, `error` contains the network error
- AND the UI renders an error state without crashing

### Scenario: RLS policy denies cross-user access
- GIVEN user A is authenticated
- WHEN user A queries user B's workouts directly
- THEN Supabase returns an empty result set (RLS silently filters non-owned rows)

### Scenario: Create and immediately read
- GIVEN an authenticated user
- WHEN user creates a new workout via `createWorkout`
- THEN the inserted row contains `user_id = auth.uid()`
- AND the new workout appears in subsequent `useWorkouts` queries

### Scenario: Public seed exercises visible to all
- GIVEN exercises with `user_id IS NULL` exist in the DB
- WHEN any authenticated user calls `useExercises()`
- THEN both public seed exercises and the user's own exercises are returned

## Dependencies

- `user-auth` — authentication is required for RLS policies to resolve `auth.uid()`
- Supabase project (local Docker instance, ports 54321/54322/54323)

## Out of Scope

- Real-time subscriptions (Supabase Realtime — future)
- Offline cache / read-through layer (deferred to later phase)
- Admin CRUD or user management
- Audit logging
- Cross-table JOIN queries
