'use client'

import { useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

// AuthCard: single centered card with an internal view machine
// (signIn | signUp | forgot | checkEmail). Strictly presentational — props
// in, callbacks out, no Supabase, no router, no page logic. The page wires
// onSignIn/onSignUp/onForgot to the auth provider and controls `loading`
// plus the global `error` banner.
type AuthView = 'signIn' | 'signUp' | 'forgot' | 'checkEmail'

interface AuthCardProps {
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (email: string, password: string) => Promise<{ error: string | null; requiresConfirmation?: boolean }>
  onForgot: (email: string) => Promise<{ error: string | null }>
  loading?: boolean
  /** Global banner error (auth-level: invalid credentials, email taken…) */
  error?: string | null
}

// Field-level errors are validated locally (UIP-4 pattern: Input error chip
// + aria-invalid + aria-describedby).
interface FieldErrors {
  email?: string
  password?: string
  confirm?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthCard({ onSignIn, onSignUp, onForgot, loading = false, error = null }: AuthCardProps) {
  const [view, setView] = useState<AuthView>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const resetFields = () => {
    setEmail('')
    setPassword('')
    setConfirm('')
    setShowPassword(false)
    setFieldErrors({})
  }

  const goTo = (next: AuthView) => {
    resetFields()
    setView(next)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errors: FieldErrors = {}
    if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address'
    if (view !== 'forgot') {
      if (password.length < 6) errors.password = 'Password must be at least 6 characters'
      if (view === 'signUp' && confirm !== password) errors.confirm = 'Passwords do not match'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (view === 'signIn') {
      await onSignIn(email, password)
    } else if (view === 'signUp') {
      const result = await onSignUp(email, password)
      // With email confirmation enabled the provider returns no session;
      // stay on the card and point the user at their inbox.
      if (result?.requiresConfirmation) goTo('checkEmail')
    } else if (view === 'forgot') {
      await onForgot(email)
      goTo('checkEmail')
    }
  }

  const heading = view === 'signIn' ? 'Sign In' : view === 'signUp' ? 'Create Account' : 'Reset Password'
  const subheading =
    view === 'signIn'
      ? 'Welcome back'
      : view === 'signUp'
        ? 'Start tracking your workouts'
        : 'We will email you a reset link'

  return (
    <div className="flex min-h-dvh items-center justify-center px-margin-mobile md:px-margin-desktop">
      <Card variant="raised" className="w-full max-w-sm p-24">
        {/* Brand */}
        <div className="mb-32 text-center">
          <h1 className="font-headline text-headline-md font-bold text-fg-2 tracking-tight">WorkOutApp</h1>
          <p className="mt-1 font-mono text-data-sm text-muted">Every rep counts</p>
        </div>

        {error && (
          <div role="alert" className="mb-24 rounded-md bg-danger/15 p-16 text-body-md text-fg-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-24">
          {view === 'checkEmail' ? (
            <div className="space-y-16 text-center">
              <p className="font-body text-body-md text-fg-2">
                Check your email for a link to continue. No email?{' '}
                <button
                  type="button"
                  onClick={() => goTo('forgot')}
                  className="font-semibold text-accent underline"
                >
                  Try again
                </button>
              </p>
              <Button variant="ghost" size="sm" className="mx-auto" onClick={() => goTo('signIn')}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="font-headline text-headline-md font-bold text-fg-2">{heading}</h2>
                <p className="mt-8 font-body text-body-md text-muted">{subheading}</p>
              </div>

              <div className="space-y-16">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
                {view !== 'forgot' && (
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={view === 'signUp' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={fieldErrors.password}
                  />
                )}
                {view === 'signUp' && (
                  <Input
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    error={fieldErrors.confirm}
                  />
                )}
                {view === 'signIn' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => goTo('forgot')}
                      className="font-label text-label-caps font-bold text-accent underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {view !== 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="font-label text-label-caps text-muted hover:text-fg-2"
                  >
                    {showPassword ? 'Hide password' : 'Show password'}
                  </button>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? 'Please wait…'
                  : view === 'signIn'
                    ? 'Sign In'
                    : view === 'signUp'
                      ? 'Create Account'
                      : 'Send Reset Link'}
              </Button>

              <p className="text-center font-body text-body-md text-muted">
                {view === 'signUp' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => goTo(view === 'signUp' ? 'signIn' : 'signUp')}
                  className="font-semibold text-accent underline"
                >
                  {view === 'signUp' ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}
