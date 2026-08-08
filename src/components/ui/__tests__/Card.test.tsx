import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Card } from '../Card'

afterEach(cleanup)

// UIP-3 contract + DD-2 class maps (token-only). Class strings are the
// design contract (D11): asserting them is asserting the token wiring.
const SHARED = 'rounded-xl border'

describe('Card (UIP-3)', () => {
  it('renders a <div> with the default variant class map', () => {
    render(<Card>Content</Card>)

    const card = screen.getByText('Content').closest('div')!
    expect(card.tagName).toBe('DIV')
    expect(card).toHaveClass(...`${SHARED} bg-surface border-border-soft`.split(' '))
  })

  it('applies the raised variant class map', () => {
    render(<Card variant="raised">Content</Card>)
    const card = screen.getByText('Content').closest('div')!
    expect(card).toHaveClass(...`${SHARED} bg-surface border-border shadow-card-hover`.split(' '))
  })

  it('applies the inset variant class map', () => {
    render(<Card variant="inset">Content</Card>)
    const card = screen.getByText('Content').closest('div')!
    expect(card).toHaveClass(...`${SHARED} bg-bg border-border-soft`.split(' '))
  })

  it('adds the interactive hover affordance classes', () => {
    render(<Card interactive>Content</Card>)
    const card = screen.getByText('Content').closest('div')!
    expect(card).toHaveClass(
      'cursor-pointer',
      'transition-colors',
      'hover:border-border',
      'hover:shadow-card-hover',
    )
  })

  it('keeps click handling at the call site (no asChild)', () => {
    const onClick = vi.fn()
    render(<Card interactive onClick={onClick}>Content</Card>)
    fireEvent.click(screen.getByText('Content').closest('div')!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is presentational only — never fetches data', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<Card>Content</Card>)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('forwards extra native div props', () => {
    render(<Card data-testid="card" aria-label="Stats">Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveAttribute('aria-label', 'Stats')
  })
})
