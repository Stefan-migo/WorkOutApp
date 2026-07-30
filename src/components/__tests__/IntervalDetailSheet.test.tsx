import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'

// ponytail: jsdom polyfill for HTMLDialogElement.showModal/close
beforeAll(() => {
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () { this.open = true; this.dispatchEvent(new Event('open')) }
    HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')) }
  }
})

import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { IntervalDetailSheet } from '../IntervalDetailSheet'
import type { Interval, Exercise, WorkoutMode } from '@/types/workout'

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favoriteIds: [],
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
  }),
}))

afterEach(cleanup)

const exercise: Exercise = {
  id: 'ex1', name: 'Push Up', category: 'strength',
  primaryMuscles: ['Chest', 'Triceps'],
  force: 'push', mechanic: 'compound', difficulty: 'beginner',
  createdAt: 1, updatedAt: 1,
}

function interval(overrides: Partial<Interval> & { id: string }): Interval {
  return {
    type: 'work',
    title: 'Test',
    duration: 60,
    ...overrides,
  }
}

describe('IntervalDetailSheet', () => {
  it('renders title input with current interval title', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i1', title: 'Sprint' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByDisplayValue('Sprint')).toBeInTheDocument()
  })

  it('renders duration input with current duration', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i2', duration: 125 })}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    const durationInput = screen.getByDisplayValue('125')
    expect(durationInput).toBeInTheDocument()
  })

  it('renders type label', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i3', type: 'rest' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('rest')).toBeInTheDocument()
  })

  it('renders exercise picker trigger for work type with exercises', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i4', type: 'work' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        exercises={[exercise]}
      />,
    )
    // Should show a trigger button instead of a <select>
    expect(screen.getByText('Select exercise...')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('does NOT render exercise section for non-work type', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i5', type: 'rest' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        exercises={[exercise]}
      />,
    )
    // The exercise section label should not be in the DOM
    expect(screen.queryByText('Select exercise...')).not.toBeInTheDocument()
  })

  it('shows selected exercise name in trigger when exerciseId is set', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i6', type: 'work', exerciseId: 'ex1' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        exercises={[exercise]}
      />,
    )
    expect(screen.getByText('Push Up')).toBeInTheDocument()
  })

  it('shows mini preview when exercise is selected', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i7', type: 'work', exerciseId: 'ex1' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        exercises={[exercise]}
      />,
    )
    // Mini preview shows category badge
    expect(screen.getByText('strength')).toBeInTheDocument()
    // Primary muscles chips
    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Triceps')).toBeInTheDocument()
  })

  it('renders description textarea', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i8', description: 'Some notes' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByDisplayValue('Some notes')).toBeInTheDocument()
  })

  it('renders imageUrl input', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i9', imageUrl: 'https://example.com/img.jpg' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByDisplayValue('https://example.com/img.jpg')).toBeInTheDocument()
  })

  it('shows reps input for work interval when mode is reps', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i-reps', type: 'work' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        mode="reps"
      />,
    )
    expect(screen.getByLabelText('Reps')).toBeInTheDocument()
  })

  it('shows weight input for work interval when mode is reps', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i-weight', type: 'work' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        mode="reps"
      />,
    )
    expect(screen.getByLabelText('Weight (kg)')).toBeInTheDocument()
  })

  it('hides duration input for work interval when mode is reps', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i-hide-dur', type: 'work' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        mode="reps"
      />,
    )
    expect(screen.queryByLabelText('Duration (seconds)')).not.toBeInTheDocument()
  })

  it('does not show reps input for non-work type even in reps mode', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i-rest-reps', type: 'rest' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        mode="reps"
      />,
    )
    expect(screen.queryByLabelText('Reps')).not.toBeInTheDocument()
  })

  it('does not show reps input when mode is timed', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i-timed', type: 'work' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
        mode="timed"
      />,
    )
    expect(screen.queryByLabelText('Reps')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Duration (seconds)')).toBeInTheDocument()
  })

  it('includes reps and weight in onSave when in reps mode', () => {
    const onSave = vi.fn()
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i-save-reps', type: 'work' })}
        onSave={onSave}
        onClose={vi.fn()}
        mode="reps"
      />,
    )
    const repsInput = screen.getByLabelText('Reps')
    fireEvent.change(repsInput, { target: { value: '10' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'i-save-reps', reps: 10 }),
    )
  })

  it('does NOT render cycle/set/rest-between-cycles controls (V2 flat model)', () => {
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i10', type: 'work' })}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText(/cycles/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sets/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/rest between cycles/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/nesting/i)).not.toBeInTheDocument()
  })

  it('calls onSave with updated interval when save is clicked', () => {
    const onSave = vi.fn()
    render(
      <IntervalDetailSheet
        interval={interval({ id: 'i11', title: 'Sprint', duration: 60, description: 'Go fast' })}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'i11',
        title: 'Sprint',
        duration: 60,
        description: 'Go fast',
      }),
    )
  })
})
