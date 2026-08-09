import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { EmptyState } from '../EmptyState'

afterEach(cleanup)

// UIP-5 contract: optional icon/title/body/action render; token colors
// (DD-8: title text-headline-md, body text-body-md, icon text-meta).
// Class strings are the design contract (D11): asserting them is asserting
// the token wiring (repo pattern, see Card/Badge/Input tests).
describe('EmptyState (UIP-5)', () => {
  it('renders title, body, and action when provided', () => {
    render(
      <EmptyState
        title="No exercises found"
        body="Add your first exercise to get started"
        action={<button>Add exercise</button>}
      />,
    )

    expect(screen.getByText('No exercises found')).toBeInTheDocument()
    expect(
      screen.getByText('Add your first exercise to get started'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add exercise' })).toBeInTheDocument()
  })

  it('renders the optional icon inside the text-meta slot', () => {
    render(
      <EmptyState
        title="Nothing here"
        icon={<svg data-testid="empty-icon" />}
      />,
    )

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
    expect(screen.getByTestId('empty-icon').parentElement).toHaveClass('text-meta')
  })

  it('omits body and action when not provided', () => {
    render(<EmptyState title="Nothing here" />)

    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    // No body paragraph rendered when body is absent.
    const paragraphs = document.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('uses the DD-8 token class maps (headline title, body-md body)', () => {
    render(<EmptyState title="No items" body="Body text" />)

    expect(screen.getByText('No items')).toHaveClass(
      'font-headline',
      'text-headline-md',
      'font-semibold',
      'text-fg-2',
    )
    expect(screen.getByText('Body text')).toHaveClass(
      'font-body',
      'text-body-md',
      'text-fg-2',
    )
  })
})
