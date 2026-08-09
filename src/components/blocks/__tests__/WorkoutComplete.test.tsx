import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { WorkoutComplete } from '../WorkoutComplete'

afterEach(cleanup)

// WB-4 contract (DD-4): title (default + custom), summary (N intervals,
// total time), Play Again (primary) + Back Home (ghost) actions.
type WorkoutCompleteProps = Parameters<typeof WorkoutComplete>[0]

function renderComplete(overrides: Partial<WorkoutCompleteProps> = {}) {
  const props = {
    intervals: 8,
    totalTimeMinutes: 42,
    onPlayAgain: vi.fn(),
    onBackHome: vi.fn(),
    ...overrides,
  }
  render(<WorkoutComplete {...props} />)
  return props
}

describe('WorkoutComplete (WB-4)', () => {
  it('renders the default title and summary with interval count and total time (WB-4 scenario)', () => {
    renderComplete()

    expect(screen.getByRole('heading', { level: 1, name: 'Workout Complete!' })).toBeInTheDocument()
    expect(screen.getByText('8 intervals completed')).toBeInTheDocument()
    expect(screen.getByText('Total time: 42 min')).toBeInTheDocument()
  })

  it('pluralizes "1 interval" (triangulation)', () => {
    renderComplete({ intervals: 1 })

    expect(screen.getByText('1 interval completed')).toBeInTheDocument()
  })

  it('renders the supplied summary values (triangulation)', () => {
    renderComplete({ intervals: 3, totalTimeMinutes: 7 })

    expect(screen.getByText('3 intervals completed')).toBeInTheDocument()
    expect(screen.getByText('Total time: 7 min')).toBeInTheDocument()
  })

  it('renders a custom title when provided', () => {
    renderComplete({ title: 'Great job!' })

    expect(screen.getByRole('heading', { level: 1, name: 'Great job!' })).toBeInTheDocument()
  })

  it('fires onPlayAgain from Play Again and not onBackHome', () => {
    const { onPlayAgain, onBackHome } = renderComplete()

    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }))
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
    expect(onBackHome).not.toHaveBeenCalled()
  })

  it('fires onBackHome from Back Home', () => {
    const { onBackHome } = renderComplete()

    fireEvent.click(screen.getByRole('button', { name: 'Back Home' }))
    expect(onBackHome).toHaveBeenCalledTimes(1)
  })
})
