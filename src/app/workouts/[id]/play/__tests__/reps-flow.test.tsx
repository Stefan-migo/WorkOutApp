import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { Workout, WorkoutMode } from '@/types/workout'

// ─── Module-level mocks (same pattern as page.test.tsx) ──────────
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
let capturedOnComplete: (() => void) | undefined
const mockTimer = {
  status: 'running' as const,
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
const repsWorkout: Workout = {
  id: 'w1',
  title: 'Strength Day',
  mode: 'reps' as WorkoutMode,
  intervals: [
    { id: 'r1', type: 'prepare', title: 'Warmup', duration: 60 },
    { id: 'r2', type: 'work', title: 'Bench Press', duration: 0, exerciseId: 'ex1', reps: 10, weight: 80 },
    { id: 'r3', type: 'rest', title: 'Rest', duration: 90 },
    { id: 'r4', type: 'work', title: 'Squat', duration: 0, exerciseId: 'ex2', reps: 8 },
    { id: 'r5', type: 'cooldown', title: 'Stretch', duration: 60 },
  ],
  createdAt: 0,
  updatedAt: 0,
}

const legacyWorkout: Workout = {
  id: 'w1',
  title: 'Morning HIIT',
  mode: 'timed' as WorkoutMode,
  intervals: [
    { id: 'l1', type: 'prepare', title: 'Warmup', duration: 60 },
    { id: 'l2', type: 'work', title: 'Sprints', duration: 30 },
    { id: 'l3', type: 'cooldown', title: 'Stretch', duration: 60 },
  ],
  createdAt: 0,
  updatedAt: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
  capturedOnComplete = undefined
  mockTimer.status = 'running'
  mockTimer.timeLeft = 60
  mockTimer.progress = 0
  mockWorkouts = []
  mockExercisesData = []
})

afterEach(cleanup)

// ===========================================================================
// Integration: Reps mode flow
// ===========================================================================
describe('Reps mode integration', () => {
  /** Advance past the first timed interval to reach reps work. */
  async function skipWarmup() {
    mockTimer.timeLeft = 10
    await waitFor(() => expect(screen.getByLabelText('Skip interval')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Skip interval'))
    // Now on Bench Press (reps work)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument()
    })
  }

  // ── Scenario 1 ──────────────────────────────────────────────────
  it('shows RepCounter for reps work interval instead of timer controls', async () => {
    mockWorkouts = [repsWorkout]
    mockExercisesData = [{ id: 'ex1', name: 'Bench Press', category: 'strength' as const, createdAt: 0, updatedAt: 0 }]

    const Page = (await import('../page')).default
    render(<Page />)
    fireEvent.click(screen.getByText('Start'))

    await skipWarmup()

    // RepCounter shows exercise name, target reps, weight, Complete button
    // ExercisePanel also shows the name — use getAllByText for duplicates
    expect(screen.getAllByText('Bench Press').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText(/80/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument()
    // No timer controls during reps work
    expect(screen.queryByLabelText('Pause')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Skip interval')).not.toBeInTheDocument()
  })

  // ── Scenario 2 ──────────────────────────────────────────────────
  it('opens RepCompleteDialog on Complete click', async () => {
    mockWorkouts = [repsWorkout]
    mockExercisesData = [{ id: 'ex1', name: 'Bench Press', category: 'strength' as const, createdAt: 0, updatedAt: 0 }]

    const Page = (await import('../page')).default
    render(<Page />)
    fireEvent.click(screen.getByText('Start'))

    await skipWarmup()
    fireEvent.click(screen.getByRole('button', { name: /complete/i }))

    // Dialog with default reps and weight
    await waitFor(() => {
      expect(screen.getByLabelText(/how many reps did you complete/i)).toBeInTheDocument()
      expect((screen.getByLabelText(/how many reps did you complete/i) as HTMLInputElement).value).toBe('10')
      expect((screen.getByLabelText(/weight \(kg\)/i) as HTMLInputElement).value).toBe('80')
    })
  })

  // ── Scenario 3 ──────────────────────────────────────────────────
  it('confirm with more reps: actualReps > plannedReps', async () => {
    mockWorkouts = [repsWorkout]
    mockExercisesData = [{ id: 'ex1', name: 'Bench Press', category: 'strength' as const, createdAt: 0, updatedAt: 0 }]

    const Page = (await import('../page')).default
    render(<Page />)
    fireEvent.click(screen.getByText('Start'))

    await skipWarmup()
    fireEvent.click(screen.getByRole('button', { name: /complete/i }))

    // Set actual reps to 12 (planned was 10)
    await waitFor(() => {
      const repsInput = screen.getByLabelText(/how many reps did you complete/i)
      fireEvent.change(repsInput, { target: { value: '12' } })
    })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    // Complete the rest, remaining work, and cooldown to trigger session save
    mockTimer.timeLeft = 85
    await waitFor(() => expect(screen.getByLabelText('Skip interval')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Skip interval'))

    // Squat (reps work)
    await waitFor(() => expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /complete/i }))
    await waitFor(() => expect(screen.getByLabelText(/how many reps did you complete/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    // Stretch (timed cooldown)
    mockTimer.timeLeft = 55
    await waitFor(() => expect(screen.getByLabelText('Skip interval')).toBeInTheDocument())
    act(() => { capturedOnComplete?.() })

    await waitFor(() => {
      expect(mockAddSession).toHaveBeenCalled()
      const session = mockAddSession.mock.calls[0]?.[0]
      const bp = session?.intervals.find((i: { intervalId: string }) => i.intervalId === 'r2')
      expect(bp).toBeDefined()
      expect(bp.plannedReps).toBe(10)
      expect(bp.actualReps).toBe(12)
      expect(bp.actualReps).toBeGreaterThan(bp.plannedReps)
    })
  })

  // ── Scenario 4 ──────────────────────────────────────────────────
  it('rest interval in reps mode shows addTime buttons', async () => {
    mockWorkouts = [repsWorkout]
    mockExercisesData = [{ id: 'ex1', name: 'Bench Press', category: 'strength' as const, createdAt: 0, updatedAt: 0 }]

    const Page = (await import('../page')).default
    render(<Page />)
    fireEvent.click(screen.getByText('Start'))

    await skipWarmup()
    fireEvent.click(screen.getByRole('button', { name: /complete/i }))
    await waitFor(() => expect(screen.getByLabelText(/how many reps did you complete/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    // Now on Rest interval — should show addTime buttons
    await waitFor(() => {
      expect(screen.getByText('+10s')).toBeInTheDocument()
      expect(screen.getByText('+20s')).toBeInTheDocument()
      expect(screen.getByText('+30s')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+20s'))
    expect(mockTimer.addTime).toHaveBeenCalledWith(20)
  })

  // ── Scenario 5 ──────────────────────────────────────────────────
  it('Skip in RepCompleteDialog advances without saving actualReps', async () => {
    mockWorkouts = [repsWorkout]
    mockExercisesData = [{ id: 'ex1', name: 'Bench Press', category: 'strength' as const, createdAt: 0, updatedAt: 0 }]

    const Page = (await import('../page')).default
    render(<Page />)
    fireEvent.click(screen.getByText('Start'))

    await skipWarmup()
    fireEvent.click(screen.getByRole('button', { name: /complete/i }))
    await waitFor(() => expect(screen.getByLabelText(/how many reps did you complete/i)).toBeInTheDocument())

    // Click Skip in dialog
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))

    // Advances to Rest interval
    await waitFor(() => {
      expect(screen.getByText('Rest')).toBeInTheDocument()
    })
  })

  // ── Scenario 6 ──────────────────────────────────────────────────
  it('legacy timed workout plays normal timer flow (no RepCounter)', async () => {
    mockWorkouts = [legacyWorkout]
    mockTimer.timeLeft = 60

    const Page = (await import('../page')).default
    render(<Page />)
    fireEvent.click(screen.getByText('Start'))

    await waitFor(() => {
      expect(screen.getByLabelText('Pause')).toBeInTheDocument()
    })
    // Pause + Skip are timer controls — no RepCounter
    expect(screen.getByLabelText('Skip interval')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument()
  })
})
