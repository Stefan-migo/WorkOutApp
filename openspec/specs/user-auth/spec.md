# User Auth

## Description

Email+password authentication via Supabase Auth. An `AuthContext` provider wraps the app layout, exposing user/session state and `signIn`/`signUp`/`signOut` methods. A `middleware.ts` file refreshes the Supabase SSR session cookie on every request and redirects unauthenticated users to `/login` for protected routes.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| UA-1 | User SHALL register with email+password via `supabase.auth.signUp()` | MUST |
| UA-2 | User SHALL log in with email+password via `supabase.auth.signInWithPassword()` | MUST |
| UA-3 | User SHALL log out via `AuthContext.signOut()`, clearing the SSR session cookie | MUST |
| UA-4 | `AuthContext` SHALL expose `{ user, session, loading, signIn, signUp, signOut }` | MUST |
| UA-5 | `middleware.ts` SHALL call `createServerClient` to refresh the session cookie on every request | MUST |
| UA-6 | Unauthenticated requests to protected routes SHALL redirect to `/login?redirect=<path>` | MUST |
| UA-7 | Login page at `/login` SHALL render email + password form with client-side validation | MUST |
| UA-8 | `/auth/callback` route SHALL handle the session exchange for auth redirect flows | MUST |
| UA-9 | `AuthContext` SHALL hydrate from the SSR session cookie on first render (no auth flash) | MUST |
| UA-10 | `signUp` with an already-registered email SHALL surface the Supabase error to the user | MUST |

## Scenarios

### Scenario: Sign up and access protected route
- GIVEN user is on `/login` with no existing session
- WHEN user fills email + password and submits signUp
- THEN `AuthContext.user` is set to the new Supabase user
- AND user is redirected to the protected home page

### Scenario: Login with wrong credentials
- GIVEN user has an existing account
- WHEN user enters wrong password
- THEN the UI shows "Invalid login credentials" error
- AND user remains on `/login`

### Scenario: Unauthenticated redirect
- GIVEN no valid session cookie
- WHEN user navigates to `/workouts`
- THEN `middleware.ts` redirects to `/login?redirect=/workouts`

### Scenario: Session survives page reload
- GIVEN user is logged in
- WHEN the page is refreshed
- THEN `AuthContext` initializes from the cookie
- AND no auth flash occurs (loading state until session resolves)

### Scenario: Logout clears session
- GIVEN user is logged in
- WHEN user calls `signOut`
- THEN the SSR cookie is cleared
- AND `AuthContext.user` is null
- AND middleware redirects subsequent requests to `/login`

### Scenario: Duplicate email signup
- GIVEN an email is already registered
- WHEN signUp is attempted with the same email
- THEN Supabase returns `422: User already registered`
- AND the error is displayed in the form

## Dependencies

- `@supabase/ssr` for cookie-based SSR session management
- `@supabase/supabase-js` base client

## Out of Scope

- Social auth providers (Google, GitHub — future)
- Password reset flow
- Email verification / confirmation emails
- Admin user management UI
- MFA or TOTP
- Session idle timeout
