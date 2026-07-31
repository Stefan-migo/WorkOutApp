import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { Workout, Sequence, WorkoutMode } from '@/types/workout'

// ─── Module-level mocks ────────────────────────────────────────────
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'seq1' }),
}))

let mockWorkouts: any[] = []
vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ workouts: mockWorkouts }),
}))

let mockSequence: Sequence | undefined
const mockGetSequence = vi.fn().mockImplementation(async () => mockSequence)
vi.mock('@/hooks/useSequences', () => ({
  useSequences: () => ({ getSequence: mockGetSequence }),
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

vi.mock('@/lib/sequence-engine', () => ({
  getTotalRounds: (seq: Sequence) => seq.workoutIds.length * seq.repeatCount,
  getRoundAt: () => ({ workoutId: 'w1' }),
  getProgress: () => ({ current: 0, total: 10, percent: 0 }),
}))

// ─── Controllable useTimer mock ────────────────────────────────────
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
const repsWorkout: Workout = {
  id: 'w1',
  title: 'Strength Day',
  mode: 'reps' as WorkoutMode,
  intervals: [
    { id: 'r1', type: 'prepare', title: 'Warmup', duration: 60 },
    { id: 'r2', type: 'work', title: 'Bench Press', duration: 0, reps: 10 },
    { id: 'r3', type: 'rest', title: 'Rest', duration: 90 },
    { id: 'r4', type: 'cooldown', title: 'Stretch', duration: 60 },
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

afterEach(cleanup)

describe('PlaySequencePage — reps mode fallback', () => {
  it('renders Start screen for a sequence with a reps-mode workout', async () => {
    mockSequence = {
      id: 'seq1', title: 'Strength Circuit',
      workoutIds: ['w1'], repeatCount: 1, createdAt: 0, updatedAt: 0,
    }
    mockWorkouts = [repsWorkout]

    const Page = (await import('../page')).default
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Start Sequence')).toBeInTheDocument()
    })
  })

  it('shows timer controls when playing a reps-mode workout in a sequence', async () => {
    mockSequence = {
      id: 'seq1', title: 'Strength Circuit',
      workoutIds: ['w1'], repeatCount: 1, createdAt: 0, updatedAt: 0,
    }
    mockWorkouts = [repsWorkout]
    mockTimer.status = 'running'
    mockTimer.timeLeft = 60

    const Page = (await import('../page')).default
    render(<Page />)

    await waitFor(() => expect(screen.getByText('Start Sequence')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Start Sequence'))

    await waitFor(() => {
      expect(screen.getByLabelText('Pause')).toBeInTheDocument()
    })
    expect(mockTimer.start).toHaveBeenCalled()
  })

  it('gracefully navigates from timed to 0-duration reps interval without crash', async () => {
    mockSequence = {
      id: 'seq1', title: 'Strength Circuit',
      workoutIds: ['w1'], repeatCount: 1, createdAt: 0, updatedAt: 0,
    }
    mockWorkouts = [repsWorkout]
    mockTimer.status = 'running'
    mockTimer.timeLeft = 60

    const Page = (await import('../page')).default
    render(<Page />)

    await waitFor(() => expect(screen.getByText('Start Sequence')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Start Sequence'))

    // Wait for Warmup timer (duration 60)
    await waitFor(() => expect(screen.getByLabelText('Pause')).toBeInTheDocument())

    // Simulate Warmup completion — advances to Bench Press (duration 0)
    act(() => { capturedOnComplete?.() })

    // ponytail: reps fallback ensures the page shows Bench Press with timer controls
    // instead of crashing or flashing through to Rest
    await waitFor(() => {
      expect(screen.getAllByText('Bench Press').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByLabelText('Pause')).toBeInTheDocument()
    })
  })
})
