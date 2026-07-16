import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mockPush = vi.fn()
const mockSaveWorkout = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ saveWorkout: mockSaveWorkout }),
}))

vi.mock('@/components/WorkoutBuilder', () => ({
  default: () => <div data-testid="workout-builder">Workout Builder</div>,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('NewWorkoutPage', () => {
  it('renders WorkoutBuilder component', async () => {
    const NewWorkoutPage = (await import('../page')).default
    render(<NewWorkoutPage />)
    expect(screen.getByTestId('workout-builder')).toBeInTheDocument()
  })
})
