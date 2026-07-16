import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'

// ponytail: hoisted mock so component and tests share the same spy
const { mockToggleFavorite } = vi.hoisted(() => ({
  mockToggleFavorite: vi.fn(),
}))

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favoriteIds: [],
    isFavorite: vi.fn(() => false),
    toggleFavorite: mockToggleFavorite,
  }),
}))

import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ExercisePicker } from '../ExercisePicker'
import type { Exercise } from '@/types/workout'

// ponytail: HTMLDialogElement polyfill for jsdom
beforeAll(() => {
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () { this.open = true; this.dispatchEvent(new Event('open')) }
    HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')) }
  }
})

afterEach(() => {
  cleanup()
  mockToggleFavorite.mockClear()
})

const exercises: Exercise[] = [
  {
    id: 'ex1', name: 'Push Up', category: 'strength',
    force: 'push', mechanic: 'compound', difficulty: 'beginner',
    primaryMuscles: ['Chest', 'Triceps', 'Shoulders'],
    createdAt: 1, updatedAt: 1,
  },
  {
    id: 'ex2', name: 'Squat', category: 'strength',
    force: 'push', mechanic: 'compound', difficulty: 'intermediate',
    primaryMuscles: ['Quads', 'Glutes'],
    images: ['https://example.com/squat.jpg'],
    createdAt: 2, updatedAt: 2,
  },
  {
    id: 'ex3', name: 'Plank', category: 'stretching',
    force: 'static', mechanic: 'isolation', difficulty: 'beginner',
    primaryMuscles: ['Core'],
    createdAt: 3, updatedAt: 3,
  },
  {
    id: 'ex4', name: 'Deadlift', category: 'powerlifting',
    force: 'pull', mechanic: 'compound', difficulty: 'advanced',
    primaryMuscles: ['Back', 'Hamstrings'],
    createdAt: 4, updatedAt: 4,
  },
]

describe('ExercisePicker', () => {
  it('opens dialog and shows exercise list', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    expect(screen.getByText('Select Exercise')).toBeInTheDocument()
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.getByText('Plank')).toBeInTheDocument()
    expect(screen.getByText('Deadlift')).toBeInTheDocument()
  })

  it('search filters exercises by name (case-insensitive)', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Search exercises...'), { target: { value: 'PUSH' } })
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.queryByText('Squat')).not.toBeInTheDocument()
    expect(screen.queryByText('Plank')).not.toBeInTheDocument()
  })

  it('category filter select narrows results', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'stretching' } })
    expect(screen.getByText('Plank')).toBeInTheDocument()
    expect(screen.queryByText('Push Up')).not.toBeInTheDocument()
    expect(screen.queryByText('Squat')).not.toBeInTheDocument()
  })

  it('force filter select narrows results', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    fireEvent.change(screen.getByLabelText('Force'), { target: { value: 'static' } })
    expect(screen.getByText('Plank')).toBeInTheDocument()
    expect(screen.queryByText('Push Up')).not.toBeInTheDocument()
  })

  it('difficulty filter select narrows results', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: 'intermediate' } })
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.queryByText('Push Up')).not.toBeInTheDocument()
  })

  it('stacks category + difficulty filters (AND logic)', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'strength' } })
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: 'beginner' } })
    expect(screen.getByText('Push Up')).toBeInTheDocument()
    expect(screen.queryByText('Squat')).not.toBeInTheDocument() // intermediate
    expect(screen.queryByText('Plank')).not.toBeInTheDocument() // stretching
  })

  it('clicking an exercise calls onSelect with the exercise object', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <ExercisePicker
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={exercises}
      />,
    )
    fireEvent.click(screen.getByText('Squat'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(exercises[1])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('favorite star button toggles on click', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    const stars = screen.getAllByRole('button', { name: /add to favorites/i })
    expect(stars).toHaveLength(4)
    fireEvent.click(stars[0]!)
    expect(mockToggleFavorite).toHaveBeenCalledWith('ex1')
  })

  it('shows empty state when no exercises match filters', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Search exercises...'), { target: { value: 'zzz' } })
    expect(screen.getByText('No exercises match your filters')).toBeInTheDocument()
  })

  it('has a Favorites toggle button', () => {
    render(
      <ExercisePicker
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        exercises={exercises}
      />,
    )
    expect(screen.getByText(/Favorites/i)).toBeInTheDocument()
  })
})
