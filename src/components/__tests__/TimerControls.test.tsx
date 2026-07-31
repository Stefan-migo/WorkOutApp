import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { TimerControls } from '../TimerControls'

afterEach(cleanup)

describe('TimerControls', () => {
  const baseProps = {
    onPause: vi.fn(),
    onResume: vi.fn(),
    onSkip: vi.fn(),
    onRestart: vi.fn(),
  }

  describe('pause icon when running', () => {
    it('renders pause icon and aria-label when status is running', () => {
      render(<TimerControls {...baseProps} status="running" />)

      expect(screen.getByLabelText('Pause')).toBeInTheDocument()
      const icon = screen.getByLabelText('Pause').querySelector('.material-symbols-outlined')
      expect(icon).toHaveTextContent('pause')
      expect(screen.getByLabelText('Skip interval')).toBeInTheDocument()
    })

    it('clicking pause button fires onPause handler', () => {
      render(<TimerControls {...baseProps} status="running" />)

      fireEvent.click(screen.getByLabelText('Pause'))
      expect(baseProps.onPause).toHaveBeenCalledTimes(1)
    })
  })

  describe('play icon when paused', () => {
    it('renders play_arrow icon and aria-label when status is paused', () => {
      render(<TimerControls {...baseProps} status="paused" />)

      expect(screen.getByLabelText('Resume')).toBeInTheDocument()
      const icon = screen.getByLabelText('Resume').querySelector('.material-symbols-outlined')
      expect(icon).toHaveTextContent('play_arrow')
      expect(screen.getByLabelText('Skip interval')).toBeInTheDocument()
    })

    it('clicking resume button fires onResume handler', () => {
      render(<TimerControls {...baseProps} status="paused" />)

      fireEvent.click(screen.getByLabelText('Resume'))
      expect(baseProps.onResume).toHaveBeenCalledTimes(1)
    })
  })

  describe('nothing rendered when idle or complete', () => {
    it('renders nothing when status is idle', () => {
      render(<TimerControls {...baseProps} status="idle" />)

      expect(screen.queryByLabelText('Pause')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Resume')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Skip interval')).not.toBeInTheDocument()
    })

    it('renders nothing when status is complete', () => {
      render(<TimerControls {...baseProps} status="complete" />)

      expect(screen.queryByLabelText('Pause')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Resume')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Skip interval')).not.toBeInTheDocument()
    })
  })

  describe('handler wiring', () => {
    it('fires onSkip when skip button is clicked', () => {
      const onSkip = vi.fn()
      render(<TimerControls {...baseProps} status="running" onSkip={onSkip} />)

      fireEvent.click(screen.getByLabelText('Skip interval'))
      expect(onSkip).toHaveBeenCalledTimes(1)
    })

    it('fires onPause when running, onResume when paused', () => {
      const onPause = vi.fn()
      const onResume = vi.fn()
      const { rerender } = render(
        <TimerControls {...baseProps} status="running" onPause={onPause} onResume={onResume} />,
      )

      fireEvent.click(screen.getByLabelText('Pause'))
      expect(onPause).toHaveBeenCalledTimes(1)
      expect(onResume).not.toHaveBeenCalled()

      rerender(<TimerControls {...baseProps} status="paused" onPause={onPause} onResume={onResume} />)

      fireEvent.click(screen.getByLabelText('Resume'))
      expect(onResume).toHaveBeenCalledTimes(1)
    })
  })

  describe('addTime buttons visible only during rest/reps mode', () => {
    it('does not render addTime buttons when showAddTime is false', () => {
      render(<TimerControls {...baseProps} status="running" showAddTime={false} onAddTime={vi.fn()} />)

      expect(screen.queryByText('+10s')).not.toBeInTheDocument()
      expect(screen.queryByText('+20s')).not.toBeInTheDocument()
      expect(screen.queryByText('+30s')).not.toBeInTheDocument()
    })

    it('does not render addTime buttons when showAddTime is absent', () => {
      render(<TimerControls {...baseProps} status="running" />)

      expect(screen.queryByText('+10s')).not.toBeInTheDocument()
    })

    it('renders +10s, +20s, +30s buttons when showAddTime is true', () => {
      render(<TimerControls {...baseProps} status="running" showAddTime onAddTime={vi.fn()} />)

      expect(screen.getByText('+10s')).toBeInTheDocument()
      expect(screen.getByText('+20s')).toBeInTheDocument()
      expect(screen.getByText('+30s')).toBeInTheDocument()
    })

    it('clicking +20 calls onAddTime(20)', () => {
      const onAddTime = vi.fn()
      render(<TimerControls {...baseProps} status="running" showAddTime onAddTime={onAddTime} />)

      fireEvent.click(screen.getByText('+20s'))
      expect(onAddTime).toHaveBeenCalledWith(20)
    })

    it('clicking +10 calls onAddTime(10)', () => {
      const onAddTime = vi.fn()
      render(<TimerControls {...baseProps} status="running" showAddTime onAddTime={onAddTime} />)

      fireEvent.click(screen.getByText('+10s'))
      expect(onAddTime).toHaveBeenCalledWith(10)
    })

    it('clicking +30 calls onAddTime(30)', () => {
      const onAddTime = vi.fn()
      render(<TimerControls {...baseProps} status="running" showAddTime onAddTime={onAddTime} />)

      fireEvent.click(screen.getByText('+30s'))
      expect(onAddTime).toHaveBeenCalledWith(30)
    })
  })

  describe('conditional previous button', () => {
    it('renders previous button when onPrevious prop is provided', () => {
      render(<TimerControls {...baseProps} status="running" onPrevious={vi.fn()} />)

      expect(screen.getByLabelText('Previous interval')).toBeInTheDocument()
    })

    it('does not render previous button when onPrevious prop is absent', () => {
      render(<TimerControls {...baseProps} status="running" />)

      expect(screen.queryByLabelText('Previous interval')).not.toBeInTheDocument()
    })

    it('clicking previous fires onPrevious handler', () => {
      const onPrevious = vi.fn()
      render(<TimerControls {...baseProps} status="running" onPrevious={onPrevious} />)

      fireEvent.click(screen.getByLabelText('Previous interval'))
      expect(onPrevious).toHaveBeenCalledTimes(1)
    })
  })
})
