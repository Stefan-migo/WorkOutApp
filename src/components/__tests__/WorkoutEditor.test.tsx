import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { Interval, Workout } from '@/types/workout'

// ponytail: jsdom polyfill for HTMLDialogElement
beforeAll(() => {
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () { this.open = true }
    HTMLDialogElement.prototype.close = function () { this.open = false }
  }
})

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({ exercises: [], getExercise: vi.fn() }),
}))

vi.mock('@/components/TimelineStrip', () => ({
  TimelineStrip: () => null,
}))

// ponytail: simplified mock — renders the interval title
vi.mock('@/components/IntervalRow', () => ({
  IntervalRow: ({ interval, index, onChange }: any) => (
    <div
      data-testid={`interval-row-${index}`}
      onClick={() => onChange?.(index, { ...interval, title: 'Changed' })}
    >
      {interval.title}
    </div>
  ),
}))

// ponytail: mock the sheet — just renders interval type
vi.mock('@/components/IntervalDetailSheet', () => ({
  IntervalDetailSheet: ({ interval, onSave }: any) => (
    <div data-testid="detail-sheet">
      <span>{interval.title}</span>
      <button onClick={() => onSave({ ...interval, title: 'Sheet Saved' })}>mock-save</button>
    </div>
  ),
}))

afterEach(cleanup)

describe('WorkoutEditor', () => {
  it('renders intervals from initialIntervals', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const intervals: Interval[] = [
      { id: 'i1', type: 'work', title: 'Push Up', duration: 60 },
      { id: 'i2', type: 'rest', title: 'Rest', duration: 30 },
    ]
    render(<WorkoutEditor initialIntervals={intervals} onSave={vi.fn()} />)
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.getByText('Rest')).toBeInTheDocument()
  })

  it('shows no-intervals message when empty', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    render(<WorkoutEditor initialIntervals={[]} onSave={vi.fn()} />)
    expect(screen.getByText('No intervals yet')).toBeInTheDocument()
  })

  it('uses existingWorkout intervals over initialIntervals', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const initial: Interval[] = [
      { id: 'init1', type: 'work', title: 'From Initial', duration: 60 },
    ]
    const existing: Workout = {
      id: 'w1', title: 'Existing',
      intervals: [{ id: 'ex1', type: 'work', title: 'From Existing', duration: 30 }],
      createdAt: 1, updatedAt: 1,
    }
    render(<WorkoutEditor existingWorkout={existing} initialIntervals={initial} onSave={vi.fn()} />)
    expect(screen.getByText('From Existing')).toBeInTheDocument()
    expect(screen.queryByText('From Initial')).not.toBeInTheDocument()
  })

  it('renders title input from existing workout', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const existing: Workout = {
      id: 'w1', title: 'Morning Routine',
      intervals: [{ id: 'i1', type: 'work', title: 'Push Up', duration: 60 }],
      createdAt: 1, updatedAt: 1,
    }
    render(<WorkoutEditor existingWorkout={existing} onSave={vi.fn()} />)
    expect(screen.getByDisplayValue('Morning Routine')).toBeInTheDocument()
  })

  it('shows estimated duration', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const intervals: Interval[] = [
      { id: 'i1', type: 'work', title: 'Work', duration: 90 },
      { id: 'i2', type: 'rest', title: 'Rest', duration: 30 },
    ]
    render(<WorkoutEditor initialIntervals={intervals} onSave={vi.fn()} />)
    // 90 + 30 = 120s = 2:00
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('renders Add Block with 5 interval types (no Cycle)', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    render(<WorkoutEditor initialIntervals={[]} onSave={vi.fn()} />)
    expect(screen.getByText('Add Block')).toBeInTheDocument()
    // Check each type appears in the grid (use exact match to avoid substring conflicts)
    expect(screen.getByText('prepare', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('work', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('cooldown', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText(/^cycle$/i)).not.toBeInTheDocument()
  })

  it('adds an interval via Add Block button', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    vi.useFakeTimers()
    render(<WorkoutEditor initialIntervals={[]} onSave={vi.fn()} />)
    vi.advanceTimersByTime(10)
    // Find and click the prepare block button
    const addBlockButtons = screen.getAllByRole('button')
    const prepareBtn = addBlockButtons.find(b => b.textContent?.toLowerCase().includes('prepare'))
    expect(prepareBtn).toBeTruthy()
    fireEvent.click(prepareBtn!)
    // The mock IntervalRow renders title — after adding, the new interval appears
    const rows = screen.getAllByTestId(/interval-row-/)
    expect(rows.length).toBe(1)
    vi.useRealTimers()
  })

  it('saves a flat workout', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const onSave = vi.fn()
    const intervals: Interval[] = [
      { id: 'i1', type: 'work', title: 'Sprint', duration: 60 },
    ]
    render(<WorkoutEditor existingWorkout={{ id: 'w1', title: 'Test', intervals, createdAt: 1, updatedAt: 1 }} onSave={onSave} />)
    fireEvent.click(screen.getByText('Update Workout'))
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0]![0] as Workout
    expect(saved.title).toBe('Test')
    expect(saved.intervals).toHaveLength(1)
    expect(saved.intervals[0]).toMatchObject({ id: 'i1', type: 'work', title: 'Sprint' })
  })

  it('save is disabled when title is empty', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    render(<WorkoutEditor initialIntervals={[{ id: 'i1', type: 'work', title: 'Test', duration: 30 }]} onSave={vi.fn()} />)
    const saveBtn = screen.getByText('Save Workout')
    expect(saveBtn).toBeDisabled()
  })

  it('save is disabled when intervals are empty', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const existing: Workout = {
      id: 'w1', title: 'Test',
      intervals: [],
      createdAt: 1, updatedAt: 1,
    }
    const onSave = vi.fn()
    render(<WorkoutEditor existingWorkout={existing} onSave={onSave} />)
    const saveBtn = screen.getByText('Update Workout')
    expect(saveBtn).toBeDisabled()
  })

  it('discard button calls onCancel', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const onCancel = vi.fn()
    render(<WorkoutEditor initialIntervals={[{ id: 'i1', type: 'work', title: 'Test', duration: 30 }]} onSave={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Discard'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
