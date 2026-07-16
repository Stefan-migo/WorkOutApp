import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ExerciseFormDialog } from '../ExerciseFormDialog'
import type { ExerciseFormData } from '../ExerciseFormDialog'

afterEach(cleanup)

const EMPTY_FORM: ExerciseFormData = {
  name: '',
  category: 'strength',
  primaryMuscles: [],
  secondaryMuscles: [],
  equipment: [],
  instructions: [],
  images: [],
}

const FILLED_FORM: ExerciseFormData = {
  name: 'Bench Press',
  category: 'strength',
  description: 'A classic upper body exercise',
  primaryMuscles: ['Chest', 'Shoulders'],
  secondaryMuscles: ['Triceps'],
  equipment: ['Barbell', 'Bench'],
  difficulty: 'beginner',
  force: 'push',
  mechanic: 'compound',
  instructions: ['Lie on bench', 'Grip the bar', 'Press up'],
  images: ['https://example.com/bench.jpg'],
}

function renderDialog(overrides: Partial<{
  editingId: string | null
  form: ExerciseFormData
}> = {}) {
  const props = {
    onClose: vi.fn(),
    form: overrides.form ?? EMPTY_FORM,
    onFormChange: vi.fn(),
    editingId: overrides.editingId ?? null,
    onSave: vi.fn(),
    dialogRef: { current: null } as React.RefObject<HTMLDialogElement | null>,
    allMuscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Biceps'],
    allEquipment: ['Barbell', 'Bench', 'Dumbbell', 'Kettlebell'],
  }
  return {
    ...render(<ExerciseFormDialog {...props} />),
    props,
  }
}

describe('ExerciseFormDialog', () => {
  it('renders create mode with empty form', () => {
    renderDialog()
    expect(screen.getByText('New Exercise')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Exercise name')).toHaveValue('')
  })

  it('renders edit mode with pre-populated data', () => {
    renderDialog({ form: FILLED_FORM, editingId: 'ex-1' })
    expect(screen.getByText('Edit Exercise')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Exercise name')).toHaveValue('Bench Press')
  })

  it('renders TagChips for primaryMuscles, secondaryMuscles, equipment', () => {
    renderDialog({ form: FILLED_FORM })
    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Shoulders')).toBeInTheDocument()
    expect(screen.getByText('Triceps')).toBeInTheDocument()
    expect(screen.getByText('Barbell')).toBeInTheDocument()
    expect(screen.getByText('Bench')).toBeInTheDocument()
  })

  it('shows validation error when name is empty on save', () => {
    const onSave = vi.fn()
    render(
      <ExerciseFormDialog
        onClose={vi.fn()}
        form={EMPTY_FORM}
        onFormChange={vi.fn()}
        editingId={null}
        onSave={onSave}
        dialogRef={{ current: null }}
        allMuscleGroups={[]}
        allEquipment={[]}
      />,
    )
    const form = screen.getByTestId('exercise-form')
    fireEvent.submit(form)
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('allows save when name is filled', () => {
    const onSave = vi.fn()
    render(
      <ExerciseFormDialog
        onClose={vi.fn()}
        form={{ ...EMPTY_FORM, name: 'Push Ups' }}
        onFormChange={vi.fn()}
        editingId={null}
        onSave={onSave}
        dialogRef={{ current: null }}
        allMuscleGroups={[]}
        allEquipment={[]}
      />,
    )
    const submitBtn = screen.getByText('Create')
    fireEvent.click(submitBtn)
    expect(onSave).toHaveBeenCalled()
  })

  it('renders force selector with push/pull/static options', () => {
    renderDialog()
    expect(screen.getByLabelText('push')).toBeInTheDocument()
    expect(screen.getByLabelText('pull')).toBeInTheDocument()
    expect(screen.getByLabelText('static')).toBeInTheDocument()
  })

  it('renders mechanic selector with compound/isolation options', () => {
    renderDialog()
    expect(screen.getByLabelText('compound')).toBeInTheDocument()
    expect(screen.getByLabelText('isolation')).toBeInTheDocument()
  })

  it('renders category and difficulty selects', () => {
    renderDialog()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument()
  })

  it('step editor: adds a step', () => {
    const onFormChange = vi.fn()
    const form: ExerciseFormData = { ...EMPTY_FORM, instructions: [] }
    render(
      <ExerciseFormDialog
        onClose={vi.fn()}
        form={form}
        onFormChange={onFormChange}
        editingId={null}
        onSave={vi.fn()}
        dialogRef={{ current: null }}
        allMuscleGroups={[]}
        allEquipment={[]}
      />,
    )
    const addBtn = screen.getByText('+ Add Step')
    fireEvent.click(addBtn)
    expect(onFormChange).toHaveBeenCalledWith(
      expect.objectContaining({ instructions: [''] }),
    )
  })

  it('step editor: removes a step', () => {
    const onFormChange = vi.fn()
    const form: ExerciseFormData = {
      ...EMPTY_FORM,
      instructions: ['Step one', 'Step two'],
    }
    render(
      <ExerciseFormDialog
        onClose={vi.fn()}
        form={form}
        onFormChange={onFormChange}
        editingId={null}
        onSave={vi.fn()}
        dialogRef={{ current: null }}
        allMuscleGroups={[]}
        allEquipment={[]}
      />,
    )
    // Find the ✕ button inside the instructions section for the first step
    const section = screen.getByTestId('instructions-section')
    const removeBtns = section.querySelectorAll('button')
    // Find the button with ✕ text
    const removeBtn = Array.from(removeBtns).find((b) => b.textContent === '✕')
    expect(removeBtn).toBeTruthy()
    fireEvent.click(removeBtn!)
    expect(onFormChange).toHaveBeenCalledWith(
      expect.objectContaining({ instructions: ['Step two'] }),
    )
  })

  it('step editor: reorders steps up', () => {
    const onFormChange = vi.fn()
    const form: ExerciseFormData = {
      ...EMPTY_FORM,
      instructions: ['First step', 'Second step'],
    }
    render(
      <ExerciseFormDialog
        onClose={vi.fn()}
        form={form}
        onFormChange={onFormChange}
        editingId={null}
        onSave={vi.fn()}
        dialogRef={{ current: null }}
        allMuscleGroups={[]}
        allEquipment={[]}
      />,
    )
    // Click "up" button on the second step
    const section = screen.getByTestId('instructions-section')
    const upBtns = section.querySelectorAll('button')
    // Filter to find ↑ buttons
    const upBtn = Array.from(upBtns).filter((b) => b.textContent === '↑')
    expect(upBtn.length).toBe(2)
    fireEvent.click(upBtn[1]!)
    expect(onFormChange).toHaveBeenCalledWith(
      expect.objectContaining({ instructions: ['Second step', 'First step'] }),
    )
  })

  it('renders image URL input', () => {
    renderDialog()
    const imageInput = screen.getByPlaceholderText('https://example.com/image.jpg')
    expect(imageInput).toBeInTheDocument()
  })

  it('renders preview card with exercise name and primary muscles', () => {
    renderDialog({ form: FILLED_FORM })
    // Preview card should show the name and primary muscles in uppercase
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText(/CHEST/)).toBeInTheDocument()
    expect(screen.getByText(/SHOULDERS/)).toBeInTheDocument()
  })

  it('renders Cancel and Save/Create buttons', () => {
    renderDialog()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', () => {
    const { props } = renderDialog()
    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()
  })

  it('renders difficulty dropdown', () => {
    renderDialog()
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
    expect(screen.getByText('Advanced')).toBeInTheDocument()
  })

  it('renders description textarea', () => {
    renderDialog()
    expect(screen.getByPlaceholderText('Optional description')).toBeInTheDocument()
  })
})
