'use client'

import { useCallback } from 'react'

// ponytail: Browser Notification API native, zero deps
export function useIntervalNotification() {
  const notify = useCallback(
    (workoutName: string, currentInterval: number, totalIntervals: number) => {
      if (typeof Notification === 'undefined') return
      if (Notification.permission === 'denied') return

      // On first call, request permission without showing a notification
      // (NE-1: permission requested on first timer start gesture, not page load)
      if (Notification.permission === 'default') {
        Notification.requestPermission()
        return
      }

      // NE-2: only dispatch when tab is hidden
      if (document.hidden) {
        const n = new Notification(`WorkOutApp - ${workoutName}`, {
          body: `Interval ${currentInterval} of ${totalIntervals}`,
        })
        // NE-4: click focuses tab
        n.onclick = () => {
          window.focus()
          n.close()
        }
      }
    },
    [],
  )

  return { notify }
}
