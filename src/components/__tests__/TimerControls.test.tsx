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
