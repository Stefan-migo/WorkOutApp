import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { IntervalRow } from '../IntervalRow'
import type { Interval } from '@/types/workout'

afterEach(cleanup)

function renderRow(interval: Partial<Interval> = {}) {
  const onEdit = vi.fn()
  const onRemove = vi.fn()
  const onMoveDown = vi.fn()
  render(
    <IntervalRow
      interval={{ id: 'work-1', type: 'work', title: 'Sprint drills', duration: 125, ...interval }}
      index={0}
      onEdit={onEdit}
      onRemove={onRemove}
      onMoveUp={vi.fn()}
      onMoveDown={onMoveDown}
      isFirst
      isLast={false}
      dragIndex={null}
      onDragStart={vi.fn()}
      onDragOver={vi.fn()}
      onDrop={vi.fn()}
      onDragEnd={vi.fn()}
    />,
  )
  return { onEdit, onRemove, onMoveDown }
}

describe('IntervalRow', () => {
  it('opens the editor through a single button and displays the timed target', () => {
    const { onEdit } = renderRow()
    const edit = screen.getByRole('button', { name: 'Edit interval 1: Sprint drills' })
    expect(edit).toHaveTextContent('02:05')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(edit)
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('shows reps and weight for rep-based blocks', () => {
    renderRow({ mode: 'reps', reps: 12, weight: 20 })
    expect(screen.getByText('12 reps · 20 kg')).toBeInTheDocument()
  })

  it('shows time for explicitly timed blocks with old rep values', () => {
    renderRow({ mode: 'timed', reps: 12 })
    expect(screen.getByText('02:05')).toBeInTheDocument()
    expect(screen.queryByText('12 reps')).not.toBeInTheDocument()
  })

  it('keeps reorder and removal separate from editing', () => {
    const { onEdit, onRemove, onMoveDown } = renderRow()
    const menu = screen.getByLabelText('Actions for interval 1: Sprint drills')
    fireEvent.click(menu)
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Move down' }))
    expect(onMoveDown).toHaveBeenCalledWith(0)
    fireEvent.click(menu)
    fireEvent.click(screen.getByRole('button', { name: 'Remove block' }))
    expect(onRemove).toHaveBeenCalledWith(0)
    expect(onEdit).not.toHaveBeenCalled()
  })
})
