import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { createInterval, buildExerciseInterval } from '../WorkoutEditor'
import type { Interval } from '@/types/workout'
import type { Exercise } from '@/types/workout'

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({ exercises: [] }),
}))
vi.mock('@/components/TimelineStrip', () => ({
  TimelineStrip: () => null,
}))
vi.mock('@/components/IntervalDetailSheet', () => ({
  default: () => null,
}))
vi.mock('@/lib/segment-styles', () => ({
  SEGMENT_BG: { prepare: '', work: '', rest: '', cooldown: '' },
  SEGMENT_TEXT: { prepare: '', work: '', rest: '', cooldown: '' },
  SEGMENT_DOT: { prepare: '', work: '', rest: '', cooldown: '' },
  TYPE_ICONS: { prepare: '', work: '', rest: '', cooldown: '' },
}))
vi.mock('@/components/IntervalRow', () => ({
  IntervalRow: ({ interval }: { interval: Interval }) => <div data-testid="interval-row">{interval.title}</div>,
}))

describe('createInterval', () => {
  it('creates work interval with default title "Work" and default duration 30', () => {
    const interval = createInterval('work')
    expect(interval.type).toBe('work')
    expect(interval.title).toBe('Work')
    expect(interval.duration).toBe(30)
  })

  it('creates prepare interval with default title "Prepare" and default duration 180 (3 min)', () => {
    const interval = createInterval('prepare')
    expect(interval.type).toBe('prepare')
    expect(interval.title).toBe('Prepare')
    expect(interval.duration).toBe(180)
  })

  it('creates rest interval with default title "Rest" and default duration 30', () => {
    const interval = createInterval('rest')
    expect(interval.type).toBe('rest')
    expect(interval.title).toBe('Rest')
    expect(interval.duration).toBe(30)
  })

  it('creates cooldown interval with default title "Cooldown" and default duration 120 (2 min)', () => {
    const interval = createInterval('cooldown')
    expect(interval.type).toBe('cooldown')
    expect(interval.title).toBe('Cooldown')
    expect(interval.duration).toBe(120)
  })

  it('generates ID matching int-{number} pattern', () => {
    const interval = createInterval('work')
    expect(interval.id).toMatch(/^int-\d+$/)
  })
})

afterEach(cleanup)

describe('buildExerciseInterval', () => {
  const pushUp: Exercise = {
    id: 'ex1', name: 'Push Up', category: 'strength',
    createdAt: 1, updatedAt: 1,
  }

  it('creates a work interval with exercise name as title', () => {
    const interval = buildExerciseInterval(pushUp)
    expect(interval.title).toBe('Push Up')
  })

  it('sets type to work', () => {
    const interval = buildExerciseInterval(pushUp)
    expect(interval.type).toBe('work')
  })

  it('sets default duration to 60', () => {
    const interval = buildExerciseInterval(pushUp)
    expect(interval.duration).toBe(60)
  })

  it('sets exerciseId from the exercise', () => {
    const interval = buildExerciseInterval(pushUp)
    expect(interval.exerciseId).toBe('ex1')
  })

  it('generates a unique ID with int- prefix', () => {
    const interval = buildExerciseInterval(pushUp)
    expect(interval.id).toMatch(/^int-\d+$/)
  })
})

describe('WorkoutEditor initialIntervals', () => {
  it('renders initialIntervals when no existingWorkout', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const intervals: Interval[] = [
      { id: 'w1', type: 'work', title: 'Push Up', duration: 60, exerciseId: 'ex1' },
    ]
    render(<WorkoutEditor initialIntervals={intervals} onSave={vi.fn()} />)
    expect(screen.getByText('Push Up')).toBeInTheDocument()
  })

  it('shows no-intervals message when initialIntervals is empty', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    render(<WorkoutEditor initialIntervals={[]} onSave={vi.fn()} />)
    expect(screen.getByText('No intervals yet')).toBeInTheDocument()
  })

  it('prioritizes existingWorkout intervals over initialIntervals', async () => {
    const WorkoutEditor = (await import('../WorkoutEditor')).default
    const initial: Interval[] = [
      { id: 'init1', type: 'work', title: 'From Initial', duration: 60 },
    ]
    const existing = {
      id: 'w1',
      title: 'Existing',
      intervals: [
        { id: 'ex1', type: 'work' as const, title: 'From Existing', duration: 30 },
      ],
      createdAt: 1,
      updatedAt: 1,
    }
    render(<WorkoutEditor existingWorkout={existing} initialIntervals={initial} onSave={vi.fn()} />)
    expect(screen.getByText('From Existing')).toBeInTheDocument()
    expect(screen.queryByText('From Initial')).not.toBeInTheDocument()
  })
})
