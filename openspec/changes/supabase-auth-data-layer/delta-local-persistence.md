# Delta for Local Persistence

## Description

This delta documents how the `local-persistence` spec changes when Supabase becomes the primary data store. localStorage is demoted from primary persistence to a one-time migration source and stale offline fallback.

## MODIFIED Requirements

All 7 data hooks (useWorkouts, useExercises, useSessions, useSequences, useWeekPlans, useProgramTemplates, useFavorites) SHALL read from and write to Supabase via the browser client. localStorage SHALL serve only as a one-time migration source (read during `migrate-local.ts`) and a stale offline fallback for read operations when Supabase is unreachable.
(Previously: all 7 hooks read/wrote localStorage as the primary data store.)

### Scenario: Hooks read from Supabase, not localStorage
- GIVEN user is authenticated with data in Supabase
- WHEN a `use*` hook mounts
- THEN it queries Supabase via the browser client
- AND returns the user's data in `{ data, isLoading, error }` format

### Scenario: localStorage used during migration only
- GIVEN user has existing localStorage data from before the change
- WHEN the migration script runs on first login (see data-migration spec)
- THEN each localStorage key is read with SSR-safe try/catch
- AND upserted to the corresponding Supabase table

### Scenario: Offline fallback from stale localStorage
- GIVEN Supabase is unreachable (network error)
- WHEN a hook query fails
- THEN the hook MAY fall back to reading stale localStorage data
- AND SHOULD indicate "offline" or "cached" state to the user

### Scenario: localStorage is no longer written to by hooks
- GIVEN user saves a new workout via `createWorkout`
- WHEN the save completes
- THEN the data exists in Supabase only
- AND localStorage is NOT updated (except during migration)

## REMOVED Requirements

### LP-14 — Seed data injection on first load
(Reason: Seed data moves to an idempotent SQL migration that inserts public rows with `user_id = NULL`. The `useExercises` hook no longer manages seed injection.)
(Migration: `supabase/seed.sql` inserts ~20 common exercises; RLS policy allows all authenticated users to read `user_id IS NULL` rows.)

### LP-15 — Seed-only-on-empty-array guard
(Reason: Same as LP-14 — the seed-on-empty logic is replaced by the SQL migration seed. The hook no longer checks whether the store is empty.)
(Migration: No code migration needed; the SQL seed runs once as part of schema setup.)
