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

function interval(actual: number, type: 'work' | 'rest' | 'prepare' | 'cooldown' = 'work') {
  return {
    intervalId: 'i1',
    title: type === 'work' ? 'Work' : 'Rest',
    type,
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

    it('does not show populated content in empty state', () => {
      render(<StatsDashboard sessions={[]} />)

      expect(screen.queryByText('Volume per Week')).not.toBeInTheDocument()
      expect(screen.queryByText('Average Strain')).not.toBeInTheDocument()
      expect(screen.queryByText('Consistency')).not.toBeInTheDocument()
      expect(screen.queryByText('Personal Records')).not.toBeInTheDocument()
    })
  })

  describe('header', () => {
    it('shows Performance Stats heading and subtitle', () => {
      render(
        <StatsDashboard
          sessions={[
            session({ startedAt: Date.now(), intervals: [interval(600)] }),
          ]}
        />,
      )

      expect(screen.getByText('Performance Stats')).toBeInTheDocument()
      expect(screen.getByText('Last 30 Days Overview')).toBeInTheDocument()
    })

    it('shows Export CSV button', () => {
      render(
        <StatsDashboard
          sessions={[
            session({ startedAt: Date.now(), intervals: [interval(600)] }),
          ]}
        />,
      )

      expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument()
    })
  })

  describe('bento grid sections', () => {
    it('renders Volume per Week section with bars', () => {
      render(
        <StatsDashboard
          sessions={[
            session({ startedAt: Date.now(), intervals: [interval(600)] }),
          ]}
        />,
      )

      expect(screen.getByText('Volume per Week')).toBeInTheDocument()
      expect(screen.getByText('Wk 1')).toBeInTheDocument()
    })

    it('renders Average Strain with RPE gauge', () => {
      render(
        <StatsDashboard
          sessions={[
            session({ startedAt: Date.now(), intervals: [interval(600)] }),
          ]}
        />,
      )

      expect(screen.getByText('Average Strain')).toBeInTheDocument()
      expect(screen.getByText('RPE Focus')).toBeInTheDocument()
      expect(screen.getByText('Avg RPE')).toBeInTheDocument()
    })

    it('renders Consistency heatmap with day labels', () => {
      render(
        <StatsDashboard
          sessions={[
            session({ startedAt: Date.now(), intervals: [interval(600)] }),
          ]}
        />,
      )

      expect(screen.getByText('Consistency')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
    })

    it('renders Personal Records section with coming soon message', () => {
      render(
        <StatsDashboard
          sessions={[
            session({ startedAt: Date.now(), intervals: [interval(600)] }),
          ]}
        />,
      )

      expect(screen.getByText('Personal Records')).toBeInTheDocument()
      expect(screen.getByText('PR tracking coming in a future update.')).toBeInTheDocument()
    })
  })

  describe('heatmap', () => {
    it('renders 28 cells (4 weeks × 7 days)', () => {
      render(
        <StatsDashboard
          sessions={[
            session({ startedAt: Date.now(), intervals: [interval(600)] }),
          ]}
        />,
      )

      // Heatmap grid has 28 cells inside the Consistency card
      // Use a broader approach
      const consistencyCard = screen.getByText('Consistency').closest('.glass-card')
      const heatmapCells = consistencyCard?.querySelectorAll('.grid > div')
      expect(heatmapCells?.length).toBe(28)
    })
  })

  describe('formatDuration and formatHours', () => {
    it('formatHours returns correct string', async () => {
      const { formatHours } = await import('../StatsDashboard')
      expect(formatHours(3600)).toBe('1.0h')
      expect(formatHours(5400)).toBe('1.5h')
      expect(formatHours(900)).toBe('0.3h')
    })

    it('formatDuration returns mm:ss format', async () => {
      const { formatDuration } = await import('@/lib/format')
      expect(formatDuration(65)).toBe('1:05')
      expect(formatDuration(3600)).toBe('60:00')
      expect(formatDuration(30)).toBe('0:30')
    })
  })
})
