import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ExerciseDeleteDialog } from '../ExerciseDeleteDialog'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ExerciseDeleteDialog', () => {
  it('shows exercise name in the title', () => {
    render(
      <ExerciseDeleteDialog
        onClose={vi.fn()}
        workoutRefCount={0}
        onDelete={vi.fn()}
        dialogRef={{ current: null }}
        exerciseName="Push Up"
      />,
    )
    expect(screen.getByText('Delete Push Up?')).toBeInTheDocument()
  })

  it('shows workout reference warning when count > 0', () => {
    render(
      <ExerciseDeleteDialog
        onClose={vi.fn()}
        workoutRefCount={2}
        onDelete={vi.fn()}
        dialogRef={{ current: null }}
        exerciseName="Squat"
      />,
    )
    expect(screen.getByText(/2 workouts/)).toBeInTheDocument()
  })

  it('shows no-references message when count is 0', () => {
    render(
      <ExerciseDeleteDialog
        onClose={vi.fn()}
        workoutRefCount={0}
        onDelete={vi.fn()}
        dialogRef={{ current: null }}
        exerciseName="Squat"
      />,
    )
    expect(screen.getByText(/not referenced by any workout/)).toBeInTheDocument()
  })

  it('calls onDelete when Delete button is clicked', () => {
    const onDelete = vi.fn()
    render(
      <ExerciseDeleteDialog
        onClose={vi.fn()}
        workoutRefCount={0}
        onDelete={onDelete}
        dialogRef={{ current: null }}
        exerciseName="Push Up"
      />,
    )
    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(
      <ExerciseDeleteDialog
        onClose={onClose}
        workoutRefCount={0}
        onDelete={vi.fn()}
        dialogRef={{ current: null }}
        exerciseName="Push Up"
      />,
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
