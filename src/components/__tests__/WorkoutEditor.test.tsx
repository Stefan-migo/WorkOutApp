import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
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
  IntervalRow: ({ interval, index, onEdit }: any) => (
    <div
      data-testid={`interval-row-${index}`}
      onClick={onEdit}
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
    expect(screen.getByTestId('interval-row-1')).toHaveTextContent('Rest')
  })

  it('applies an edit to the same Work position across cycles', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const intervals: Interval[] = ['first', 'second', 'third'].flatMap((cycleId) => [
      { id: `${cycleId}-1`, type: 'work', title: 'Work 1', duration: 30, cycleId },
      { id: `${cycleId}-rest`, type: 'rest', title: 'Rest', duration: 15, cycleId },
      { id: `${cycleId}-2`, type: 'work', title: 'Work 2', duration: 30, cycleId },
    ])
    render(<WorkoutEditor initialIntervals={intervals} onSave={vi.fn()} />)
    fireEvent.click(screen.getByTestId('interval-row-2'))
    fireEvent.click(screen.getByText('mock-save'))
    fireEvent.click(screen.getByRole('button', { name: 'Same Work position across cycles' }))
    expect(screen.getAllByText('Sheet Saved')).toHaveLength(3)
    expect(screen.getAllByText('Work 1')).toHaveLength(3)
    expect(screen.getByTestId('interval-row-5')).toHaveTextContent('Sheet Saved')
    expect(screen.getByTestId('interval-row-8')).toHaveTextContent('Sheet Saved')
  })

  it('inserts a recovery between adjacent rounds and saves it outside both', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const onSave = vi.fn()
    const intervals: Interval[] = ['Round 1', 'Round 2'].flatMap((cycleTitle) => [1, 2].map((position) => ({
      id: `${cycleTitle}-${position}`, title: `Work ${position}`, type: 'work', duration: 30,
      cycleId: cycleTitle, cycleTitle,
    })))
    render(<WorkoutEditor initialIntervals={intervals} onSave={onSave} />)
    fireEvent.change(screen.getByLabelText('Workout name'), { target: { value: 'Two rounds' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add rest between cycles' }))
    const recovery = screen.getByTestId('interval-row-2')
    expect(recovery).toHaveTextContent('Rest Between Cycles')
    expect(within(screen.getByRole('region', { name: 'Round 1' })).queryByTestId('interval-row-2')).toBeNull()
    expect(within(screen.getByRole('region', { name: 'Round 2' })).queryByTestId('interval-row-2')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Save workout' }))
    expect(onSave.mock.calls[0]![0].intervals.map(({ type }: Interval) => type))
      .toEqual(['work', 'work', 'rest_between_cycles', 'work', 'work'])
    expect(onSave.mock.calls[0]![0].intervals[2].cycleId).toBeUndefined()
  })

  it('shows no-intervals message when empty', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    render(<WorkoutEditor initialIntervals={[]} onSave={vi.fn()} />)
    expect(screen.getByText(/No intervals yet/)).toBeInTheDocument()
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
    expect(screen.getByText('Add a block')).toBeInTheDocument()
    // Check each type appears in the grid (use exact match to avoid substring conflicts)
    expect(screen.getByText('Prepare', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Work', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Cooldown', { exact: true })).toBeInTheDocument()
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
    fireEvent.click(screen.getByText('Save changes'))
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0]![0] as Workout
    expect(saved.title).toBe('Test')
    expect(saved.intervals).toHaveLength(1)
    expect(saved.intervals[0]).toMatchObject({ id: 'i1', type: 'work', title: 'Sprint' })
  })

  it('preserves legacy workout mode on save (no global mode selector)', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const onSave = vi.fn()
    const intervals: Interval[] = [
      { id: 'i1', type: 'work', title: 'Test', duration: 30 },
    ]
    render(<WorkoutEditor existingWorkout={{ id: 'w1', title: 'Test', mode: 'reps', intervals, createdAt: 1, updatedAt: 1 }} onSave={onSave} />)
    // No global mode toggle in the editor anymore
    expect(screen.queryByRole('button', { name: /^timed$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^reps$/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Save changes'))
    const saved = onSave.mock.calls[0]![0] as Workout
    // Spread of ...existingWorkout keeps the legacy mode
    expect(saved.mode).toBe('reps')
  })

  it('new workouts save without a mode field (defaults to timed)', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const onSave = vi.fn()
    render(<WorkoutEditor initialIntervals={[{ id: 'i1', type: 'work', title: 'Test', duration: 30 }]} onSave={onSave} />)
    fireEvent.change(screen.getByPlaceholderText('Name your workout...'), { target: { value: 'New Workout' } })
    fireEvent.click(screen.getByText('Save workout'))
    const saved = onSave.mock.calls[0]![0] as Workout
    expect(saved).not.toHaveProperty('mode')
  })

  it('save is disabled when title is empty', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    render(<WorkoutEditor initialIntervals={[{ id: 'i1', type: 'work', title: 'Test', duration: 30 }]} onSave={vi.fn()} />)
    const saveBtn = screen.getByText('Save workout')
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
    const saveBtn = screen.getByText('Save changes')
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
