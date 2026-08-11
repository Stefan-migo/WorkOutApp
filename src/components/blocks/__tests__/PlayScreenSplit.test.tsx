import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { PlayScreenSplit } from '../PlayScreenSplit'
import type { IntervalType } from '@/types/workout'
import type { TimerStatus } from '@/hooks/useTimer'

afterEach(cleanup)

// PlayScreenSplit mirrors the PlayScreen contract (DD-3): strictly
// presentational, props in/callbacks out, composes TimerRing + TimerControls +
// ProgressBar + RepCounter and never TimerDisplay. Layout split: with
// `imageUrl` the context row (name + Set counter) lives on the image panel
// overlay; without it the flat PlayScreen structure renders verbatim.
type PlayScreenSplitProps = Parameters<typeof PlayScreenSplit>[0]

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

function renderScreen(overrides: Partial<PlayScreenSplitProps> = {}) {
  const props = { ...TIMED_PROPS, ...overrides }
  const { container } = render(<PlayScreenSplit {...props} />)
  return { ...props, container }
}

describe('PlayScreenSplit', () => {
  it('renders the timer surfaces: ring, controls, progress bar, set row', () => {
    renderScreen()

    // Flat fallback mirrors PlayScreen: label in the top h2 AND in TimerRing
    expect(screen.getByText('00:45')).toBeInTheDocument()
    expect(screen.getAllByText('Work')).toHaveLength(2)
    expect(screen.getByRole('heading', { level: 2, name: 'Work' })).toBeInTheDocument()
    expect(screen.getByText('Next: Rest')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
    expect(screen.getByText('Set 1 of 4')).toBeInTheDocument()
  })

  it('renders remaining time from timeLeft and progress from progressPercent (triangulation)', () => {
    renderScreen({ timeLeft: 5, progressPercent: 25, totalProgress: 0.25 })

    expect(screen.getByText('00:05')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('renders the set row from setIndex/setCount (triangulation)', () => {
    renderScreen({ setIndex: 3 })

    expect(screen.getByText('Set 4 of 4')).toBeInTheDocument()
  })

  it('paused status exposes Resume and hides Pause', () => {
    renderScreen({ status: 'paused' })

    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('reps mode swaps in RepCounter and drops the timed controls', () => {
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
    expect(screen.queryByText('00:45')).not.toBeInTheDocument()
  })

  it('never composes TimerDisplay', () => {
    renderScreen()

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

  it('Add time buttons render and fire onAddTime when showAddTime', () => {
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

  it('renders the image panel when imageUrl is provided', () => {
    const { container } = renderScreen({ imageUrl: 'https://example.com/bench.jpg' })

    const imageLayer = container.querySelector('[style*="background-image"]')
    expect(imageLayer).toBeInTheDocument()
    expect(imageLayer).toHaveAttribute('aria-hidden', 'true')
  })

  it('progressVariant="futuristic" renders the progressbar with an accent fill', () => {
    const { container } = renderScreen({ progressVariant: 'futuristic' })

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
    expect(container.querySelector('[style*="width: 62%"]')).toHaveClass('bg-accent')
  })

  it('default (no progressVariant) renders the futuristic bar with a bg-accent fill', () => {
    const { container } = renderScreen()

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
    expect(container.querySelector('[style*="width: 62%"]')).toHaveClass('bg-accent')
  })

  it('progressVariant="segmented" renders exactly 20 cells inside the block', () => {
    renderScreen({ progressVariant: 'segmented' })

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
    expect(screen.getByRole('progressbar').children).toHaveLength(20)
  })

  it('renders no image layer and keeps the h2 name in the top context row without imageUrl', () => {
    const { container } = renderScreen({ exerciseName: 'Bench Press' })

    expect(container.querySelector('[style*="background-image"][aria-hidden="true"]')).not.toBeInTheDocument()
    // getByText throws on multiple matches -> uniqueness asserted
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Bench Press' })).toBeInTheDocument()
  })

  it('timed with image: exerciseName renders as h2 on the overlay; label stays only in TimerRing', () => {
    renderScreen({ imageUrl: 'https://example.com/bench.jpg', exerciseName: 'Bench Press' })

    expect(screen.getByRole('heading', { level: 2, name: 'Bench Press' })).toBeInTheDocument()
    // No top-row h2 duplicate: 'Work' appears only inside TimerRing
    expect(screen.getAllByText('Work')).toHaveLength(1)
    // Set row moves onto the image overlay
    expect(screen.getByText('Set 1 of 4')).toBeInTheDocument()
  })

  it('reps mode renders the exercise name once (overlay hidden, RepCounter owns it)', () => {
    renderScreen({
      isRepsMode: true,
      exerciseName: 'Bench Press',
      reps: 10,
      weight: 60,
      onComplete: vi.fn(),
      imageUrl: 'https://example.com/bench.jpg',
    })

    expect(screen.getAllByText('Bench Press')).toHaveLength(1)
  })
})
