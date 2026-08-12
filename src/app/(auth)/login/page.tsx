'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthCard } from '@/components/blocks/AuthCard'

// ponytail: useSearchParams needs a Suspense boundary for static prerender (Next 16)
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
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

  const run = async (fn: () => Promise<{ error: string | null }>) => {
    setError(null)
    setLoading(true)
    const { error } = await fn()
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <AuthCard
      onSignIn={async (email, password) => {
        const result = await signIn(email, password)
        await run(() => Promise.resolve(result))
        if (!result.error) router.push(redirectTo)
        return result
      }}
      onSignUp={async (email, password) => {
        const result = await signUp(email, password)
        await run(() => Promise.resolve(result))
        return result
      }}
      onForgot={async email => {
        const result = await resetPassword(email)
        await run(() => Promise.resolve(result))
        return result
      }}
      loading={loading}
      error={error}
    />
  )
}
