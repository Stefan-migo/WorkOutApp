import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ExerciseSearchHeader } from '../ExerciseSearchHeader'

afterEach(cleanup)

function renderHeader(overrides: Partial<{
  forceFilter: string | null
  onForceFilter: (v: string | null) => void
  mechanicFilter: string | null
  onMechanicFilter: (v: string | null) => void
  difficultyFilter: string | null
  onDifficultyFilter: (v: string | null) => void
  categoryFilter: string | null
  onCategoryFilter: (v: string | null) => void
}> = {}) {
  const props = {
    search: '',
    onSearchChange: vi.fn(),
    muscleFilter: null,
    onMuscleFilter: vi.fn(),
    allMuscleGroups: ['Chest', 'Back', 'Legs'],
    equipmentFilter: null,
    onEquipmentFilter: vi.fn(),
    allEquipment: ['Barbell', 'Dumbbell'],
    onCreate: vi.fn(),
    forceFilter: overrides.forceFilter ?? null,
    onForceFilter: overrides.onForceFilter ?? vi.fn(),
    mechanicFilter: overrides.mechanicFilter ?? null,
    onMechanicFilter: overrides.onMechanicFilter ?? vi.fn(),
    difficultyFilter: overrides.difficultyFilter ?? null,
    onDifficultyFilter: overrides.onDifficultyFilter ?? vi.fn(),
    categoryFilter: overrides.categoryFilter ?? null,
    onCategoryFilter: overrides.onCategoryFilter ?? vi.fn(),
  }
  return { ...render(<ExerciseSearchHeader {...props} />), props }
}

describe('ExerciseSearchHeader', () => {
  it('renders title', () => {
    renderHeader()
    expect(screen.getByText('Exercise Library')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderHeader()
    expect(screen.getByPlaceholderText('Search by name, muscle, or equipment...')).toBeInTheDocument()
  })

  it('renders Create New Exercise button', () => {
    renderHeader()
    expect(screen.getByText('+ New')).toBeInTheDocument()
  })

  it('calls onCreate when Create button is clicked', () => {
    const { props } = renderHeader()
    fireEvent.click(screen.getByText('+ New'))
    expect(props.onCreate).toHaveBeenCalled()
  })

  it('renders muscle filter select with options', () => {
    renderHeader()
    const select = screen.getByLabelText('Muscle')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('')
    const optChest = screen.getByText('Chest')
    expect(optChest).toBeInTheDocument()
  })

  it('renders equipment filter select with options', () => {
    renderHeader()
    const select = screen.getByLabelText('Equipment')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('')
    const optDumbbell = screen.getByText('Dumbbell')
    expect(optDumbbell).toBeInTheDocument()
  })

  it('calls onMuscleFilter when Muscle select changes', () => {
    const { props } = renderHeader()
    const select = screen.getByLabelText('Muscle')
    fireEvent.change(select, { target: { value: 'Chest' } })
    expect(props.onMuscleFilter).toHaveBeenCalledWith('Chest')
  })

  it('clears muscle filter when All Muscles is selected', () => {
    const onMuscleFilter = vi.fn()
    render(
      <ExerciseSearchHeader
        search=""
        onSearchChange={vi.fn()}
        muscleFilter="Chest"
        onMuscleFilter={onMuscleFilter}
        allMuscleGroups={['Chest', 'Back']}
        equipmentFilter={null}
        onEquipmentFilter={vi.fn()}
        allEquipment={[]}
        onCreate={vi.fn()}
      />,
    )
    const select = screen.getByLabelText('Muscle')
    fireEvent.change(select, { target: { value: '' } })
    expect(onMuscleFilter).toHaveBeenCalledWith(null)
  })

  describe('secondary filter dropdowns', () => {
    it('renders Force, Mechanic, Level, Category dropdowns when handlers provided', () => {
      renderHeader()
      expect(screen.getByLabelText('Force')).toBeInTheDocument()
      expect(screen.getByLabelText('Mechanic')).toBeInTheDocument()
      expect(screen.getByLabelText('Level')).toBeInTheDocument()
      expect(screen.getByLabelText('Category')).toBeInTheDocument()
    })

    it('does NOT render dropdowns when handlers are omitted', () => {
      render(
        <ExerciseSearchHeader
          search=""
          onSearchChange={vi.fn()}
          muscleFilter={null}
          onMuscleFilter={vi.fn()}
          allMuscleGroups={[]}
          equipmentFilter={null}
          onEquipmentFilter={vi.fn()}
          allEquipment={[]}
          onCreate={vi.fn()}
        />,
      )
      expect(screen.queryByLabelText('Force')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Mechanic')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Level')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Category')).not.toBeInTheDocument()
    })

    it('calls onForceFilter when Force select changes', () => {
      const onForceFilter = vi.fn()
      renderHeader({ onForceFilter })
      const select = screen.getByLabelText('Force')
      fireEvent.change(select, { target: { value: 'push' } })
      expect(onForceFilter).toHaveBeenCalledWith('push')
    })

    it('calls onMechanicFilter when Mechanic select changes', () => {
      const onMechanicFilter = vi.fn()
      renderHeader({ onMechanicFilter })
      const select = screen.getByLabelText('Mechanic')
      fireEvent.change(select, { target: { value: 'compound' } })
      expect(onMechanicFilter).toHaveBeenCalledWith('compound')
    })

    it('calls onDifficultyFilter when Level select changes', () => {
      const onDifficultyFilter = vi.fn()
      renderHeader({ onDifficultyFilter })
      const select = screen.getByLabelText('Level')
      fireEvent.change(select, { target: { value: 'beginner' } })
      expect(onDifficultyFilter).toHaveBeenCalledWith('beginner')
    })

    it('calls onCategoryFilter when Category select changes', () => {
      const onCategoryFilter = vi.fn()
      renderHeader({ onCategoryFilter })
      const select = screen.getByLabelText('Category')
      fireEvent.change(select, { target: { value: 'strength' } })
      expect(onCategoryFilter).toHaveBeenCalledWith('strength')
    })

    it('clears force filter when All is selected', () => {
      const onForceFilter = vi.fn()
      renderHeader({ forceFilter: 'push', onForceFilter })
      const select = screen.getByLabelText('Force')
      fireEvent.change(select, { target: { value: '' } })
      expect(onForceFilter).toHaveBeenCalledWith(null)
    })
  })
})
