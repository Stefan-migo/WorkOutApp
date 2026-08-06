import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mockPush = vi.fn()
const mockToggleFavorite = vi.fn()
const mockIsFavorite = vi.fn()
const mockClearOrphans = vi.fn()
const mockSaveExercise = vi.fn()
const mockSaveExerciseImage = vi.fn()
const mockDeleteExercise = vi.fn()
const mockGetExercise = vi.fn()
const mockGetExerciseImages = vi.fn().mockResolvedValue([])
let mockFavoriteIds: string[] = []

const mockExercises = [
  {
    id: 'ex1',
    name: 'Push Up',
    category: 'strength',
    difficulty: 'beginner',
    force: 'push',
    mechanic: 'compound',
    primaryMuscles: ['chest', 'triceps', 'shoulders'],
    images: ['https://example.com/pushup.jpg'],
    source: 'free-exercise-db',
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'ex2',
    name: 'Squat',
    category: 'strength',
    difficulty: 'intermediate',
    force: 'pull' as const,
    mechanic: 'compound' as const,
    primaryMuscles: ['quadriceps', 'glutes'],
    images: [],
    source: 'user' as const,
    createdAt: 2,
    updatedAt: 2,
  },
]

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({
    exercises: mockExercises,
    saveExercise: mockSaveExercise,
    saveExerciseImage: mockSaveExerciseImage,
    deleteExercise: mockDeleteExercise,
    getExercise: mockGetExercise,
    getExerciseImages: mockGetExerciseImages,
  }),
}))

vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ workouts: [] }),
}))

vi.mock('@/components/AddToWorkoutModal', () => ({
  AddToWorkoutModal: vi.fn(({ exercise }) => <div data-testid="assign-modal">Assign &quot;{exercise.name}&quot;</div>),
}))

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favoriteIds: mockFavoriteIds,
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
    clearOrphans: mockClearOrphans,
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ExercisesPage card click navigates', () => {
  it('navigates to /exercises/{id} when clicking Push Up', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const cardTitle = screen.getByText('Push Up')
    fireEvent.click(cardTitle)

    expect(mockPush).toHaveBeenCalledWith('/exercises/ex1')
  })

  it('navigates to /exercises/{id} when clicking Squat', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const cardTitle = screen.getByText('Squat')
    fireEvent.click(cardTitle)

    expect(mockPush).toHaveBeenCalledWith('/exercises/ex2')
  })
})

describe('ExercisesPage star toggle', () => {
  beforeEach(() => {
    mockFavoriteIds = []
    mockToggleFavorite.mockClear()
    mockIsFavorite.mockClear()
    mockClearOrphans.mockClear()
  })

  it('renders a star button for each exercise card', async () => {
    mockIsFavorite.mockReturnValue(false)
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const stars = screen.getAllByRole('button', { name: /add to favorites|remove from favorites/i })
    expect(stars).toHaveLength(2)
  })

  it('shows filled star (★) when exercise is favorited', async () => {
    mockIsFavorite.mockImplementation((id: string) => id === 'ex1')
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const stars = screen.getAllByRole('button', { name: /add to favorites|remove from favorites/i })
    expect(stars[0]).toHaveTextContent('★')
    expect(stars[1]).toHaveTextContent('☆')
  })

  it('calls toggleFavorite with correct ID on click', async () => {
    mockIsFavorite.mockReturnValue(false)
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const stars = screen.getAllByRole('button', { name: /add to favorites|remove from favorites/i })
    fireEvent.click(stars[0]!)
    expect(mockToggleFavorite).toHaveBeenCalledWith('ex1')
  })

  it('does not navigate when star button is clicked', async () => {
    mockIsFavorite.mockReturnValue(false)
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const stars = screen.getAllByRole('button', { name: /add to favorites|remove from favorites/i })
    fireEvent.click(stars[0]!)
    expect(mockPush).not.toHaveBeenCalledWith('/exercises/ex1')
  })
})

describe('ExercisesPage Favorites filter tab', () => {
  beforeEach(() => {
    mockFavoriteIds = ['ex1']
    mockIsFavorite.mockImplementation((id: string) => id === 'ex1')
    mockToggleFavorite.mockClear()
  })

  it('renders a Favorites filter button', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    expect(screen.getByText('☆ Favorites')).toBeInTheDocument()
  })

  it('toggles favorites filter when clicked', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const filterBtn = screen.getByText('☆ Favorites')
    fireEvent.click(filterBtn)

    // After clicking, should show only favorited exercises
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.queryByText('Squat')).not.toBeInTheDocument()
  })
})

describe('ExercisesPage favorites empty state', () => {
  beforeEach(() => {
    mockFavoriteIds = []
    mockIsFavorite.mockReturnValue(false)
  })

  it('shows empty state when favorites filter is active with no favorites', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const favoritesBtn = screen.getByText('☆ Favorites')
    fireEvent.click(favoritesBtn)

    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument()
  })
})

describe('ExercisesPage empty state boundaries', () => {
  beforeEach(() => {
    mockFavoriteIds = ['ex1']
    mockIsFavorite.mockImplementation((id: string) => id === 'ex1')
  })

  it('shows generic empty state when favorites filter is active but search yields no match', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const favoritesBtn = screen.getByText('☆ Favorites')
    fireEvent.click(favoritesBtn)

    // Favorites should show ex1 (Push Up) but not ex2 (Squat)
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.queryByText('Squat')).not.toBeInTheDocument()

    // Now search for something that doesn't match any favorites
    const searchInput = screen.getByRole('textbox')
    fireEvent.change(searchInput, { target: { value: 'zzznonexistent' } })

    expect(screen.getByText(/no exercises match/i)).toBeInTheDocument()
    expect(screen.queryByText(/no favorites yet/i)).not.toBeInTheDocument()
  })
})

describe('ExercisesPage card display', () => {
  it('shows difficulty badge on card', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // Difficulty text also appears in the form select options
    const beginnerBadges = screen.getAllByText('Beginner')
    expect(beginnerBadges.length).toBeGreaterThanOrEqual(1)
    const intermediateBadges = screen.getAllByText('Intermediate')
    expect(intermediateBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('shows primary muscles chips with +N overflow', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // ex1 has 3 muscles -> show 2 + "+1" overflow
    expect(screen.getByText('CHEST')).toBeInTheDocument()
    expect(screen.getByText('TRICEPS')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()

    // ex2 has 2 muscles -> show both
    expect(screen.getByText('QUADRICEPS')).toBeInTheDocument()
    expect(screen.getByText('GLUTES')).toBeInTheDocument()
  })

  it('shows image thumbnail when exercise has images', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // ponytail: images rendered as CSS background-image on a div, not <img> elements
    const cards = document.querySelectorAll('[style*="background-image"]')
    expect(cards.length).toBeGreaterThanOrEqual(1)
    expect(cards[0]!.getAttribute('style')).toContain('https://example.com/pushup.jpg')
  })

  it('shows SVG placeholder when exercise has no images', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('shows category badge on each card', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const cardBadges = screen.getAllByText('strength')
    expect(cardBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('does not show +N overflow when muscles ≤ 2', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // ex2 has 2 muscles -> no overflow label
    expect(screen.queryByText('+0')).not.toBeInTheDocument()
  })
})

describe('ExercisesPage responsive grid', () => {
  it('renders all 2 exercises in the grid', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
  })
})

describe('ExercisesPage filter dropdowns', () => {
  it('shows all filter dropdowns including Level', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // All filters are now inline dropdowns (no more collapsible section)
    expect(screen.getByLabelText('Muscle')).toBeInTheDocument()
    expect(screen.getByLabelText('Equipment')).toBeInTheDocument()
    expect(screen.getByLabelText('Force')).toBeInTheDocument()
    expect(screen.getByLabelText('Mechanic')).toBeInTheDocument()
    expect(screen.getByLabelText('Level')).toBeInTheDocument()
  })

  it('filtering by Force dropdown filters exercises', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // Push Up is "push", Squat is "pull"
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()

    const forceSelect = screen.getByLabelText('Force') as HTMLSelectElement
    fireEvent.change(forceSelect, { target: { value: 'push' } })

    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.queryByText('Squat')).not.toBeInTheDocument()
  })
})

describe('ExercisesPage category section headers', () => {
  it('shows category name and count in header', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    // Both exercises are in "strength" category
    expect(screen.getByText('Strength (2)')).toBeInTheDocument()
  })
})

describe('ExercisesPage quick assign', () => {
  beforeEach(() => {
    mockIsFavorite.mockReturnValue(false)
  })

  it('renders an assign button on each exercise card', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const assignBtns = screen.getAllByRole('button', { name: /assign to workout/i })
    expect(assignBtns).toHaveLength(2)
  })

  it('opens assign modal with correct exercise name on click', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const assignBtns = screen.getAllByRole('button', { name: /assign to workout/i })
    fireEvent.click(assignBtns[0]!)

    expect(screen.getByTestId('assign-modal')).toBeInTheDocument()
    expect(screen.getByText(/assign.*push up/i)).toBeInTheDocument()
  })

  it('does not navigate to exercise detail when assign button is clicked', async () => {
    const ExercisesPage = (await import('../page')).default
    render(<ExercisesPage />)

    const assignBtns = screen.getAllByRole('button', { name: /assign to workout/i })
    fireEvent.click(assignBtns[0]!)

    expect(mockPush).not.toHaveBeenCalled()
  })
})
