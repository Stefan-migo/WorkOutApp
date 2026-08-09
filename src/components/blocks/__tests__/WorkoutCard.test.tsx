import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { WorkoutCard } from '../WorkoutCard'

afterEach(cleanup)

// WB-1 contract (DD-1). The page test contract (WorkoutListPage.test.tsx)
// locates the card surface via `closest('[role="button"]')` — the block test
// enforces the same locator so future wiring keeps the sibling layout.
const TIMED = {
  id: 'w1',
  title: 'Morning HIIT',
  intervals: [
    { type: 'prepare', duration: 180 },
    { type: 'work', duration: 30 },
    { type: 'rest', duration: 30 },
    { type: 'cooldown', duration: 120 },
  ],
}

function renderCard(overrides: Partial<Parameters<typeof WorkoutCard>[0]> = {}) {
  const props = {
    workout: TIMED,
    onOpen: vi.fn(),
    onPlay: vi.fn(),
    onEdit: vi.fn(),
    onPreview: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<WorkoutCard {...props} />)
  return props
}

describe('WorkoutCard (WB-1)', () => {
  it('renders title, duration meta, and interval count (WB-1a)', () => {
    renderCard()

    expect(screen.getByRole('heading', { level: 3, name: 'Morning HIIT' })).toBeInTheDocument()
    // 180+30+30+120 = 360s -> "6:00"
    expect(screen.getByText('6:00')).toBeInTheDocument()
    expect(screen.getByText('4 intervals')).toBeInTheDocument()
  })

  it('pluralizes "1 interval" and "0 intervals" (WB-1a edge)', () => {
    renderCard({ workout: { ...TIMED, intervals: [{ type: 'work', duration: 30 }] } })
    expect(screen.getByText('1 interval')).toBeInTheDocument()

    renderCard({ workout: { ...TIMED, intervals: [] } })
    expect(screen.getByText('0 intervals')).toBeInTheDocument()
  })

  it('renders the TimelinePreview strip with duration-proportional segments (WB-1b)', () => {
    renderCard()

    const card = screen.getByText('Morning HIIT').closest('[role="button"]')!
    const strip = card.querySelector('.h-2')!
    // 4 intervals -> 4 segments; first is 180/360 = 50%
    expect(strip.children).toHaveLength(4)
    expect((strip.children[0] as HTMLElement).style.width).toBe('50%')
  })

  it('renders no TimelinePreview strip when total duration is 0 (WB-1b, total=0 -> null)', () => {
    renderCard({ workout: { ...TIMED, intervals: [] } })

    const card = screen.getByText('0 intervals').closest('[role="button"]')!
    expect(card.querySelector('.h-2')).toBeNull()
  })

  it('opens the workout on card click (WB-1e)', () => {
    const { onOpen } = renderCard()

    const card = screen.getByText('Morning HIIT').closest('[role="button"]')!
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('opens the workout on Enter keydown (WB-1e)', () => {
    const { onOpen } = renderCard()

    const card = screen.getByText('Morning HIIT').closest('[role="button"]')!
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('fires onPlay from the Play button without firing onOpen (WB-1c, DD-1 siblings)', () => {
    const { onOpen, onPlay } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Play Morning HIIT' }))
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('exposes a ⋮ overflow menu with Play, Edit, Preview, Delete (WB-1d)', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Workout options' }))
    expect(screen.getByText('Play').closest('button')).not.toBeNull()
    expect(screen.getByText('Edit').closest('button')).not.toBeNull()
    expect(screen.getByText('Preview').closest('button')).not.toBeNull()
    expect(screen.getByText('Delete').closest('button')).not.toBeNull()
  })

  it('fires each overflow action callback (WB-1d)', () => {
    const { onPlay, onEdit, onPreview, onDelete } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Workout options' }))
    fireEvent.click(screen.getByText('Play').closest('button')!)
    expect(onPlay).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Workout options' }))
    fireEvent.click(screen.getByText('Edit').closest('button')!)
    expect(onEdit).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Workout options' }))
    fireEvent.click(screen.getByText('Preview').closest('button')!)
    expect(onPreview).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Workout options' }))
    fireEvent.click(screen.getByText('Delete').closest('button')!)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('does not fire onOpen when the card is clicked via the menu path (no nested bubbling)', () => {
    const { onOpen } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Workout options' }))
    fireEvent.click(screen.getByText('Delete').closest('button')!)
    expect(onOpen).not.toHaveBeenCalled()
  })
})
