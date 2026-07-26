# Data Migration

## Description

One-time migration script (`migrate-local.ts`) that reads existing localStorage data and IndexedDB images on a user's first login and upserts them into Supabase. Gated by a `workoutapp.migrated` localStorage flag. Shows progress via a toast notification. Partial failures are tolerated — per-entity try/catch keeps migration resilient.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| DM-1 | Migration SHALL trigger automatically once on first login after auth state becomes `authenticated` | MUST |
| DM-2 | Migration SHALL read all 7 localStorage entities: workouts, exercises, sequences, sessions, week_plans, program_templates, favorites | MUST |
| DM-3 | Migration SHALL read IndexedDB images (`workoutapp-images` database) and upload each to Supabase Storage | MUST |
| DM-4 | Each entity SHALL be upserted into its corresponding Supabase table with the authenticated user's `user_id` | MUST |
| DM-5 | Migration SHALL set `localStorage.setItem('workoutapp.migrated', 'true')` on completion to prevent re-run | MUST |
| DM-6 | User SHALL see a "Migrating your data..." toast notification during migration | SHOULD |
| DM-7 | Migration failure SHALL NOT block app usage — errors are logged, user can proceed with an empty slate | MUST |
| DM-8 | Empty localStorage SHALL be handled gracefully — skip migration with no error or toast | MUST |
| DM-9 | Migration SHALL use per-entity try/catch — one entity failure does not prevent others from migrating | MUST |

## Scenarios

### Scenario: Existing user migrates on first login
- GIVEN user has 10 workouts, 5 sequences, 20 exercises in localStorage
- WHEN user logs in for the first time
- THEN all entities are read and upserted to Supabase
- AND `workoutapp.migrated` is set to `true`
- AND a "Migrating your data..." toast appears
- AND Supabase hooks now return the migrated data

### Scenario: New user with empty localStorage
- GIVEN localStorage has no workoutapp keys (or only seed exercises)
- WHEN user logs in for the first time
- THEN migration detects no user data and skips
- AND `workoutapp.migrated` is set to `true`
- AND no migration toast is shown

### Scenario: Partial migration failure
- GIVEN workouts migrate successfully but IndexedDB read throws
- WHEN the migration script runs
- THEN workouts are persisted to Supabase
- AND the IndexedDB error is `console.warn`'d
- AND `workoutapp.migrated` is NOT set (script will retry on next login)
- AND the user can use the app with partially migrated data

### Scenario: Re-login after successful migration
- GIVEN `workoutapp.migrated` is `true`
- WHEN user logs out and logs in again
- THEN migration script checks the flag and skips execution
- AND existing Supabase data is used directly

## Dependencies

- `user-auth` — migration triggers after auth state is confirmed
- `supabase-data-layer` — Supabase tables are the migration target
- `supabase-storage` — IndexedDB images upload to Storage bucket
- `local-persistence` — localStorage and IndexedDB are the migration source

## Out of Scope

- Conflict resolution (last-write-wins upsert only)
- Data transformation or schema upgrade
- Migration rollback or undo
- Cross-device migration coordination
- Re-migration after data loss
