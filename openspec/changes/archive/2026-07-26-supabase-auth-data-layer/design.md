# Design: Supabase Auth + Data Layer

## Technical Approach

Replace 100% localStorage persistence with Supabase (Docker-local) using `@supabase/ssr` three-client pattern. Seven Postgres tables with RLS scoped to `auth.uid()`. All 7 data hooks rewrite to call Supabase via a browser client, now returning `{ data, isLoading, error }` triple. One-time migration script reads localStorage on first login and upserts. Exercise images move from IndexedDB to Supabase Storage.

### Before → After

```
Before:                          After:
Page → use* Hook                 Page → AuthCheck → use* Hook
       → useLocalStorage                  → supabase.from('table').select()
       → window.localStorage              → Postgres (RLS-scoped)
       (sync, 0-lag)                      (async, loading/error states)
                                     ↑ migrate-local.ts reads localStorage
                                       once on login, then Supabase is source
```

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Auth lib | `@supabase/ssr` 3-client pattern | Plain `@supabase/supabase-js` | App Router server components need SSR-safe cookies; middleware session refresh is mandatory for production auth |
| Data hook API | Per-hook `{ data, isLoading, error }` | Generic `useSupabaseQuery` wrapper | Each hook has unique CRUD methods (append-only sessions, week-plan auto-create) — a wrapper adds indirection without shared logic |
| JSONB for intervals | JSONB columns, not normalized | Separate interval tables | Intervals/days always fetched with parent, never queried independently. ponytail: normalize when cross-entity queries needed |
| Exercises: public seed | `user_id IS NULL` = public rows | Per-user seed copy | Single set of seed exercises readable by all auth users via RLS. Simpler than N copies |
| Migration gating | `localStorage` flag per user | Server-side flag | No extra DB table, survives Supabase reset, works offline |
| Images bucket | Public bucket, no signed URLs | Private + signed URLs | MVP only — signed URLs add complexity with no current threat model |

## Data Flow

```
Component (useWorkouts etc.)
  │
  ├── mount → supabase.from('workouts').select('*').eq('user_id', auth.uid())
  │            └── returns { data, isLoading, error }
  │
  ├── create → supabase.from('workouts').insert({ ...user_id, ... })
  │            └── returns created row
  │
  ├── update → supabase.from('workouts').update(...).eq('id', id).eq('user_id', auth.uid())
  │
  └── delete → supabase.from('workouts').delete().eq('id', id).eq('user_id', auth.uid())

Auth flow:
  middleware.ts (edge) ← refreshes SSR cookie every request
      └── redirect to /login if unauthenticated + route is protected
  AuthContext (client) ← hydrates from cookie, exposes user/session/signIn/signUp/signOut
```

**Protected routes**: everything except `/login`, `/auth/callback`, `/_next/*`, `/favicon.ico`, public assets. Route list defined as a constant in `middleware.ts`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add `@supabase/ssr`, `@supabase/supabase-js` |
| `.env.local` | Create | Supabase URL + anon key |
| `supabase/migrations/20260725_create_tables.sql` | Create | 7 tables + indexes + RLS |
| `src/lib/supabase/client.ts` | Create | Browser client singleton |
| `src/lib/supabase/server.ts` | Create | Per-request server client |
| `src/lib/supabase/middleware.ts` | Create | Middleware edge client |
| `src/lib/supabase/storage.ts` | Create | Upload/list/delete in `exercise-images` bucket |
| `src/lib/supabase/migrate-local.ts` | Create | One-time localStorage → DB migration |
| `src/context/AuthContext.tsx` | Create | Auth state provider |
| `src/middleware.ts` | Create | Session refresh + route guard |
| `src/app/(auth)/login/page.tsx` | Create | Login/signup form |
| `src/app/auth/callback/route.ts` | Create | OAuth callback stub |
| `src/app/layout.tsx` | Modify | Wrap `AuthProvider` around `WorkoutProvider` |
| `src/hooks/useWorkouts.ts` | Modify | Supabase calls + loading/error |
| `src/hooks/useExercises.ts` | Modify | Supabase calls + image via Storage |
| `src/hooks/useSessions.ts` | Modify | Supabase insert |
| `src/hooks/useSequences.ts` | Modify | Supabase CRUD |
| `src/hooks/useWeekPlans.ts` | Modify | Supabase CRUD + auto-create on get |
| `src/hooks/useProgramTemplates.ts` | Modify | Supabase CRUD |
| `src/hooks/useFavorites.ts` | Modify | Supabase row-based toggle |
| `src/hooks/useIndexedDB.ts` | Modify | Delegate to Supabase Storage |

## Hook Rewrite Pattern

```typescript
// Before (localStorage, sync)
export function useWorkouts() {
  const [workouts, setWorkouts] = useLocalStorage(KEY, [])
  return { workouts, saveWorkout, deleteWorkout }
  // No loading, no error states
}

// After (Supabase, async)
export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    supabase.from('workouts').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error)
        else setWorkouts(data)
        setIsLoading(false)
      })
  }, [])

  const saveWorkout = async (workout: Workout) => { /* upsert */ }
  const deleteWorkout = async (id: string) => { /* delete */ }

  return { workouts, isLoading, error, saveWorkout, deleteWorkout }
}
```

ponytail: No generic `useSupabaseQuery` wrapper. Each hook's unique CRUD surface (append-only sessions, week-plan auto-create, favorites toggle via unique constraint) means a generic wrapper needs per-hook configs anyway. The repetition across 7 hooks is ~15 lines each — not enough to justify abstraction.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (hooks) | Supabase calls correct table/queries | `vi.mock('@supabase/ssr')`, mock chainable `from()`, assert calls |
| Unit (migration) | Flag gating, empty skip, partial failure | Mock `supabase.from().upsert()` chain, assert per-entity try/catch |
| Unit (auth) | AuthContext state transitions | Mock `supabase.auth.signInWithPassword` etc. |
| Integration | Real Supabase roundtrip | Manual against local Docker instance (automated in follow-up) |

Existing test structure (Vitest + jsdom + `renderHook` + `act`) stays identical — only mock targets change from jsdom-native localStorage to Supabase chain mocks.

## Migration / Rollout

1. Install `@supabase/ssr` + `@supabase/supabase-js`
2. Run SQL migration against local Supabase
3. Create `exercise-images` Storage bucket
4. Deploy: client factories → auth → hooks → migration script
5. Existing users: log in → migration trigger reads localStorage → upserts to Supabase → sets `workoutapp.migrated` flag
6. Rollback: `git revert`, remove deps, restore hooks from git history

## Open Questions

- None — all decisions validated in exploration + specs
