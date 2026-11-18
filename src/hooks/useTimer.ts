'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'complete'

export function useTimer(duration: number, onComplete?: () => void, onTick?: (remaining: number) => void) {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(duration)
  const startTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0) // accumulated seconds before current pause
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastRemainingRef = useRef(duration)
  const callbacksRef = useRef({ onComplete, onTick })

  useEffect(() => {
    callbacksRef.current = { onComplete, onTick }
  }, [onComplete, onTick])

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
    if (intervalRef.current === null) return
    const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current) / 1000
    const remaining = Math.max(0, Math.min(duration, Math.ceil(duration - elapsed)))
    setTimeLeft(remaining)
    if (remaining !== lastRemainingRef.current) {
      lastRemainingRef.current = remaining
      callbacksRef.current.onTick?.(remaining)
    }

    if (remaining <= 0) {
      clearTimer()
      setStatus('complete')
      callbacksRef.current.onComplete?.()
    }
  }, [duration, clearTimer])

  useEffect(() => {
    if (status !== 'running') return
    const syncOnReturn = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', syncOnReturn)
    return () => document.removeEventListener('visibilitychange', syncOnReturn)
  }, [status, tick])

  const start = useCallback(() => {
    clearTimer()
    setTimeLeft(duration)
    elapsedRef.current = 0
    startTimeRef.current = Date.now()
    lastRemainingRef.current = duration
    setStatus('running')
    intervalRef.current = setInterval(tick, 1000)
    if (duration > 0) callbacksRef.current.onTick?.(duration)
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

  // ponytail: single-thread assumption, concurrent addTime calls could race
  const addTime = useCallback((delta: number) => {
    setTimeLeft((prev) => {
      const next = Math.max(0, Math.min(duration, prev + delta))
      const adj = prev - next // positive when rewinding
      elapsedRef.current += adj
      return next
    })
  }, [duration])

  const reset = useCallback(() => {
    clearTimer()
    setTimeLeft(duration)
    elapsedRef.current = 0
    setStatus('idle')
  }, [duration, clearTimer])

  return { status, timeLeft, progress, start, pause, resume, skip, addTime, reset }
}
