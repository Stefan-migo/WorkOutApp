import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DashboardPage from '../page'
import type { Sequence, WeekPlan, Workout } from '@/types/workout'

const { data } = vi.hoisted(() => ({
  data: { workouts: [] as Workout[], sequences: [] as Sequence[], weekPlans: [] as WeekPlan[] },
}))

vi.mock('@/context/WorkoutContext', () => ({
  useWorkoutContext: () => ({ workouts: data.workouts, isLoading: false }),
}))
vi.mock('@/hooks/useSequences', () => ({
  useSequences: () => ({ sequences: data.sequences, isLoading: false }),
}))
vi.mock('@/hooks/useWeekPlans', () => ({
  useWeekPlans: () => ({ weekPlans: data.weekPlans, isLoading: false }),
}))

const workout: Workout = {
  id: 'strength', title: 'Strength intervals', intervals: [], createdAt: 0, updatedAt: 0,
}
const sequence: Sequence = {
  id: 'circuit', title: 'Full body circuit', workoutIds: [workout.id], repeatCount: 2, createdAt: 0, updatedAt: 0,
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 9, 12))
  data.workouts = [workout]
  data.sequences = [sequence]
  data.weekPlans = []
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Today', () => {
  it('starts a scheduled sequence and shows the next scheduled workout', () => {
    data.weekPlans = [{
      id: 'week', startDate: '2026-11-09', createdAt: 0, updatedAt: 0,
      days: [{ sequenceId: sequence.id }, { workoutId: workout.id }, null, null, null, null, null],
    }]
    render(<DashboardPage />)

    expect(screen.getByRole('link', { name: 'Start sequence' })).toHaveAttribute('href', '/sequences/circuit/play')
    expect(screen.getByRole('heading', { name: 'Up next' })).toBeInTheDocument()
    expect(screen.getByText(workout.title)).toBeInTheDocument()
  })

  it('lets someone choose a workout on a free day', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('link', { name: 'Choose a workout' })).toHaveAttribute('href', '/workouts')
  })
})
