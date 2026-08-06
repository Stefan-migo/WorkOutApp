'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fn = isSignUp ? signUp : signIn
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      router.push(redirectTo)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-headline-md font-bold text-primary">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-body-md text-muted">
            {isSignUp ? 'Start tracking your workouts' : 'Welcome back'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-error-container p-4 text-sm text-on-error-container">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-outline-variant bg-surface p-3 text-body-md text-fg-2 placeholder:text-muted focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-md border border-outline-variant bg-surface p-3 text-body-md text-fg-2 placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-6 py-3 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-muted">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
            className="font-semibold text-primary underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  )
}
