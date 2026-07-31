import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { RepCounter } from '../RepCounter'

afterEach(cleanup)

describe('RepCounter', () => {
  it('renders exercise name and target reps', () => {
    render(<RepCounter exerciseName="Bench Press" reps={10} onComplete={vi.fn()} />)

    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('renders weight when provided', () => {
    render(<RepCounter exerciseName="Bench Press" reps={10} weight={80} onComplete={vi.fn()} />)

    expect(screen.getByText(/80/)).toBeInTheDocument()
  })

  it('does not display weight section when weight is not provided', () => {
    render(<RepCounter exerciseName="Squat" reps={5} onComplete={vi.fn()} />)

    expect(screen.queryByText(/kg/)).not.toBeInTheDocument()
  })

  it('renders Complete button', () => {
    render(<RepCounter exerciseName="Bench Press" reps={10} onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Complete/i })).toBeInTheDocument()
  })

  it('calls onComplete when Complete button is clicked', () => {
    const onComplete = vi.fn()
    render(<RepCounter exerciseName="Bench Press" reps={10} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: /Complete/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
