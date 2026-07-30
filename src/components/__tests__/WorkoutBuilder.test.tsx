import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { CycleTemplate } from '@/types/workout'

// ponytail: pure function imports work even before the component exists — they compile independently
vi.mock('@/lib/segment-styles', () => ({
  SEGMENT_BG: { prepare: '', work: '', rest: '', rest_between_cycles: '', cooldown: '' },
  SEGMENT_BORDER: { prepare: '', work: '', rest: '', rest_between_cycles: '', cooldown: '' },
  SEGMENT_TEXT: { prepare: '', work: '', rest: '', rest_between_cycles: '', cooldown: '' },
  SEGMENT_DOT: { prepare: '', work: '', rest: '', rest_between_cycles: '', cooldown: '' },
  TYPE_ICONS: {
    prepare: 'self_improvement',
    work: 'directions_run',
    rest: 'pause_circle',
    rest_between_cycles: 'hourglass_bottom',
    cooldown: 'ac_unit',
  },
}))

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({ exercises: [] }),
}))

afterEach(cleanup)

// ===========================================================================
// Pure function: expandCycle
// ===========================================================================
describe('expandCycle', () => {
  it('expands Cycle(repeat=3, work=45, rest=20, skipLastRest=true) to 5 intervals', async () => {
    const { expandCycle } = await import('../WorkoutBuilder')
    const cycle: CycleTemplate = {
      id: 'c1', title: 'Cycle', repeat: 3,
      workDuration: 45, restDuration: 20, skipLastRest: true,
    }
    const result = expandCycle(cycle)
    expect(result).toHaveLength(5)
    expect(result[0]!.type).toBe('work')
    expect(result[0]!.duration).toBe(45)
    expect(result[1]!.type).toBe('rest')
    expect(result[1]!.duration).toBe(20)
    expect(result[2]!.type).toBe('work')
    expect(result[3]!.type).toBe('rest')
    expect(result[4]!.type).toBe('work')
  })

  it('expands Cycle(repeat=2, skipLastRest=false) to 4 intervals', async () => {
    const { expandCycle } = await import('../WorkoutBuilder')
    const cycle: CycleTemplate = {
      id: 'c2', title: 'Cycle', repeat: 2,
      workDuration: 30, restDuration: 15, skipLastRest: false,
    }
    const result = expandCycle(cycle)
    expect(result).toHaveLength(4)
    expect(result[0]!.type).toBe('work')
    expect(result[1]!.type).toBe('rest')
    expect(result[2]!.type).toBe('work')
    expect(result[3]!.type).toBe('rest')
  })

  it('propagates workReps to expanded intervals', async () => {
    const { expandCycle } = await import('../WorkoutBuilder')
    const cycle: CycleTemplate = {
      id: 'c-r', title: 'Rep Cycle', repeat: 2,
      workDuration: 30, restDuration: 15, skipLastRest: true,
      workReps: 10,
    }
    // skipLastRest=true: work, rest, work = 3 intervals
    const result = expandCycle(cycle)
    expect(result).toHaveLength(3)
    expect(result[0]!.reps).toBe(10)
    expect(result[2]!.reps).toBe(10)
  })

  it('propagates workWeight to expanded intervals', async () => {
    const { expandCycle } = await import('../WorkoutBuilder')
    const cycle: CycleTemplate = {
      id: 'c-w', title: 'Weight Cycle', repeat: 2,
      workDuration: 30, restDuration: 15, skipLastRest: true,
      workReps: 10, workWeight: 20,
    }
    const result = expandCycle(cycle)
    expect(result[0]!.weight).toBe(20)
    expect(result[0]!.reps).toBe(10)
  })

  it('omits reps when CycleTemplate has no workReps', async () => {
    const { expandCycle } = await import('../WorkoutBuilder')
    const cycle: CycleTemplate = {
      id: 'c-nr', title: 'No Rep Cycle', repeat: 1,
      workDuration: 30, restDuration: 15, skipLastRest: true,
    }
    const result = expandCycle(cycle)
    expect(result[0]!.reps).toBeUndefined()
  })

  it('expands Cycle(repeat=1, skipLastRest=true) to 1 interval', async () => {
    const { expandCycle } = await import('../WorkoutBuilder')
    const cycle: CycleTemplate = {
      id: 'c3', title: 'Cycle', repeat: 1,
      workDuration: 30, restDuration: 15, skipLastRest: true,
    }
    const result = expandCycle(cycle)
    expect(result).toHaveLength(1)
    expect(result[0]!.type).toBe('work')
  })

  it('every expanded interval has a unique id', async () => {
    const { expandCycle } = await import('../WorkoutBuilder')
    const cycle: CycleTemplate = {
      id: 'c4', title: 'Cycle', repeat: 5, workDuration: 30, restDuration: 15, skipLastRest: true,
    }
    const result = expandCycle(cycle)
    const ids = result.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ===========================================================================
// Pure function: createInterval
// ===========================================================================
describe('createInterval', () => {
  it('creates Work interval with title "Work" and duration 30', async () => {
    const { createInterval } = await import('../WorkoutBuilder')
    const interval = createInterval('work')
    expect(interval.type).toBe('work')
    expect(interval.title).toBe('Work')
    expect(interval.duration).toBe(30)
  })

  it('creates Prepare interval with duration 15', async () => {
    const { createInterval } = await import('../WorkoutBuilder')
    expect(createInterval('prepare').duration).toBe(15)
  })

  it('creates Rest Between Cycles interval with correct title', async () => {
    const { createInterval } = await import('../WorkoutBuilder')
    const interval = createInterval('rest_between_cycles')
    expect(interval.title).toBe('Rest Between Cycles')
    expect(interval.type).toBe('rest_between_cycles')
    expect(interval.duration).toBe(15)
  })
})

// ===========================================================================
// Component: WorkoutBuilder palette
// ===========================================================================
describe('WorkoutBuilder palette', () => {
  it('renders all 6 block types', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    render(<WorkoutBuilder onSave={vi.fn()} />)
    expect(screen.getByText('Prepare')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Rest')).toBeInTheDocument()
    expect(screen.getByText('Rest Between Cycles')).toBeInTheDocument()
    expect(screen.getByText('Cycle')).toBeInTheDocument()
    expect(screen.getByText('Cool Down')).toBeInTheDocument()
  })

  it('clicking Work adds a Work interval directly', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    render(<WorkoutBuilder onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Work' }))
    expect(screen.getByDisplayValue('Work')).toBeInTheDocument()
  })

  it('clicking Cycle adds a Cycle template card directly', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    render(<WorkoutBuilder onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Cycle' }))
    expect(screen.getByDisplayValue('Cycle')).toBeInTheDocument()
    expect(screen.getByDisplayValue('4')).toBeInTheDocument()
    expect(screen.getByDisplayValue('30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15')).toBeInTheDocument()
  })
})

// ===========================================================================
// Component: WorkoutBuilder save / expansion
// ===========================================================================
describe('WorkoutBuilder cycle reps', () => {
  it('shows workReps and workWeight inputs in Cycle card', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    render(<WorkoutBuilder onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Cycle' }))
    expect(screen.getByLabelText('Work reps')).toBeInTheDocument()
    expect(screen.getByLabelText('Work weight (kg)')).toBeInTheDocument()
  })

  it('workReps input updates cycle workReps value', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    render(<WorkoutBuilder onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Cycle' }))
    const repsInput = screen.getByLabelText('Work reps')
    fireEvent.change(repsInput, { target: { value: '12' } })
    expect(repsInput).toHaveValue('12')
  })
})

describe('WorkoutBuilder save', () => {
  it('expands default Cycle(repeat=4, skipLastRest=true) to 7 intervals on Build Workout', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    const onSave = vi.fn()
    render(<WorkoutBuilder onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Cycle' }))
    fireEvent.click(screen.getByText('Build Workout'))

    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0]![0] as Array<{ type: string; duration: number }>
    expect(saved).toHaveLength(7)
    expect(saved[0]!.type).toBe('work')
    expect(saved[0]!.duration).toBe(30)
    expect(saved[6]!.type).toBe('work')
  })

  it('produces mixed flat intervals: Prepare + Cycle(repeat=2) + CoolDown', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    const onSave = vi.fn()
    render(<WorkoutBuilder onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Prepare' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Cycle' }))
    fireEvent.change(screen.getByDisplayValue('4'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Cool Down' }))

    fireEvent.click(screen.getByText('Build Workout'))

    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0]![0] as Array<{ type: string }>
    expect(saved).toHaveLength(5)
    expect(saved[0]!.type).toBe('prepare')
    expect(saved[1]!.type).toBe('work')
    expect(saved[2]!.type).toBe('rest')
    expect(saved[3]!.type).toBe('work')
    expect(saved[4]!.type).toBe('cooldown')
  })
})

// ===========================================================================
// Component: DnD reorder
// ===========================================================================
describe('WorkoutBuilder reorder', () => {
  /** Get block title/name inputs — only inputs with aria-label ending in 'title' or 'name'. */
  function getBlockTitles() {
    const list = screen.getByRole('list')
    return within(list).getAllByRole('textbox').filter((el) => {
      const label = el.getAttribute('aria-label') ?? ''
      return label.endsWith('title') || label.endsWith('name')
    })
  }

  it('reorders items by drag and drop', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    const onSave = vi.fn()
    render(<WorkoutBuilder onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Prepare' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Work' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Cool Down' }))

    const titles = getBlockTitles()
    expect(titles[0]).toHaveValue('Prepare')
    expect(titles[1]).toHaveValue('Work')
    expect(titles[2]).toHaveValue('Cool Down')

    const handles = screen.getAllByLabelText(/Drag to reorder/)
    fireEvent.dragStart(handles[1]!)
    fireEvent.dragOver(handles[0]!)
    fireEvent.drop(handles[0]!)

    const after = getBlockTitles()
    expect(after[0]).toHaveValue('Work')
    expect(after[1]).toHaveValue('Prepare')
    expect(after[2]).toHaveValue('Cool Down')
  })

  it('moves a Cycle as a single unit via reorder', async () => {
    const WorkoutBuilder = (await import('../WorkoutBuilder')).default
    const onSave = vi.fn()
    render(<WorkoutBuilder onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Work' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Cycle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Cool Down' }))

    const titles = getBlockTitles()
    expect(titles[0]).toHaveValue('Work')
    expect(titles[1]).toHaveValue('Cycle')
    expect(titles[2]).toHaveValue('Cool Down')

    const handles = screen.getAllByLabelText(/Drag to reorder/)
    fireEvent.dragStart(handles[1]!)
    fireEvent.dragOver(handles[0]!)
    fireEvent.drop(handles[0]!)

    const items = getBlockTitles()
    expect(items[0]).toHaveValue('Cycle')
    expect(items[1]).toHaveValue('Work')
    expect(items[2]).toHaveValue('Cool Down')
  })
})
