import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Input } from '../Input'

afterEach(cleanup)

// UIP-4 contract: visible label (never placeholder-only), htmlFor/id
// association, error announced near the field, leadingIcon -> pl-10.
// Class strings are the design contract (D11): asserting them is asserting
// the token wiring (repo pattern, see Card/Badge tests).
describe('Input (UIP-4)', () => {
  it('renders a visible label — never placeholder-only', () => {
    render(<Input label="Email" placeholder="you@example.com" />)

    // The label is real, associated text — not just a placeholder hint.
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('associates label and field via htmlFor/id', () => {
    render(<Input label="Email" id="email-field" />)

    const field = screen.getByLabelText('Email')
    expect(field).toHaveAttribute('id', 'email-field')
    // jsdom exposes the for attribute as `for`; htmlFor is the JS property.
    expect(screen.getByText('Email').closest('label')).toHaveAttribute(
      'for',
      'email-field',
    )
  })

  it('generates a field id via useId when none is provided', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('id')
  })

  it('renders the error near the field, wired via aria-invalid + aria-describedby', () => {
    render(<Input label="Email" error="This field is required" />)

    const field = screen.getByLabelText('Email')
    expect(field).toHaveAttribute('aria-invalid', 'true')

    const errorId = field.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    const error = document.getElementById(errorId!)
    expect(error).toHaveTextContent('This field is required')
  })

  it('omits aria-describedby when there is no error', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby')
  })

  // Deviation pin (design.md lines 102-104, fixed for AA): label + error maps
  // were re-tokenized in apply — text-muted/text-danger failed axe on the page
  // bg (#55423d); label → text-fg-2, error → bg-danger/15 text-fg-2 chip.
  it('uses the AA-corrected label and error class maps', () => {
    render(<Input label="Email" error="This field is required" />)

    expect(screen.getByText('Email')).toHaveClass('text-fg-2')
    const errorId = screen.getByLabelText('Email').getAttribute('aria-describedby')!
    expect(document.getElementById(errorId)).toHaveClass('bg-danger/15', 'text-fg-2')
  })

  it('adds pl-10 to the field when a leadingIcon is provided', () => {
    render(
      <Input
        label="Search"
        leadingIcon={
          <svg aria-hidden="true" data-testid="search-icon">
            <circle cx="11" cy="11" r="7" />
          </svg>
        }
      />,
    )

    expect(screen.getByLabelText('Search')).toHaveClass('pl-10')
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('forwards extra native input props', () => {
    render(<Input label="Email" type="email" data-testid="email-input" />)
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email')
  })
})
