'use client'

import { useCallback, useEffect, useRef } from 'react'

interface BeepOptions {
  volume?: number
  duration?: number
  pitch?: number
}

// ponytail: Web Audio API native, zero dependencies, zero audio files
export function useBeep(enabled = true) {
  // Reuse one AudioContext across beeps to avoid creating N contexts per countdown
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  useEffect(() => () => {
    const ctx = ctxRef.current
    ctxRef.current = null
    void ctx?.close?.().catch(() => undefined)
  }, [])

  const unlock = useCallback(() => {
    try {
      const ctx = getCtx()
      if (ctx.state !== 'running') void ctx.resume().catch(() => undefined)
    } catch {
      // The browser may not provide Web Audio.
    }
  }, [getCtx])

  useEffect(() => {
    const resumeOnReturn = () => {
      const ctx = ctxRef.current
      if (enabled && document.visibilityState === 'visible' && ctx?.state === 'suspended') {
        void ctx.resume().catch(() => undefined)
      }
    }
    document.addEventListener('visibilitychange', resumeOnReturn)
    return () => document.removeEventListener('visibilitychange', resumeOnReturn)
  }, [enabled])

  const beep = useCallback((opts?: BeepOptions) => {
    if (!enabled || document.visibilityState !== 'visible') return
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
  }, [enabled, getCtx])

  return { beep, unlock }
}
