import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mockPush = vi.fn()
const mockExercises = [
  { id: 'ex1', name: 'Push Up', category: 'strength', createdAt: 1, updatedAt: 1 },
  { id: 'ex2', name: 'Squat', category: 'strength', createdAt: 2, updatedAt: 2 },
]

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({
    exercises: mockExercises,
    saveExercise: vi.fn(),
    deleteExercise: vi.fn(),
  }),
}))

vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ workouts: [] }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ExercisesPage Add to Workout', () => {
  it('navigates to /workouts/new with exerciseId query param', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // There should be two "Add to Workout" buttons
    const addButtons = screen.getAllByText('Add to Workout')
    expect(addButtons).toHaveLength(2)

    // Click the first one (Push Up)
    fireEvent.click(addButtons[0]!)

    expect(mockPush).toHaveBeenCalledWith('/workouts/new?exerciseId=ex1')
  })

  it('navigates with correct exerciseId for second exercise', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const addButtons = screen.getAllByText('Add to Workout')
    fireEvent.click(addButtons[1]!)

    expect(mockPush).toHaveBeenCalledWith('/workouts/new?exerciseId=ex2')
  })
})
