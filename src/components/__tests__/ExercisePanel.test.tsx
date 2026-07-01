import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ExercisePanel } from '../ExercisePanel'

afterEach(cleanup)

describe('ExercisePanel', () => {
  it('renders exercise name', () => {
    render(<ExercisePanel name="Push Ups" />)
    expect(screen.getByText('Push Ups')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<ExercisePanel name="Push Ups" description="A classic upper body exercise" />)
    expect(screen.getByText('A classic upper body exercise')).toBeInTheDocument()
  })

  it('renders chips when provided', () => {
    render(<ExercisePanel name="Push Ups" chips={['Chest', 'Triceps']} />)
    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Triceps')).toBeInTheDocument()
  })

  it('shows icon placeholder when no imageUrl', () => {
    render(<ExercisePanel name="Push Ups" />)
    const icon = document.querySelector('.material-symbols-outlined')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveTextContent('fitness_center')
  })

  it('does not render chips container when chips is empty', () => {
    render(<ExercisePanel name="Push Ups" chips={[]} />)
    expect(screen.queryByText('Chest')).not.toBeInTheDocument()
  })
})
