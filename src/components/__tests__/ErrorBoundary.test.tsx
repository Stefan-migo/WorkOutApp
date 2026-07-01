import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import React from 'react'
import ErrorBoundary from '../ErrorBoundary'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function GoodChild() {
  return <p>All good here</p>
}

function BrokenRender(): React.ReactNode {
  throw new Error('Render crash!')
}

describe('ErrorBoundary', () => {
  describe('normal render', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <GoodChild />
        </ErrorBoundary>,
      )
      expect(screen.getByText('All good here')).toBeInTheDocument()
    })

    it('does not show fallback when children render normally', () => {
      render(
        <ErrorBoundary>
          <GoodChild />
        </ErrorBoundary>,
      )
      expect(screen.queryByText('Something went wrong')).toBeNull()
    })
  })

  describe('error caught', () => {
    it('renders fallback UI when a child throws', () => {
      render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      )
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('shows error message in fallback', () => {
      render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      )
      expect(screen.getByText('Render crash!')).toBeInTheDocument()
    })

    it('logs the error to console.error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      )
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('renders a Try Again button', () => {
      render(
        <ErrorBoundary>
          <BrokenRender />
        </ErrorBoundary>,
      )
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })
})
