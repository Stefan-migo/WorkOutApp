import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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

  describe('selection mode', () => {
    it('renders checkbox when selectionMode is true', () => {
      render(
        <IntervalRow
          interval={interval({ id: 'i6' })}
          index={0}
          onChange={noop}
          onRemove={noop}
          selectionMode={true}
        />,
      )
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('checkbox is checked when selected is true', () => {
      render(
        <IntervalRow
          interval={interval({ id: 'i7' })}
          index={0}
          onChange={noop}
          onRemove={noop}
          selectionMode={true}
          selected={true}
        />,
      )
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('checkbox is unchecked when selected is false', () => {
      render(
        <IntervalRow
          interval={interval({ id: 'i8' })}
          index={0}
          onChange={noop}
          onRemove={noop}
          selectionMode={true}
          selected={false}
        />,
      )
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('onSelect is called with index when checkbox is clicked', () => {
      const onSelect = vi.fn()
      render(
        <IntervalRow
          interval={interval({ id: 'i9' })}
          index={3}
          onChange={noop}
          onRemove={noop}
          selectionMode={true}
          onSelect={onSelect}
        />,
      )
      fireEvent.click(screen.getByRole('checkbox'))
      expect(onSelect).toHaveBeenCalledWith(3)
    })

    it('does NOT render checkbox when selectionMode is false', () => {
      render(
        <IntervalRow
          interval={interval({ id: 'i10' })}
          index={0}
          onChange={noop}
          onRemove={noop}
          selectionMode={false}
        />,
      )
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('does NOT render checkbox when selectionMode is undefined', () => {
      render(
        <IntervalRow
          interval={interval({ id: 'i11' })}
          index={0}
          onChange={noop}
          onRemove={noop}
        />,
      )
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('drag indicator is hidden when selectionMode is true', () => {
      render(
        <IntervalRow
          interval={interval({ id: 'i12' })}
          index={0}
          onChange={noop}
          onRemove={noop}
          selectionMode={true}
        />,
      )
      // The drag handle container should be hidden or not visible
      const dragHandle = screen.queryByLabelText('Drag to reorder')
      expect(dragHandle).not.toBeInTheDocument()
    })

    it('drag indicator is visible when selectionMode is false', () => {
      render(
        <IntervalRow
          interval={interval({ id: 'i13' })}
          index={0}
          onChange={noop}
          onRemove={noop}
        />,
      )
      expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
    })

    it('selected row gets visual highlight class', () => {
      const { container } = render(
        <IntervalRow
          interval={interval({ id: 'i14' })}
          index={0}
          onChange={noop}
          onRemove={noop}
          selectionMode={true}
          selected={true}
        />,
      )
      // The outer container div should have ring classes when selected
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).toContain('ring')
    })
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
