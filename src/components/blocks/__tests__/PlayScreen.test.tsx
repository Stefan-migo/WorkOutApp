import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { PlayScreen } from '../PlayScreen'
import type { IntervalType } from '@/types/workout'
import type { TimerStatus } from '@/hooks/useTimer'

afterEach(cleanup)

// WB-3 contract (DD-3). PlayScreen is strictly presentational: props in,
// callbacks out. It composes TimerRing + TimerControls + ProgressBar +
// RepCounter (reps branch) and MUST NOT compose TimerDisplay.
type PlayScreenProps = Parameters<typeof PlayScreen>[0]

const TIMED_PROPS = {
  timeLeft: 45,
  duration: 60,
  intervalType: 'work' as IntervalType,
  label: 'Work',
  nextLabel: 'Next: Rest',
  status: 'running' as TimerStatus,
  onPause: vi.fn(),
  onResume: vi.fn(),
  onSkip: vi.fn(),
  onRestart: vi.fn(),
  setIndex: 0,
  setCount: 4,
  totalProgress: 0.62,
  progressPercent: 62,
  isRepsMode: false,
}

function renderScreen(overrides: Partial<PlayScreenProps> = {}) {
  const props = { ...TIMED_PROPS, ...overrides }
  render(<PlayScreen {...props} />)
  return props
}

describe('PlayScreen (WB-3)', () => {
  it('renders the 4 timer surfaces: ring, controls, progress bar, set row (WB-3a)', () => {
    renderScreen()

    // Ring: label (also mirrored in the left title-only panel -> 2) + time
    expect(screen.getByText('0:45')).toBeInTheDocument()
    expect(screen.getAllByText('Work')).toHaveLength(2)
    expect(screen.getByRole('heading', { level: 2, name: 'Work' })).toBeInTheDocument()
    // Next label forwarded (WB-3b prop mirror)
    expect(screen.getByText('Next: Rest')).toBeInTheDocument()

    // Controls: running -> Pause
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()

    // Progress bar
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')

    // Set row
    expect(screen.getByText('Set 1 of 4')).toBeInTheDocument()
  })

  it('renders remaining time from timeLeft and progress from progressPercent (triangulation)', () => {
    renderScreen({ timeLeft: 5, progressPercent: 25, totalProgress: 0.25 })

    expect(screen.getByText('0:05')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('renders the set row from setIndex/setCount (triangulation)', () => {
    renderScreen({ setIndex: 3 })

    expect(screen.getByText('Set 4 of 4')).toBeInTheDocument()
  })

  it('paused status exposes Resume and hides Pause (WB-3 paused scenario)', () => {
    renderScreen({ status: 'paused' })

    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('reps mode swaps in RepCounter and drops the timed controls (WB-3c)', () => {
    renderScreen({
      isRepsMode: true,
      exerciseName: 'Bench Press',
      reps: 10,
      weight: 60,
      onComplete: vi.fn(),
    })

    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete set' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
    expect(screen.queryByText('0:45')).not.toBeInTheDocument()
  })

  it('never composes TimerDisplay (WB-3d)', () => {
    renderScreen()

    // TimerDisplay is the only component with role="timer" + aria-live
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument()
  })

  it('Pause click fires onPause; Resume click fires onResume', () => {
    const running = renderScreen()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(running.onPause).toHaveBeenCalledTimes(1)

    const paused = renderScreen({ status: 'paused' })
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(paused.onResume).toHaveBeenCalledTimes(1)
  })

  it('Skip click fires onSkip', () => {
    const { onSkip } = renderScreen()

    fireEvent.click(screen.getByRole('button', { name: 'Skip interval' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('Add time buttons render and fire onAddTime when showAddTime (WB-3b)', () => {
    const { onAddTime } = renderScreen({ showAddTime: true, onAddTime: vi.fn() })

    fireEvent.click(screen.getByRole('button', { name: 'Add 10 seconds' }))
    expect(onAddTime).toHaveBeenCalledWith(10)
    fireEvent.click(screen.getByRole('button', { name: 'Add 30 seconds' }))
    expect(onAddTime).toHaveBeenCalledWith(30)
  })

  it('reps mode Complete fires onComplete', () => {
    const onComplete = vi.fn()
    renderScreen({
      isRepsMode: true,
      exerciseName: 'Squat',
      reps: 8,
      onComplete,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Complete set' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
