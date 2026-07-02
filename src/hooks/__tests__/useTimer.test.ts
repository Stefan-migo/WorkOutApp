import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../useTimer'

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimer — addTime', () => {
  describe('adds positive delta', () => {
    it('adds 10 seconds to timeLeft capped at duration', () => {
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      // timer starts at 60, simulate 15s elapsed
      act(() => { result.current.addTime(10) })
      // when paused/idle, timeLeft stays at duration (60)
      // after start + addTime(10) while running: 60 + 10 = 60 (capped)
      expect(result.current.timeLeft).toBe(60)
    })

    it('clips at duration when delta would overshoot', () => {
      // Start paused, set initial state by pausing after short tick isn't reliable
      // Instead test the clipping via addTime on a running timer near duration
      const { result } = renderHook(() => useTimer(30))

      act(() => { result.current.start() })
      // timeLeft starts at 30
      act(() => { result.current.addTime(999) })
      // 30 + 999 capped at 30
      expect(result.current.timeLeft).toBe(30)
    })
  })

  describe('subtracts delta (rewind)', () => {
    it('subtracts 10 seconds from timeLeft', () => {
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      // start at 60
      act(() => { result.current.addTime(-10) })
      expect(result.current.timeLeft).toBe(50)
    })

    it('clips at 0 when subtracting more than remaining', () => {
      const { result } = renderHook(() => useTimer(10))

      act(() => { result.current.start() })
      // start at 10
      act(() => { result.current.addTime(-999) })
      expect(result.current.timeLeft).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('addTime(0) is a no-op', () => {
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      act(() => { result.current.addTime(0) })
      expect(result.current.timeLeft).toBe(60)
    })

    it('addTime works when timer is paused', () => {
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      act(() => { result.current.pause() })
      // paused at 60
      act(() => { result.current.addTime(-15) })
      expect(result.current.timeLeft).toBe(45)

      // resume should not jump — drift preserved via elapsedRef
      act(() => { result.current.addTime(10) })
      expect(result.current.timeLeft).toBe(55)
    })
  })

  describe('preserves drift correction', () => {
    it('maintains correct timeLeft after addTime when timer continues running', () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() }) // timeLeft = 60
      act(() => { vi.advanceTimersByTime(5000) }) // 5s pass → timeLeft = 55
      expect(result.current.timeLeft).toBe(55)

      act(() => { result.current.addTime(-10) }) // rewind 10 → timeLeft = 45
      expect(result.current.timeLeft).toBe(45)

      act(() => { vi.advanceTimersByTime(3000) }) // 3 more seconds pass
      expect(result.current.timeLeft).toBe(42) // 45 - 3 = 42
    })
  })
})

describe('useTimer — state machine, completion & edge cases', () => {
  describe('start/pause/resume', () => {
    it('start() sets status to running and timeLeft to duration', () => {
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })

      expect(result.current.status).toBe('running')
      expect(result.current.timeLeft).toBe(60)
    })

    it('pause/resume round-trip preserves correct timeLeft', () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      act(() => { vi.advanceTimersByTime(5000) })
      expect(result.current.timeLeft).toBe(55)

      act(() => { result.current.pause() })
      expect(result.current.status).toBe('paused')

      act(() => { result.current.resume() })
      expect(result.current.status).toBe('running')

      act(() => { vi.advanceTimersByTime(3000) })
      expect(result.current.timeLeft).toBe(52) // 55 - 3 = 52
    })

    it('pause() when idle is a no-op — status stays idle', () => {
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.pause() })

      expect(result.current.status).toBe('idle')
      expect(result.current.timeLeft).toBe(60)
    })
  })

  describe('skip', () => {
    it('skip() transitions to complete, timeLeft=0, calls onComplete', () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() => useTimer(60, onComplete))

      act(() => { result.current.start() })
      act(() => { result.current.skip() })

      expect(result.current.status).toBe('complete')
      expect(result.current.timeLeft).toBe(0)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('reset', () => {
    it('reset() returns to idle and restores timeLeft to duration', () => {
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      act(() => { result.current.skip() })
      expect(result.current.status).toBe('complete')

      act(() => { result.current.reset() })

      expect(result.current.status).toBe('idle')
      expect(result.current.timeLeft).toBe(60)
    })
  })

  describe('natural completion', () => {
    it('advancing past duration triggers complete status and onComplete', () => {
      vi.useFakeTimers()
      const onComplete = vi.fn()
      const { result } = renderHook(() => useTimer(5, onComplete))

      act(() => { result.current.start() })
      act(() => { vi.advanceTimersByTime(6000) }) // past 5s

      expect(result.current.status).toBe('complete')
      expect(result.current.timeLeft).toBe(0)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('onComplete callback contract', () => {
    it('called exactly once on skip', () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() => useTimer(60, onComplete))

      act(() => { result.current.start() })
      act(() => { result.current.skip() })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('called exactly once on natural completion', () => {
      vi.useFakeTimers()
      const onComplete = vi.fn()
      const { result } = renderHook(() => useTimer(5, onComplete))

      act(() => { result.current.start() })
      act(() => { vi.advanceTimersByTime(6000) })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('progress', () => {
    it('is 0 when timer starts', () => {
      const { result } = renderHook(() => useTimer(60))

      expect(result.current.progress).toBe(0)
    })

    it('is approximately 0.5 at midpoint of duration', () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      act(() => { vi.advanceTimersByTime(30000) })

      expect(result.current.timeLeft).toBe(30)
      expect(result.current.progress).toBeCloseTo(0.5, 1)
    })

    it('is 1 when timer completes', () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useTimer(5))

      act(() => { result.current.start() })
      act(() => { vi.advanceTimersByTime(6000) })

      expect(result.current.progress).toBe(1)
    })
  })

  describe('duration=0 edge case', () => {
    it('completes immediately after advancing tick', () => {
      vi.useFakeTimers()
      const onComplete = vi.fn()
      const { result } = renderHook(() => useTimer(0, onComplete))

      act(() => { result.current.start() })
      expect(result.current.status).toBe('running')
      expect(result.current.timeLeft).toBe(0)

      act(() => { vi.advanceTimersByTime(1000) })
      expect(result.current.status).toBe('complete')
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('has progress 0', () => {
      const { result } = renderHook(() => useTimer(0))
      expect(result.current.progress).toBe(0)
    })
  })

  describe('cleanup on unmount', () => {
    it('clears interval and does not cause errors after unmount', () => {
      vi.useFakeTimers()
      // ponytail: spy on console.error to detect React warnings from setState after unmount
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result, unmount } = renderHook(() => useTimer(60))

      act(() => { result.current.start() })
      // Simulate some time passing
      act(() => { vi.advanceTimersByTime(5000) })
      unmount()

      // Advancing timers after unmount should not trigger state updates
      act(() => { vi.advanceTimersByTime(60000) })

      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})
