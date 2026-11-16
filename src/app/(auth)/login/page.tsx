'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthCard } from '@/components/blocks/AuthCard'

// ponytail: useSearchParams needs a Suspense boundary for static prerender (Next 16)
export default function LoginPage() {
  return (
    <Suspense fallback={<p role="status" className="p-24 text-center text-muted">Loading sign in…</p>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signUp, resetPassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const run = async <T extends { error: string | null },>(fn: () => Promise<T>) => {
    setError(null)
    setLoading(true)
    try {
      const result = await fn()
      if (result.error) setError(result.error)
      return result
    } catch {
      const error = 'Something went wrong. Please try again.'
      setError(error)
      return { error, requiresConfirmation: false }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      onSignIn={async (email, password) => {
        const result = await run(() => signIn(email, password))
        if (!result.error) router.push(redirectTo)
        return result
      }}
      onSignUp={(email, password) => run(() => signUp(email, password))}
      onForgot={(email) => run(() => resetPassword(email))}
      loading={loading}
      error={error}
    />
  )
}
