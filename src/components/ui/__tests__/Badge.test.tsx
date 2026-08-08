import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Badge } from '../Badge'

afterEach(cleanup)

// UIP-3 contract + DD-2 class maps (token-only). Class strings are the
// design contract (D11): asserting them is asserting the token wiring.
const BASE =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label text-label-caps font-bold'

describe('Badge (UIP-3)', () => {
  it('renders a <span> chip with the base class map', () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge.tagName).toBe('SPAN')
    expect(badge).toHaveClass(...BASE.split(' '))
  })

  it('defaults to the neutral tone class map', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toHaveClass(
      'bg-surface',
      'text-muted',
      'border',
      'border-border-soft',
    )
  })

  it('applies the primary tone class map', () => {
    render(<Badge tone="primary">Pro</Badge>)
    expect(screen.getByText('Pro')).toHaveClass('bg-accent', 'text-accent-on')
  })

  it.each([
    ['success', 'bg-success/15', 'text-fg-2'],
    ['warn', 'bg-warn/15', 'text-fg-2'],
    ['danger', 'bg-danger/15', 'text-fg-2'],
  ] as const)('applies the %s tone class map', (tone, bg, text) => {
    render(<Badge tone={tone}>{tone}</Badge>)
    expect(screen.getByText(tone)).toHaveClass(bg, text)
  })

  it.each([
    ['segment-prepare', 'bg-segment-prepare/10', 'text-fg-2'],
    ['segment-work', 'bg-segment-work/10', 'text-fg-2'],
    ['segment-rest', 'bg-segment-rest/10', 'text-fg-2'],
    ['segment-cooldown', 'bg-segment-cooldown/10', 'text-fg-2'],
  ] as const)('applies the %s tone class map', (tone, bg, text) => {
    render(<Badge tone={tone}>{tone}</Badge>)
    expect(screen.getByText(tone)).toHaveClass(bg, text)
  })

  // UIP-3 scenario: color is never the sole differentiator — the meaning is
  // conveyed in the badge's text, which a screen reader reads aloud.
  it('conveys meaning in text, not color alone (screen-reader scenario)', () => {
    render(
      <>
        <Badge tone="success">Complete</Badge>
        <Badge tone="warn">Pending</Badge>
        <Badge tone="danger">Failed</Badge>
        <Badge tone="segment-work">Work</Badge>
      </>,
    )
    for (const label of ['Complete', 'Pending', 'Failed', 'Work']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('forwards extra native span props', () => {
    render(<Badge data-testid="badge" aria-label="2 new items">2</Badge>)
    expect(screen.getByTestId('badge')).toHaveAttribute('aria-label', '2 new items')
  })
})
