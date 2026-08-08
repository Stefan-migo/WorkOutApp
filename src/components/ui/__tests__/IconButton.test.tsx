import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { IconButton } from '../IconButton'

afterEach(cleanup)

// UIP-2 contract: IconButton must be ≥44×44px and require an accessible name.
// aria-label is TS-required (omitting it fails `npx tsc --noEmit`).
const BASE =
  'inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none'

describe('IconButton (UIP-2)', () => {
  it('renders a native <button> of at least 44x44px by default', () => {
    render(<IconButton aria-label="Add">+</IconButton>)

    const button = screen.getByRole('button', { name: 'Add' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveClass(...BASE.split(' '))
    expect(button).toHaveClass('h-11', 'w-11')
  })

  it('defaults to the primary variant class map', () => {
    render(<IconButton aria-label="Add">+</IconButton>)
    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass(
      'bg-accent',
      'text-accent-on',
      'hover:bg-accent-hover',
      'active:bg-accent-active',
    )
  })

  it('applies the ghost variant class map', () => {
    render(<IconButton aria-label="Cancel" variant="ghost">×</IconButton>)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'text-fg-2',
      'hover:bg-surface-warm',
      'active:bg-surface-warm/80',
    )
  })

  it('applies the outline variant class map', () => {
    render(<IconButton aria-label="Cancel" variant="outline">×</IconButton>)
    const button = screen.getByRole('button', { name: 'Cancel' })
    expect(button).toHaveClass('border', 'border-border-soft', 'text-fg-2')
  })

  it('applies the danger variant class map', () => {
    render(<IconButton aria-label="Delete" variant="danger">🗑</IconButton>)
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'bg-danger',
      'text-accent-on',
      'hover:bg-danger/80',
    )
  })

  it('supports the compact sm size', () => {
    render(<IconButton aria-label="Add" size="sm">+</IconButton>)
    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass('h-9', 'w-9')
  })

  it('is visually distinct and inert when disabled', () => {
    render(<IconButton aria-label="Add" disabled>+</IconButton>)
    const button = screen.getByRole('button', { name: 'Add' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
  })

  it('fires onClick on click', () => {
    const onClick = vi.fn()
    render(<IconButton aria-label="Add" onClick={onClick}>+</IconButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
