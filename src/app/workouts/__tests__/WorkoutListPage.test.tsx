import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import WorkoutListPage from '../page'
import type { Workout } from '@/types/workout'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/workouts',
}))

vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: vi.fn(),
}))

import { useWorkoutContext } from '@/context/WorkoutContext'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const mockWorkouts: Workout[] = [
  {
    id: 'w1',
    title: 'Morning HIIT',
    intervals: [
      { id: 'i1', type: 'prepare', title: 'Warmup', duration: 180 },
      { id: 'i2', type: 'work', title: 'Sprints', duration: 30, exerciseId: 'ex1' },
      { id: 'i3', type: 'rest', title: 'Rest', duration: 30 },
      { id: 'i4', type: 'cooldown', title: 'Stretch', duration: 120 },
    ],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'w2',
    title: 'Endurance Run',
    intervals: [
      { id: 'i5', type: 'work', title: 'Run', duration: 3600 },
    ],
    createdAt: 0,
    updatedAt: 0,
  },
]

describe('WorkoutListPage', () => {
  it('renders empty state with CTA linking to /workouts/new', () => {
    vi.mocked(useWorkoutContext).mockReturnValue({
      workouts: [],
      getWorkout: vi.fn(),
      saveWorkout: vi.fn(),
      deleteWorkout: vi.fn(),
    })

    render(<WorkoutListPage />)

    expect(screen.getByText('No workouts yet')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: /create/i })
    fireEvent.click(cta)
    expect(mockPush).toHaveBeenCalledWith('/workouts/new')
  })

  it('renders a grid of workout cards when workouts exist', () => {
    vi.mocked(useWorkoutContext).mockReturnValue({
      workouts: mockWorkouts,
      getWorkout: vi.fn(),
      saveWorkout: vi.fn(),
      deleteWorkout: vi.fn(),
    })

    render(<WorkoutListPage />)

    expect(screen.getByText('Morning HIIT')).toBeInTheDocument()
    expect(screen.getByText('Endurance Run')).toBeInTheDocument()
  })

  it('shows formatted duration and interval count on each card', () => {
    vi.mocked(useWorkoutContext).mockReturnValue({
      workouts: mockWorkouts,
      getWorkout: vi.fn(),
      saveWorkout: vi.fn(),
      deleteWorkout: vi.fn(),
    })

    render(<WorkoutListPage />)

    // Morning HIIT: 180+30+30+120 = 360s = 6:00, 4 intervals
    expect(screen.getByText(/6:00/)).toBeInTheDocument()
    expect(screen.getByText(/4 intervals/)).toBeInTheDocument()

    // Endurance Run: 3600s = 60:00, 1 interval
    expect(screen.getByText(/60:00/)).toBeInTheDocument()
    expect(screen.getByText(/1 interval/)).toBeInTheDocument()
  })

  it('navigates to workout editor on card click', () => {
    vi.mocked(useWorkoutContext).mockReturnValue({
      workouts: mockWorkouts,
      getWorkout: vi.fn(),
      saveWorkout: vi.fn(),
      deleteWorkout: vi.fn(),
    })

    render(<WorkoutListPage />)

    const card = screen.getByText('Morning HIIT').closest('[role="button"]') as HTMLElement
    fireEvent.click(card)
    expect(mockPush).toHaveBeenCalledWith('/workouts/w1/edit')
  })

  it('renders a mobile FAB that navigates to create', () => {
    vi.mocked(useWorkoutContext).mockReturnValue({
      workouts: mockWorkouts,
      getWorkout: vi.fn(),
      saveWorkout: vi.fn(),
      deleteWorkout: vi.fn(),
    })

    render(<WorkoutListPage />)

    const fab = screen.getByLabelText(/create workout/i)
    fireEvent.click(fab)
    expect(mockPush).toHaveBeenCalledWith('/workouts/new')
  })

  it('wires the WorkoutCard Play button to the play route', () => {
    vi.mocked(useWorkoutContext).mockReturnValue({
      workouts: mockWorkouts,
      getWorkout: vi.fn(),
      saveWorkout: vi.fn(),
      deleteWorkout: vi.fn(),
    })

    render(<WorkoutListPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Play Morning HIIT' }))
    expect(mockPush).toHaveBeenCalledWith('/workouts/w1/play')
  })

  it('wires the WorkoutCard overflow menu: Play/Edit/Preview navigate, Delete confirms then deletes', () => {
    const deleteWorkout = vi.fn()
    vi.mocked(useWorkoutContext).mockReturnValue({
      workouts: mockWorkouts,
      getWorkout: vi.fn(),
      saveWorkout: vi.fn(),
      deleteWorkout,
    })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<WorkoutListPage />)

    const options = () => screen.getAllByRole('button', { name: 'Workout options' })[0]!

    fireEvent.click(options())
    fireEvent.click(screen.getByText('Play').closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/workouts/w1/play')

    fireEvent.click(options())
    fireEvent.click(screen.getByText('Edit').closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/workouts/w1/edit')

    fireEvent.click(options())
    fireEvent.click(screen.getByText('Preview').closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/workouts/w1/preview')

    fireEvent.click(options())
    fireEvent.click(screen.getByText('Delete').closest('button')!)
    expect(confirmSpy).toHaveBeenCalledWith('Delete this workout?')
    expect(deleteWorkout).toHaveBeenCalledWith('w1')

    confirmSpy.mockRestore()
  })
})
