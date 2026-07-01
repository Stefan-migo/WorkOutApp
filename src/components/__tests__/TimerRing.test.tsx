import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { TimerRing } from '../TimerRing'

afterEach(cleanup)

describe('TimerRing', () => {
  it('renders SVG with viewBox 0 0 100 100', () => {
    render(<TimerRing timeLeft={30} duration={60} intervalType="work" label="WORK" />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100')
  })

  it('renders track circle with #1E293B stroke', () => {
    render(<TimerRing timeLeft={30} duration={60} intervalType="work" label="WORK" />)
    const circles = document.querySelectorAll('circle')
    // First circle is the track
    const track = circles[0]
    expect(track).toHaveAttribute('stroke', '#1E293B')
    expect(track).toHaveAttribute('fill', 'transparent')
  })

  describe('progress circle dashoffset', () => {
    it('shows offset 0 when timeLeft equals duration (full ring)', () => {
      render(<TimerRing timeLeft={60} duration={60} intervalType="work" label="WORK" />)
      const circles = document.querySelectorAll('circle')
      const progress = circles[1]
      // timeLeft/duration=1 → offset = 283*(1-1) = 0 (ring full at start of countdown)
      expect(progress).toHaveAttribute('stroke-dashoffset', '0')
    })

    it('shows offset 141.5 when timeLeft is half of duration', () => {
      render(<TimerRing timeLeft={30} duration={60} intervalType="work" label="WORK" />)
      const circles = document.querySelectorAll('circle')
      const progress = circles[1]
      // timeLeft/duration=0.5 → offset = 283*(1-0.5) = 141.5
      expect(progress).toHaveAttribute('stroke-dashoffset', '141.5')
    })

    it('shows offset 283 when timeLeft is 0 (empty ring)', () => {
      render(<TimerRing timeLeft={0} duration={60} intervalType="work" label="WORK" />)
      const circles = document.querySelectorAll('circle')
      const progress = circles[1]
      // timeLeft/duration=0 → offset = 283*(1-0) = 283 (ring empty at countdown end)
      expect(progress).toHaveAttribute('stroke-dashoffset', '283')
    })
  })

  describe('interval type colors', () => {
    it('uses amber #F59E0B for prepare', () => {
      render(<TimerRing timeLeft={30} duration={60} intervalType="prepare" label="PREPARE" />)
      const circles = document.querySelectorAll('circle')
      expect(circles[1]).toHaveAttribute('stroke', '#F59E0B')
    })

    it('uses lime #84cc16 for work', () => {
      render(<TimerRing timeLeft={30} duration={60} intervalType="work" label="WORK" />)
      const circles = document.querySelectorAll('circle')
      expect(circles[1]).toHaveAttribute('stroke', '#84cc16')
    })

    it('uses coral #fb7185 for rest', () => {
      render(<TimerRing timeLeft={30} duration={60} intervalType="rest" label="REST" />)
      const circles = document.querySelectorAll('circle')
      expect(circles[1]).toHaveAttribute('stroke', '#fb7185')
    })

    it('uses indigo #818cf8 for cooldown', () => {
      render(<TimerRing timeLeft={30} duration={60} intervalType="cooldown" label="COOLDOWN" />)
      const circles = document.querySelectorAll('circle')
      expect(circles[1]).toHaveAttribute('stroke', '#818cf8')
    })
  })

  it('displays the interval type label in uppercase', () => {
    render(<TimerRing timeLeft={30} duration={60} intervalType="work" label="WORK" />)
    expect(screen.getByText('WORK')).toBeInTheDocument()
  })

  it('displays the timer value formatted as MM:SS', () => {
    render(<TimerRing timeLeft={125} duration={300} intervalType="work" label="WORK" />)
    expect(screen.getByText('02:05')).toBeInTheDocument()
  })

  it('displays "Next: Rest (00:30)" when nextLabel is provided', () => {
    render(
      <TimerRing
        timeLeft={30}
        duration={60}
        intervalType="work"
        label="WORK"
        nextLabel="Next: Rest (00:30)"
      />,
    )
    expect(screen.getByText('Next: Rest (00:30)')).toBeInTheDocument()
  })

  it('does not render a next label when nextLabel is undefined', () => {
    render(<TimerRing timeLeft={30} duration={60} intervalType="work" label="WORK" />)
    expect(screen.queryByText(/^Next:/)).not.toBeInTheDocument()
  })
})
