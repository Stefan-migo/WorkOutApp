import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { IntervalRow } from '../IntervalRow'
import type { Interval } from '@/types/workout'

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({
    getExercise: vi.fn((id: string) =>
      id === 'ex-1' ? { id: 'ex-1', name: 'Sprint', category: 'cardio', createdAt: 0, updatedAt: 0 } : undefined,
    ),
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

  it('shows exercise name for work type with exerciseId', () => {
    render(
      <IntervalRow
        interval={interval({ id: 'i3', type: 'work', exerciseId: 'ex-1' })}
        index={0}
        onChange={noop}
        onRemove={noop}
      />,
    )
    expect(screen.getByText('Sprint')).toBeInTheDocument()
  })

  it('renders move up and move down buttons', () => {
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
})
