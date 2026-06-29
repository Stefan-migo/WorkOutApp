'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'complete'

// ponytail: setInterval + Date.now delta correction, upgrade to Web Workers if background-tab drift matters
export function useTimer(duration: number, onComplete?: () => void) {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(duration)
  const startTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0) // accumulated seconds before current pause
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const progress = duration > 0 ? Math.min(1, Math.max(0, 1 - timeLeft / duration)) : 0

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // cleanup on unmount
  useEffect(() => clearTimer, [clearTimer])

  const tick = useCallback(() => {
    const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current) / 1000
    const remaining = Math.max(0, Math.round(duration - elapsed))
    setTimeLeft(remaining)

    if (remaining <= 0) {
      clearTimer()
      setStatus('complete')
      onComplete?.()
    }
  }, [duration, onComplete, clearTimer])

  const start = useCallback(() => {
    clearTimer()
    setTimeLeft(duration)
    elapsedRef.current = 0
    startTimeRef.current = Date.now()
    setStatus('running')
    intervalRef.current = setInterval(tick, 1000)
  }, [duration, clearTimer, tick])

  const pause = useCallback(() => {
    if (status !== 'running') return
    clearTimer()
    elapsedRef.current += (Date.now() - startTimeRef.current) / 1000
    setStatus('paused')
  }, [status, clearTimer])

  const resume = useCallback(() => {
    if (status !== 'paused') return
    startTimeRef.current = Date.now()
    setStatus('running')
    intervalRef.current = setInterval(tick, 1000)
  }, [status, tick])

  const skip = useCallback(() => {
    clearTimer()
    setTimeLeft(0)
    setStatus('complete')
    onComplete?.()
  }, [clearTimer, onComplete])

  const reset = useCallback(() => {
    clearTimer()
    setTimeLeft(duration)
    elapsedRef.current = 0
    setStatus('idle')
  }, [duration, clearTimer])

  return { status, timeLeft, progress, start, pause, resume, skip, reset }
}
