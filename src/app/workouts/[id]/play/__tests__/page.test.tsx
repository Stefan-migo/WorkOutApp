import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { Workout } from '@/types/workout'

// ─── Module-level mocks ────────────────────────────────────────────
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'w1' }),
}))

let mockWorkouts: any[] = []
vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ workouts: mockWorkouts }),
}))

const mockAddSession = vi.fn()
vi.mock('@/hooks/useSessions', () => ({
  useSessions: () => ({ addSession: mockAddSession, sessions: [] }),
}))

vi.mock('@/hooks/useBeep', () => ({
  useBeep: () => ({ beep: vi.fn() }),
}))

vi.mock('@/hooks/useIntervalNotification', () => ({
  useIntervalNotification: () => ({ notify: vi.fn() }),
}))

let mockExercisesData: any[] = []
const mockGetExerciseImages = vi.fn().mockResolvedValue([])
vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({ exercises: mockExercisesData, getExerciseImages: mockGetExerciseImages }),
}))

// ─── Controllable useTimer mock ────────────────────────────────────
// ponytail: captures onComplete so tests can trigger natural completion directly
let capturedOnComplete: (() => void) | undefined
const mockTimer = {
  status: 'idle' as 'idle' | 'running' | 'paused' | 'complete',
  timeLeft: 0,
  progress: 0,
  start: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  skip: vi.fn(() => { capturedOnComplete?.() }),
  addTime: vi.fn(),
  reset: vi.fn(),
}

vi.mock('@/hooks/useTimer', () => ({
  useTimer: (_duration: number, onComplete?: () => void) => {
    capturedOnComplete = onComplete
    return mockTimer
  },
}))

// ─── Test data ──────────────────────────────────────────────────────
const mockWorkout: Workout = {
  id: 'w1',
  title: 'Morning HIIT',
  intervals: [
    { id: 'i1', type: 'prepare', title: 'Warmup', duration: 60 },
    { id: 'i2', type: 'work', title: 'Sprints', duration: 30, exerciseId: 'ex1' },
    { id: 'i3', type: 'cooldown', title: 'Stretch', duration: 60 },
  ],
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
  capturedOnComplete = undefined
  mockTimer.status = 'idle'
  mockTimer.timeLeft = 60
  mockTimer.progress = 0
  mockWorkouts = []
  mockExercisesData = []
})

afterEach(() => {
  cleanup()
})

describe('PlayWorkoutPage', () => {
  it('shows workout not found when workout is not in list', async () => {
    mockWorkouts = []
    const Page = (await import('../page')).default
    render(<Page />)

    expect(screen.getByText('Workout not found')).toBeInTheDocument()
    expect(screen.getByText(/back to workouts/i)).toBeInTheDocument()
  })

  describe('idle phase', () => {
    it('renders workout title, interval count, and Start button', async () => {
      mockWorkouts = [mockWorkout]
      const Page = (await import('../page')).default
      render(<Page />)

      // The title appears in both PlayHeader and the idle <h1> — target the main headline
      const headlines = screen.getAllByText('Morning HIIT')
      expect(headlines.length).toBeGreaterThanOrEqual(1)
      // Interval count text in idle summary
      expect(screen.getByText(/3 intervals/)).toBeInTheDocument()
      // Start button
      expect(screen.getByText('Start')).toBeInTheDocument()
    })
  })

  describe('Start click transitions to active', () => {
    it('calls timer.start and renders timer ring + controls', async () => {
      mockWorkouts = [mockWorkout]
      mockTimer.status = 'running'
      mockTimer.timeLeft = 60

      const Page = (await import('../page')).default
      render(<Page />)

      fireEvent.click(screen.getByText('Start'))

      // handleStart → setPhase('active') → useEffect → timer.start()
      expect(mockTimer.start).toHaveBeenCalled()

      // Active phase renders TimerRing + controls
      await waitFor(() => {
        expect(screen.getByLabelText('Pause')).toBeInTheDocument()
        expect(screen.getByLabelText('Skip interval')).toBeInTheDocument()
      })
    })
  })

  describe('skip captures partial duration', () => {
    it('captures actualDuration when skip is clicked', async () => {
      mockWorkouts = [mockWorkout]
      mockTimer.status = 'running'
      mockTimer.timeLeft = 45 // 15s elapsed of 60s warmup

      const Page = (await import('../page')).default
      render(<Page />)

      fireEvent.click(screen.getByText('Start'))

      // Skip the first interval
      await waitFor(() => expect(screen.getByLabelText('Skip interval')).toBeInTheDocument())
      fireEvent.click(screen.getByLabelText('Skip interval'))

      // After skip, onComplete fires → currentIdx advances → useEffect calls timer.start again
      await waitFor(() => {
        expect(mockTimer.start).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('last interval completion saves session and redirects', () => {
    async function skipToLastInterval() {
      // Start the workout
      fireEvent.click(screen.getByText('Start'))

      // Skip first interval (Warmup, idx 0 → 1)
      mockTimer.timeLeft = 15
      await waitFor(() => expect(screen.getByLabelText('Skip interval')).toBeInTheDocument())
      fireEvent.click(screen.getByLabelText('Skip interval'))

      // Wait for re-render, then skip second (Sprints, idx 1 → 2)
      mockTimer.timeLeft = 5
      await waitFor(() => expect(mockTimer.start).toHaveBeenCalledTimes(2))
      fireEvent.click(screen.getByLabelText('Skip interval'))

      // Now on last interval (Stretch, idx 2)
      await waitFor(() => expect(mockTimer.start).toHaveBeenCalledTimes(3))
    }

    it('natural completion on last interval calls addSession and redirects', async () => {
      mockWorkouts = [mockWorkout]
      mockExercisesData = [{ id: 'ex1', name: 'Sprints', category: 'strength' as const, createdAt: 0, updatedAt: 0 }]
      mockTimer.status = 'running'

      const Page = (await import('../page')).default
      render(<Page />)

      await skipToLastInterval()

      // Trigger onComplete directly (natural completion, not via skip)
      act(() => { capturedOnComplete?.() })

      // Phase becomes 'complete' → session saved + redirect
      await waitFor(() => {
        expect(mockAddSession).toHaveBeenCalledTimes(1)
      })

      const sessionArg = mockAddSession.mock.calls[0]?.[0]
      expect(sessionArg).toBeDefined()
      expect(sessionArg.type).toBe('workout')
      expect(sessionArg.workoutId).toBe('w1')
      // Last interval (Stretch) completed naturally → full duration
      const lastInterval = sessionArg.intervals.find(
        (i: { intervalId: string }) => i.intervalId === 'i3',
      )
      expect(lastInterval).toBeDefined()
      expect(lastInterval.actualDuration).toBe(60)
      expect(lastInterval.completed).toBe(true)

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/history/'))
    })

    it('last interval skip also saves partial session and redirects', async () => {
      mockWorkouts = [mockWorkout]
      mockTimer.status = 'running'

      const Page = (await import('../page')).default
      render(<Page />)

      await skipToLastInterval()

      // Skip the last interval (Stretch, idx 2 → complete)
      mockTimer.timeLeft = 30
      fireEvent.click(screen.getByLabelText('Skip interval'))

      await waitFor(() => {
        expect(mockAddSession).toHaveBeenCalledTimes(1)
      })

      const sessionArg = mockAddSession.mock.calls[0]?.[0]
      expect(sessionArg).toBeDefined()
      const lastInterval = sessionArg.intervals.find(
        (i: { intervalId: string }) => i.intervalId === 'i3',
      )
      expect(lastInterval).toBeDefined()
      expect(lastInterval.actualDuration).toBe(30) // 60 - 30 = 30
      expect(lastInterval.completed).toBe(false)

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/history/'))
    })
  })
})
