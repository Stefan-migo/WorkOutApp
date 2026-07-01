import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mockPush = vi.fn()
const mockSaveWorkout = vi.fn()
const mockGetExercise = vi.fn()
const mockSearchParams: Record<string, string> = {}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
}))

vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ saveWorkout: mockSaveWorkout }),
}))

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({ getExercise: mockGetExercise }),
}))

vi.mock('@/components/WorkoutEditor', () => ({
  default: ({ initialIntervals }: { initialIntervals?: { title?: string }[] }) => (
    <div data-testid="workout-editor">
      {initialIntervals?.length
        ? initialIntervals.map((i, idx) => <span key={idx}>{i.title}</span>)
        : <span data-testid="no-intervals">empty</span>
      }
    </div>
  ),
  buildExerciseInterval: (ex: { name: string; id: string }) => ({
    title: ex.name,
    exerciseId: ex.id,
    type: 'work',
    duration: 60,
  }),
}))

beforeEach(() => {
  Object.keys(mockSearchParams).forEach(k => delete mockSearchParams[k])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('NewWorkoutPage', () => {
  it('renders empty workout when no exerciseId param', async () => {
    const NewWorkoutPage = (await import('../page')).default
    render(<NewWorkoutPage />)
    expect(screen.getByTestId('no-intervals')).toBeInTheDocument()
  })

  it('renders empty workout when exerciseId is invalid', async () => {
    mockSearchParams['exerciseId'] = 'nonexistent'
    mockGetExercise.mockReturnValue(undefined)
    const NewWorkoutPage = (await import('../page')).default
    render(<NewWorkoutPage />)
    expect(screen.getByTestId('no-intervals')).toBeInTheDocument()
  })

  it('renders initialIntervals when exerciseId is valid', async () => {
    mockSearchParams['exerciseId'] = 'ex1'
    mockGetExercise.mockReturnValue({ id: 'ex1', name: 'Push Up', category: 'strength', createdAt: 1, updatedAt: 1 })
    const NewWorkoutPage = (await import('../page')).default
    render(<NewWorkoutPage />)
    expect(screen.getByText('Push Up')).toBeInTheDocument()
  })

  it('calls getExercise with the correct exerciseId', async () => {
    mockSearchParams['exerciseId'] = 'ex1'
    mockGetExercise.mockReturnValue({ id: 'ex1', name: 'Push Up', category: 'strength', createdAt: 1, updatedAt: 1 })
    const NewWorkoutPage = (await import('../page')).default
    render(<NewWorkoutPage />)
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(mockGetExercise).toHaveBeenCalledWith('ex1')
  })
})
