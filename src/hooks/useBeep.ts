'use client'

import { useCallback, useRef } from 'react'

interface BeepOptions {
  volume?: number
  duration?: number
  pitch?: number
}

// ponytail: Web Audio API native, zero dependencies, zero audio files
export function useBeep() {
  // Reuse one AudioContext across beeps to avoid creating N contexts per countdown
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  const beep = useCallback((opts?: BeepOptions) => {
    const vol = opts?.volume ?? 0.3
    const dur = opts?.duration ?? 0.3
    const pitch = opts?.pitch ?? 800
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = pitch
      // Ramp down for a clean cutoff instead of an abrupt stop
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + dur)
    } catch {
      // Audio not available — silently skip
    }
  }, [getCtx])

  return { beep }
}
