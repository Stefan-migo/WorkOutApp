import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('next/font/google', () => ({
  Inter: () => ({
    variable: '--font-inter',
    className: '__inter_variable',
  }),
  JetBrains_Mono: () => ({
    variable: '--font-jetbrains-mono',
    className: '__jetbrains_mono_variable',
  }),
}))

vi.mock('@/components/Nav', () => ({ default: () => <nav>Nav</nav> }))
vi.mock('@/components/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/context/WorkoutContext', () => ({
  WorkoutProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import RootLayout from '../layout'

afterEach(cleanup)

// ── Approval tests (refactoring pattern) ───────────────────────────
// These capture the current layout behavior. They must still pass
// after font self-hosting migration — proving no regression.

describe('RootLayout', () => {
  it('renders navigation', () => {
    render(
      <RootLayout>
        <div>test</div>
      </RootLayout>,
    )

    expect(screen.getByText('Nav')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <RootLayout>
        <div>hello world</div>
      </RootLayout>,
    )

    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('applies Inter and JetBrains Mono CSS variable names to documentElement className', () => {
    render(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    )

    // The layout applies font CSS variables via className on <html>:
    // `${inter.variable} ${jetbrainsMono.variable} h-full antialiased`
    // In jsdom, React merges this with the document's root <html>.
    const classes = document.documentElement.className
    expect(classes).toContain('--font-inter')
    expect(classes).toContain('--font-jetbrains-mono')
    expect(classes).toContain('h-full')
    expect(classes).toContain('antialiased')
  })
})
