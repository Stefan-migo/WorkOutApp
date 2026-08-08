import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Button } from '../Button'

afterEach(cleanup)

// UIP-2 contract + DD-2 class maps (token-only). Class strings are the
// design contract (D11): asserting them is asserting the token wiring.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-label text-label-caps font-bold tracking-wide transition-colors focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none'

describe('Button (UIP-2)', () => {
  it('renders a native <button> with base classes', () => {
    render(<Button>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveClass(...BASE.split(' '))
  })

  it('defaults to the primary variant class map', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveClass(
      'bg-accent',
      'text-accent-on',
      'hover:bg-accent-hover',
      'active:bg-accent-active',
    )
  })

  it('applies the ghost variant class map', () => {
    render(<Button variant="ghost">Cancel</Button>)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'text-fg-2',
      'hover:bg-surface-warm',
      'active:bg-surface-warm/80',
    )
  })

  it('applies the outline variant class map', () => {
    render(<Button variant="outline">Cancel</Button>)
    const button = screen.getByRole('button', { name: 'Cancel' })
    expect(button).toHaveClass(
      'border',
      'border-border-soft',
      'text-fg-2',
      'hover:bg-surface-warm',
      'active:bg-surface-warm/80',
    )
  })

  it('applies the danger variant class map', () => {
    render(<Button variant="danger">Delete</Button>)
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass('bg-danger', 'text-accent-on', 'hover:bg-danger/80')
  })

  it.each([
    ['sm', 'h-9', 'px-3'],
    ['md', 'h-11', 'px-4'],
    ['lg', 'h-12', 'px-5'],
  ] as const)('maps size %s to %s %s', (size, h, px) => {
    render(<Button size={size}>{size}</Button>)
    const button = screen.getByRole('button', { name: size })
    expect(button).toHaveClass(h, px)
  })

  it('defaults to the md size', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('h-11', 'px-4')
  })

  it('adds rounded-full when pill is set', () => {
    render(<Button pill>+</Button>)
    expect(screen.getByRole('button', { name: '+' })).toHaveClass('rounded-full')
  })

  it('adds shadow-fab when elevated is set', () => {
    render(<Button elevated>+</Button>)
    expect(screen.getByRole('button', { name: '+' })).toHaveClass('shadow-fab')
  })

  it('is visually distinct and inert when disabled', () => {
    render(<Button disabled>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
  })

  it('fires onClick on click', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('forwards extra native props', () => {
    render(<Button aria-label="custom label" type="submit">Save</Button>)
    const button = screen.getByRole('button', { name: 'custom label' })
    expect(button).toHaveAttribute('type', 'submit')
  })
})
