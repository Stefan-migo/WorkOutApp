import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { TimelineStrip } from '../TimelineStrip'
import type { FlattenedInterval } from '@/lib/interval-engine'

afterEach(cleanup)

function interval(overrides: Partial<FlattenedInterval>): FlattenedInterval {
  return {
    id: 'test',
    type: 'work',
    title: 'Work',
    duration: 60,
    depth: 0,
    ...overrides,
  } as FlattenedInterval
}

const noop = () => {}

describe('TimelineStrip', () => {
  it('renders nothing when intervals array is empty', () => {
    const { container } = render(<TimelineStrip intervals={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a segment button for each interval', () => {
    const intervals = [
      interval({ id: 'i1', type: 'prepare', title: 'Warmup', duration: 30 }),
      interval({ id: 'i2', type: 'work', title: 'Sprint', duration: 60 }),
      interval({ id: 'i3', type: 'rest', title: 'Rest', duration: 20 }),
    ]
    render(<TimelineStrip intervals={intervals} onIntervalClick={noop} />)

    expect(screen.getByRole('button', { name: /Warmup/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sprint/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rest/i })).toBeInTheDocument()
  })

  it('renders legend with Prepare, Work, Rest, Cooldown labels', () => {
    const intervals = [
      interval({ id: 'i1', type: 'prepare', title: 'Warmup', duration: 30 }),
      interval({ id: 'i2', type: 'cooldown', title: 'Cool', duration: 60 }),
    ]
    render(<TimelineStrip intervals={intervals} onIntervalClick={noop} />)

    expect(screen.getByText('Prepare')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Rest')).toBeInTheDocument()
    expect(screen.getByText('Cooldown')).toBeInTheDocument()
  })
})
