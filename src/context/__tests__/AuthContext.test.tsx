import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act, renderHook } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock supabase client before any imports
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  })),
}))

import { AuthProvider, useAuth } from '../AuthContext'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

beforeEach(() => {
  // Default mock: no session, no auth change subscription
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
})

describe('AuthProvider', () => {
  it('renders children', () => {
    render(
      <AuthProvider>
        <div>hello</div>
      </AuthProvider>,
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('starts in loading state, then resolves', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Initially loading (before getSession resolves)
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()

    // Wait for getSession to resolve
    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('sets user from existing session on mount', async () => {
    const fakeUser = { id: 'abc', email: 'test@test.com' }
    mockGetSession.mockResolvedValue({
      data: { session: { user: fakeUser } },
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    expect(result.current.user).toEqual(fakeUser)
    expect(result.current.loading).toBe(false)
  })
})

describe('useAuth()', () => {
  it('throws without AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    )
  })
})

describe('signIn', () => {
  it('calls signInWithPassword and returns null on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    let res: { error: string | null } | undefined
    await act(async () => {
      res = await result.current.signIn('test@test.com', 'password')
    })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password',
    })
    expect(res!.error).toBeNull()
  })

  it('returns error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    let res: { error: string | null } | undefined
    await act(async () => {
      res = await result.current.signIn('test@test.com', 'wrong')
    })

    expect(res!.error).toBe('Invalid login credentials')
  })
})

describe('signUp', () => {
  it('calls signUp and returns null on success', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    let res: { error: string | null } | undefined
    await act(async () => {
      res = await result.current.signUp('new@test.com', 'password')
    })

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'password',
    })
    expect(res!.error).toBeNull()
  })

  it('returns error on duplicate email', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered' },
    })
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    let res: { error: string | null } | undefined
    await act(async () => {
      res = await result.current.signUp('exists@test.com', 'password')
    })

    expect(res!.error).toBe('User already registered')
  })
})

describe('signOut', () => {
  it('calls signOut and sets user to null', async () => {
    const fakeUser = { id: 'abc', email: 'test@test.com' }
    mockGetSession.mockResolvedValue({
      data: { session: { user: fakeUser } },
      error: null,
    })
    mockSignOut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    expect(result.current.user).toEqual(fakeUser)

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
  })
})

describe('onAuthStateChange', () => {
  it('subscribes on mount and unsubscribes on unmount', () => {
    const unsubscribe = vi.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })

    const { unmount } = renderHook(() => useAuth(), { wrapper })

    expect(mockOnAuthStateChange).toHaveBeenCalled()

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  it('updates user when auth state changes', async () => {
    const fakeUser = { id: 'abc', email: 'test@test.com' }
    let listener: ((event: string, session: any) => void) | undefined
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      listener = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await mockGetSession.mock.results[0]?.value
    })

    expect(result.current.user).toBeNull()

    // Simulate auth state change
    await act(async () => {
      listener?.('SIGNED_IN', { user: fakeUser })
    })

    expect(result.current.user).toEqual(fakeUser)
  })
})
