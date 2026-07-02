import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBeep } from '../useBeep'

afterEach(() => {
  vi.restoreAllMocks()
  // Re-assert jsdom default: AudioContext does not exist
  delete (window as unknown as Record<string, unknown>).AudioContext
})

function mockCtx() {
  const gain = {
    connect: vi.fn().mockReturnThis(),
    gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
  } as unknown as GainNode & { gain: { value: number; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> } }

  const osc = {
    connect: vi.fn().mockReturnValue(gain),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
  } as unknown as OscillatorNode & { frequency: { value: number } }

  const ctx = {
    createOscillator: vi.fn().mockReturnValue(osc),
    createGain: vi.fn().mockReturnValue(gain),
    destination: 'dest',
    currentTime: 0.5,
  } as unknown as AudioContext

  return { ctx, osc, gain }
}

describe('useBeep', () => {
  describe('AudioContext creation', () => {
    it('creates AudioContext with oscillator and gain wiring', () => {
      const { ctx, osc, gain } = mockCtx()
      // Use a real function constructor so `new` works correctly
      function MockAudioContext() {
        return ctx
      }
      window.AudioContext = MockAudioContext as unknown as typeof window.AudioContext
      const acSpy = vi.spyOn(window, 'AudioContext')

      const { result } = renderHook(() => useBeep())
      act(() => { result.current.beep() })

      expect(acSpy).toHaveBeenCalled()
      expect(ctx.createOscillator).toHaveBeenCalled()
      expect(ctx.createGain).toHaveBeenCalled()
      expect(osc.connect).toHaveBeenCalledWith(gain)
      expect(gain.connect).toHaveBeenCalledWith(ctx.destination)
      expect(osc.frequency.value).toBe(800)
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, ctx.currentTime + 0.3)
      expect(osc.start).toHaveBeenCalled()
      expect(osc.stop).toHaveBeenCalledWith(ctx.currentTime + 0.3)
    })
  })

  describe('graceful fallback', () => {
    it('does not throw when AudioContext is undefined', () => {
      // window.AudioContext already deleted by afterEach cleanup

      const { result } = renderHook(() => useBeep())
      expect(() => {
        act(() => { result.current.beep() })
      }).not.toThrow()
    })

    it('does not throw when AudioContext constructor throws', () => {
      function ThrowingAudioContext() {
        throw new Error('AudioContext not available')
      }
      window.AudioContext = ThrowingAudioContext as unknown as typeof window.AudioContext

      const { result } = renderHook(() => useBeep())
      expect(() => {
        act(() => { result.current.beep() })
      }).not.toThrow()
    })
  })

  describe('webkitAudioContext fallback', () => {
    it('falls back to webkitAudioContext when AudioContext is undefined', () => {
      const { ctx } = mockCtx()
      // Ensure AudioContext is absent
      delete (window as unknown as Record<string, unknown>).AudioContext
      ;(window as unknown as Record<string, unknown>).webkitAudioContext = vi.fn(function () {
        return ctx
      })

      const { result } = renderHook(() => useBeep())
      act(() => { result.current.beep() })

      expect((window as unknown as { webkitAudioContext: ReturnType<typeof vi.fn> }).webkitAudioContext).toHaveBeenCalled()
    })
  })

  describe('idempotent calls', () => {
    it('multiple beep() calls do not throw and create new AudioContext each time', () => {
      const { ctx } = mockCtx()
      let callCount = 0
      function CountingAudioContext() {
        callCount++
        return ctx
      }
      window.AudioContext = CountingAudioContext as unknown as typeof window.AudioContext

      const { result } = renderHook(() => useBeep())

      act(() => { result.current.beep() })
      act(() => { result.current.beep() })
      act(() => { result.current.beep() })

      expect(callCount).toBe(3)
      expect(() => result.current.beep()).not.toThrow()
    })
  })
})
