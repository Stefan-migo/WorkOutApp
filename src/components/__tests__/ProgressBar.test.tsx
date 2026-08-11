import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ProgressBar } from '../ProgressBar'

afterEach(cleanup)

describe('ProgressBar', () => {
  describe('default (no variant) renders the futuristic bar', () => {
    it('renders aria-valuenow 62, a bg-accent fill, and ticks by default', () => {
      const { container } = render(<ProgressBar progress={0.62} />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
      expect(container.querySelector('[style*="width: 62%"]')).toHaveClass('bg-accent')
      expect(container.querySelector('[style*="left: 50%"]')).toBeInTheDocument()
    })

    it('auto-detects a 0..100 value and clamps out-of-range fractions', () => {
      const { rerender, container } = render(<ProgressBar progress={62} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')

      rerender(<ProgressBar progress={150} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
      expect(container.querySelector('[style*="100%"]')).toBeInTheDocument()

      rerender(<ProgressBar progress={-5} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    })
  })

  describe('plain variant (old default flat bar)', () => {
    it('renders the label, aria-valuenow, and the flat fill width', () => {
      const { container } = render(<ProgressBar variant="plain" progress={0.62} label="Total Progress" />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')
      expect(screen.getByText('Total Progress')).toBeInTheDocument()
      expect(container.querySelector('[style*="62%"]')).toBeInTheDocument()
    })

    it('renders a bg-timer-track track with a bg-timer-on fill for dark', () => {
      const { container } = render(<ProgressBar variant="plain" progress={0.62} dark />)

      expect(container.querySelector('.bg-timer-track')).toBeInTheDocument()
      expect(container.querySelector('[style*="width: 62%"]')).toHaveClass('bg-timer-on')
    })
  })

  describe('futuristic variant', () => {
    it('renders progressbar, a tick at 50%, the accent fill, and a node mid-progress', () => {
      const { container } = render(<ProgressBar variant="futuristic" progress={0.62} />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62')

      const tickAt50 = container.querySelector('[style*="left: 50%"]')
      expect(tickAt50).toBeInTheDocument()
      expect(tickAt50).toHaveClass('bg-accent')

      const fill = container.querySelector('[style*="width: 62%"]')
      expect(fill).toBeInTheDocument()
      expect(fill).toHaveClass('bg-accent')
      expect(fill).not.toHaveClass('bg-success')

      expect(container.querySelector('.animate-ping')).toBeInTheDocument()
    })

    it('hides the node at full progress and active ticks past 100', () => {
      const { container } = render(<ProgressBar variant="futuristic" progress={1} />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
      expect(container.querySelector('.animate-ping')).not.toBeInTheDocument()

      const tickAt50 = container.querySelector('[style*="left: 50%"]')
      expect(tickAt50).toHaveClass('bg-accent')
      const tickAt75 = container.querySelector('[style*="left: 75%"]')
      expect(tickAt75).toHaveClass('bg-accent')
    })

    it('skips ticks when showTicks is false', () => {
      const { container } = render(<ProgressBar variant="futuristic" progress={0.62} showTicks={false} />)

      expect(container.querySelector('[style*="left: 50%"]')).not.toBeInTheDocument()
      expect(container.querySelector('[style*="left: 75%"]')).not.toBeInTheDocument()
    })

    it('swaps the dark track for the light track', () => {
      const dark = render(<ProgressBar variant="futuristic" progress={0.5} dark />)
      expect(dark.container.querySelector('.backdrop-blur-md')).toBeInTheDocument()
      expect(dark.container.querySelector('.bg-surface\\/60')).not.toBeInTheDocument()

      const light = render(<ProgressBar variant="futuristic" progress={0.5} dark={false} />)
      expect(light.container.querySelector('.backdrop-blur-md')).not.toBeInTheDocument()
      expect(light.container.querySelector('.bg-surface\\/60')).toBeInTheDocument()
    })
  })

  describe('segmented variant', () => {
    it('renders 20 cells with the active count derived from progress', () => {
      render(<ProgressBar variant="segmented" progress={0.62} />)

      const bar = screen.getByRole('progressbar')
      expect(bar).toHaveAttribute('aria-valuenow', '62')
      expect(bar.children).toHaveLength(20)
      expect(bar.querySelectorAll('.bg-accent')).toHaveLength(12)
    })

    it('lights every cell at full progress', () => {
      render(<ProgressBar variant="segmented" progress={1} />)
      const bar = screen.getByRole('progressbar')
      expect(bar.children).toHaveLength(20)
      expect(bar.querySelectorAll('.bg-accent')).toHaveLength(20)
    })

    it('lights no cells at zero progress', () => {
      render(<ProgressBar variant="segmented" progress={0} />)
      expect(screen.getByRole('progressbar').querySelectorAll('.bg-accent')).toHaveLength(0)
    })
  })
})
