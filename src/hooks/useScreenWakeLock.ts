'use client'

import { useEffect, useState } from 'react'

export function useScreenWakeLock(enabled: boolean) {
  const [state, setState] = useState<'off' | 'active' | 'unavailable'>('off')

  useEffect(() => {
    if (!enabled) {
      setState('off')
      return
    }
    let disposed = false
    let pending = false
    let lock: WakeLockSentinel | undefined
    async function acquire() {
      if (disposed || pending || (lock && !lock.released) || document.visibilityState !== 'visible') return
      if (!navigator.wakeLock) {
        setState('unavailable')
        return
      }
      pending = true
      try {
        const acquired = await navigator.wakeLock.request('screen')
        if (disposed) {
          await acquired.release()
          return
        }
        lock = acquired
        setState('active')
        acquired.addEventListener('release', () => {
          if (!disposed) setState('unavailable')
        })
      } catch {
        if (!disposed) setState('unavailable')
      } finally {
        pending = false
      }
    }
    void acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release().catch(() => undefined)
    }
  }, [enabled])

  return state
}
