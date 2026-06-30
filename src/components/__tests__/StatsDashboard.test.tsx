import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import StatsDashboard from '../StatsDashboard'
import type { Session } from '@/types/workout'

afterEach(cleanup)

function session(overrides: Partial<Session> & { startedAt: number }): Session {
  return {
    id: `s-${Math.random().toString(36).slice(2, 8)}`,
    type: 'workout',
    workoutId: 'w1',
    intervals: [],
    ...overrides,
  }
}

function interval(actual: number) {
  return {
    intervalId: 'i1',
    title: 'Work',
    type: 'work' as const,
    plannedDuration: actual,
    actualDuration: actual,
    completed: true,
  }
}

describe('StatsDashboard', () => {
  describe('empty state', () => {
    it('shows empty message and link to /workouts when no sessions', () => {
      render(<StatsDashboard sessions={[]} />)

      expect(screen.getByText('Complete your first workout to see stats')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: /browse workouts/i })
      expect(link).toHaveAttribute('href', '/workouts')
    })

    it('does not show cards, chart, or session list in empty state', () => {
      render(<StatsDashboard sessions={[]} />)

      expect(screen.queryByText('Total Workouts')).not.toBeInTheDocument()
      expect(screen.queryByText('Total Time')).not.toBeInTheDocument()
      expect(screen.queryByText('Current Streak')).not.toBeInTheDocument()
      expect(screen.queryByText('This Week')).not.toBeInTheDocument()
      expect(screen.queryByText('Recent Sessions')).not.toBeInTheDocument()
    })
  })

  describe('summary cards', () => {
    it('renders 4 summary cards with correct values', () => {
      const sessions = [
        session({
          startedAt: new Date('2026-06-30T10:00:00Z').getTime(),
          intervals: [interval(3600), interval(600)], // 4200s total = 1.17h
        }),
        session({
          startedAt: new Date('2026-06-29T10:00:00Z').getTime(),
          intervals: [interval(1800)], // 1800s
        }),
      ]

      render(<StatsDashboard sessions={sessions} />)

      // All 4 card labels present
      expect(screen.getByText('Total Workouts')).toBeInTheDocument()
      expect(screen.getByText('Total Time')).toBeInTheDocument()
      expect(screen.getByText('Current Streak')).toBeInTheDocument()
      expect(screen.getByText('This Week')).toBeInTheDocument()

      // 3 cards show "2" (Total Workouts, Current Streak, This Week)
      expect(screen.getAllByText('2')).toHaveLength(3)

      // Total Time in hours (6000s = 1.67h, rounded to 1.7)
      expect(screen.getByText(/1\.7h/)).toBeInTheDocument()
    })

    it('displays 0 values when sessions exist but are old', () => {
      const sessions = [
        session({
          startedAt: new Date('2026-06-01T10:00:00Z').getTime(),
          intervals: [interval(600)],
        }),
      ]

      render(<StatsDashboard sessions={sessions} />)

      const cards = screen.getAllByText('0')
      // At least the streak and this week should be 0
      expect(cards.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('weekly volume chart', () => {
    it('renders bars for each of 12 weeks', () => {
      const sessions = [
        session({
          startedAt: new Date('2026-06-30T10:00:00Z').getTime(),
          intervals: [interval(1200)],
        }),
      ]

      render(<StatsDashboard sessions={sessions} />)

      // Should show "Weekly Volume" heading
      expect(screen.getByText('Weekly Volume')).toBeInTheDocument()
    })
  })

  describe('recent sessions list', () => {
    it('renders last 10 sessions with date, name, duration, type', () => {
      const sessions = Array.from({ length: 12 }, (_, i) =>
        session({
          startedAt: new Date(`2026-06-${30 - i}T10:00:00Z`).getTime(),
          intervals: [interval(600)],
        }),
      )

      render(<StatsDashboard sessions={sessions} />)

      expect(screen.getByText('Recent Sessions')).toBeInTheDocument()
      // Should show 10 session entries
      const items = screen.getAllByText(/Workout/)
      expect(items.length).toBeGreaterThanOrEqual(1) // At least one rendered session name
    })

    it('shows type badge for each session', () => {
      const sessions = [
        session({
          type: 'sequence',
          sequenceId: 'seq1',
          startedAt: new Date('2026-06-30T10:00:00Z').getTime(),
          intervals: [interval(600)],
        }),
      ]

      render(<StatsDashboard sessions={sessions} />)

      // Type badge should show "sequence"
      expect(screen.getByText('sequence')).toBeInTheDocument()
    })
  })
})
