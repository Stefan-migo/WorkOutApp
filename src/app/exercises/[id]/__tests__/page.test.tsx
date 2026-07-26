import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { createMockExercise } from '../../__tests__/helpers'

const mockPush = vi.fn()
// ponytail: mutable variable for useParams — one mock, dynamic per test
let mockParamsId = 'ex-1'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: mockParamsId }),
}))

const mockToggleFavorite = vi.fn()
const mockIsFavorite = vi.fn()
let mockFavoriteIds: string[] = []

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favoriteIds: mockFavoriteIds,
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
    clearOrphans: vi.fn(),
  }),
}))

let mockExercises: any[] = []

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({
    exercises: mockExercises,
    isLoading: false,
    error: null,
    saveExercise: vi.fn(),
    deleteExercise: vi.fn(),
    getExerciseImages: vi.fn().mockResolvedValue([]),
    saveExerciseImage: vi.fn().mockResolvedValue('blob:mock'),
    deleteExerciseImage: vi.fn(),
  }),
}))

vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ workouts: [] }),
}))

vi.mock('@/components/ExerciseFormDialog', () => ({
  ExerciseFormDialog: vi.fn(() => null),
}))

vi.mock('@/components/ExerciseDeleteDialog', () => ({
  ExerciseDeleteDialog: vi.fn(() => null),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

beforeEach(() => {
  mockParamsId = 'ex-1'
  mockExercises = []
})

describe('ExerciseDetailPage', () => {
  beforeEach(() => {
    mockFavoriteIds = []
    mockToggleFavorite.mockClear()
    mockIsFavorite.mockClear()
  })

  it('renders a star toggle button', async () => {
    mockExercises = [createMockExercise()]
    mockIsFavorite.mockReturnValue(false)
    const Page = (await import('../page')).default
    render(<Page />)

    const star = screen.getByRole('button', { name: /add to favorites/i })
    expect(star).toBeInTheDocument()
    expect(star).toHaveTextContent('☆')
  })

  it('shows filled star when exercise is favorited', async () => {
    mockExercises = [createMockExercise()]
    mockIsFavorite.mockReturnValue(true)
    const Page = (await import('../page')).default
    render(<Page />)

    const star = screen.getByRole('button', { name: /remove from favorites/i })
    expect(star).toHaveTextContent('★')
  })

  it('calls toggleFavorite with the exercise ID on click', async () => {
    mockExercises = [createMockExercise()]
    mockIsFavorite.mockReturnValue(false)
    const Page = (await import('../page')).default
    render(<Page />)

    const star = screen.getByRole('button', { name: /add to favorites/i })
    fireEvent.click(star)
    expect(mockToggleFavorite).toHaveBeenCalledWith('ex-1')
  })
  it('renders exercise name as heading', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)
    expect(screen.getByRole('heading', { level: 1, name: 'Push Up' })).toBeInTheDocument()
  })

  it('renders category, difficulty, force, and mechanic badges', async () => {
    mockExercises = [createMockExercise({ difficulty: 'beginner', force: 'push', mechanic: 'compound' })]
    const Page = (await import('../page')).default
    render(<Page />)
    expect(screen.getByText('strength')).toBeInTheDocument()
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText('push')).toBeInTheDocument()
    expect(screen.getByText('compound')).toBeInTheDocument()
  })

  it('renders instructions as a numbered list', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Start in plank position')
    expect(items[1]).toHaveTextContent('Lower your body')
    expect(items[2]).toHaveTextContent('Push back up')
  })

  it('renders primary and secondary muscle chips', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)

    // Chips section should include primary and secondary muscles
    expect(screen.getByText('chest')).toBeInTheDocument()
    expect(screen.getByText('triceps')).toBeInTheDocument()
    expect(screen.getByText('shoulders')).toBeInTheDocument()
    expect(screen.getByText('core')).toBeInTheDocument()
  })

  it('renders equipment chips', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)

    expect(screen.getByText('body weight')).toBeInTheDocument()
  })

  it('renders image when exercise has images', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/pushup.jpg')
  })

  it('shows SVG placeholder when exercise has no images', async () => {
    mockExercises = [createMockExercise({ images: [] })]
    const Page = (await import('../page')).default
    render(<Page />)

    // SVG placeholder — the icon path element should be present
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('shows source badge as free-exercise-db', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)

    expect(screen.getByText('free-exercise-db')).toBeInTheDocument()
  })

  it('shows source badge as User created', async () => {
    mockExercises = [createMockExercise({ source: 'user' })]
    const Page = (await import('../page')).default
    render(<Page />)

    expect(screen.getByText('User created')).toBeInTheDocument()
  })

  it('renders Edit, Delete, and Add to Workout buttons', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to workout/i })).toBeInTheDocument()
  })

  it('navigates to /workouts/new with exerciseId on Add to Workout', async () => {
    mockExercises = [createMockExercise()]
    const Page = (await import('../page')).default
    render(<Page />)

    fireEvent.click(screen.getByRole('button', { name: /add to workout/i }))
    expect(mockPush).toHaveBeenCalledWith('/workouts/new?exerciseId=ex-1')
  })

  it('opens ExerciseFormDialog pre-populated on Edit', async () => {
    const { ExerciseFormDialog } = await import('@/components/ExerciseFormDialog')
    mockExercises = [createMockExercise()]

    const Page = (await import('../page')).default
    render(<Page />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    // ExerciseFormDialog should have been called
    expect(ExerciseFormDialog).toHaveBeenCalled()
  })

  it('opens ExerciseDeleteDialog on Delete', async () => {
    const { ExerciseDeleteDialog } = await import('@/components/ExerciseDeleteDialog')
    mockExercises = [createMockExercise()]

    const Page = (await import('../page')).default
    render(<Page />)

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(ExerciseDeleteDialog).toHaveBeenCalled()
  })

  it('renders ExerciseDeleteDialog with correct exerciseName', async () => {
    const { ExerciseDeleteDialog } = await import('@/components/ExerciseDeleteDialog')
    mockExercises = [createMockExercise()]

    const Page = (await import('../page')).default
    render(<Page />)

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    const lastCall = vi.mocked(ExerciseDeleteDialog).mock.lastCall?.[0]
    expect(lastCall?.exerciseName).toBe('Push Up')
  })

  it('renders 404 when exercise is not found', async () => {
    mockExercises = []
    mockParamsId = 'nonexistent'

    const Page = (await import('../page')).default
    render(<Page />)

    expect(screen.getByText('Exercise not found')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /back to exercises/i })
    expect(link).toHaveAttribute('href', '/exercises')
  })
})
