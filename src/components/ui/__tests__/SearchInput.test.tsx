import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import '@testing-library/jest-dom/vitest'
import { SearchInput } from '../SearchInput'

afterEach(cleanup)

// UIP-4 contract: type="search", clear affordance (aria-label "Clear search")
// visible only when value !== '', click -> onChange('') + refocus.
function Harness({
  initial = '',
  onClear,
}: {
  initial?: string
  onClear?: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <SearchInput label="Search" value={value} onChange={setValue} onClear={onClear} />
  )
}

describe('SearchInput (UIP-4)', () => {
  it('renders an input with type="search"', () => {
    render(<Harness />)
    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search')
  })

  it('hides the clear affordance when the value is empty', () => {
    render(<Harness />)
    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument()
  })

  it('shows the clear affordance when the value is non-empty', () => {
    render(<Harness initial="squat" />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
  })

  it('clears the value and refocuses the field when the affordance is clicked', () => {
    render(<Harness initial="squat" />)

    const input = screen.getByRole('searchbox')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('calls onClear after clearing the value', () => {
    const onClear = vi.fn()
    render(<Harness initial="squat" onClear={onClear} />)

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('hides the clear affordance when disabled', () => {
    render(<SearchInput label="Search" value="squat" onChange={vi.fn()} disabled />)
    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument()
  })
})
