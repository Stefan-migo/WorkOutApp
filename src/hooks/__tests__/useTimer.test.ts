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
