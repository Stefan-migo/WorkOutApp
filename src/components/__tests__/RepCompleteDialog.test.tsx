import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { RepCompleteDialog } from '../RepCompleteDialog'

afterEach(cleanup)

describe('RepCompleteDialog', () => {
  it('renders with default reps = plannedReps', () => {
    render(<RepCompleteDialog plannedReps={10} onConfirm={vi.fn()} onSkip={vi.fn()} />)

    const input = screen.getByLabelText(/how many reps did you complete/i) as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe('10')
  })

  it('renders weight input prefilled when plannedWeight is provided', () => {
    render(<RepCompleteDialog plannedReps={10} plannedWeight={80} onConfirm={vi.fn()} onSkip={vi.fn()} />)

    const weightInput = screen.getByLabelText(/weight \(kg\)/i) as HTMLInputElement
    expect(weightInput).toBeInTheDocument()
    expect(weightInput.value).toBe('80')
  })

  it('does not render weight input when plannedWeight is not provided', () => {
    render(<RepCompleteDialog plannedReps={10} onConfirm={vi.fn()} onSkip={vi.fn()} />)

    expect(screen.queryByLabelText(/weight \(kg\)/i)).not.toBeInTheDocument()
  })

  it('calls onConfirm with updated reps and weight', () => {
    const onConfirm = vi.fn()
    render(<RepCompleteDialog plannedReps={10} plannedWeight={80} onConfirm={onConfirm} onSkip={vi.fn()} />)

    const repsInput = screen.getByLabelText(/how many reps did you complete/i)
    fireEvent.change(repsInput, { target: { value: '12' } })

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledWith(12, 80)
  })

  it('calls onSkip when Skip button is clicked', () => {
    const onSkip = vi.fn()
    render(<RepCompleteDialog plannedReps={10} onConfirm={vi.fn()} onSkip={onSkip} />)

    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('allows changing weight input', () => {
    const onConfirm = vi.fn()
    render(<RepCompleteDialog plannedReps={10} plannedWeight={80} onConfirm={onConfirm} onSkip={vi.fn()} />)

    const weightInput = screen.getByLabelText(/weight \(kg\)/i)
    fireEvent.change(weightInput, { target: { value: '85' } })

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledWith(10, 85)
  })
})
