import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { IntervalRow } from '../IntervalRow'
import type { Interval } from '@/types/workout'

vi.mock('next/link', () => {
  const Link = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
  return { default: Link }
})

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({
    getExercise: vi.fn((id: string) => {
      if (id === 'ex-1') {
        return {
          id: 'ex-1',
          name: 'Sprint',
          category: 'cardio',
          primaryMuscles: ['Quadriceps', 'Hamstrings', 'Glutes'],
          images: ['https://example.com/sprint.jpg'],
          createdAt: 0,
          updatedAt: 0,
        }
      }
      return undefined
    }),
    exercises: [],
    saveExercise: vi.fn(),
    deleteExercise: vi.fn(),
  }),
}))

afterEach(cleanup)

function interval(overrides: Partial<Interval> & { id: string }): Interval {
  return {
    type: 'work',
    title: 'Test Interval',
    duration: 60,
    ...overrides,
  }
}

const noop = () => {}

describe('IntervalRow', () => {
  it('renders the interval title in the input', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i1', title: 'Sprint Drills' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    const titleInput = screen.getByDisplayValue('Sprint Drills')
    expect(titleInput).toBeInTheDocument()
  })

  it('renders duration as MM:SS in the duration input', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i2', duration: 125 })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    const durationInput = screen.getByDisplayValue('02:05')
    expect(durationInput).toBeInTheDocument()
  })

  it('shows exercise preview for work type with exerciseId', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i3', type: 'work', exerciseId: 'ex-1' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    // Exercise name shown as link
    const link = screen.getByRole('link', { name: 'Sprint' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/exercises/ex-1')
    // Thumbnail image
    const img = screen.getByAltText('Sprint')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/sprint.jpg')
    // Primary muscles chips (max 2 of 3)
    expect(screen.getByText('Quadriceps')).toBeInTheDocument()
    expect(screen.getByText('Hamstrings')).toBeInTheDocument()
    expect(screen.queryByText('Glutes')).not.toBeInTheDocument()
  })

  it('does not show exercise preview for rest interval', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i9', type: 'rest', title: 'Rest' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByAltText(/Sprint|Rest/)).not.toBeInTheDocument()
  })

  it('does not show exercise preview for work interval without exerciseId', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i10', type: 'work', title: 'Free Work' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders move up and move down buttons visible on hover', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i4' })}
        index={1}
        onChange={noop}
        onRemove={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        isFirst={false}
        isLast={false}
      />,
    )
    expect(screen.getByRole('button', { name: /move interval 2 up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move interval 2 down/i })).toBeInTheDocument()
  })

  it('renders remove button', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i5' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    expect(screen.getByRole('button', { name: /remove interval 1/i })).toBeInTheDocument()
  })

  it('does NOT render checkbox (selection mode removed)', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i6' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('renders drag handle for DnD reorder', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i7' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
  })

  it('accepts onDragStart prop without parentIndex parameter', () => {
    const onDragStart = vi.fn()
    render(
      <IntervalRow
        interval={interval({ id: 'i8' })}
        index={2}
        onChange={noop}
        onRemove={noop}
        onDragStart={(i) => onDragStart(i)}
      />,
    )
    // Trigger drag via draggable attribute
    const row = screen.getByLabelText('Drag to reorder').closest('[draggable]') as HTMLElement
    expect(row).toBeInTheDocument()
  })
})
