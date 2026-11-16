'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error) => {
      console.warn('Baronda could not register the service worker', error)
    })
  }, [])

  return null
}
