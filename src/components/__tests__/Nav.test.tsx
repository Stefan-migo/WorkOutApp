import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import Nav from '../Nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/workouts',
}))

const mockSignOut = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'trainer@example.com' },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: mockSignOut,
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Nav', () => {
  it('shows the signed-in user and sign out button', () => {
    render(<Nav />)
    expect(screen.getByText('trainer@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('calls signOut on click', () => {
    render(<Nav />)
    fireEvent.click(screen.getByText('Sign out'))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
