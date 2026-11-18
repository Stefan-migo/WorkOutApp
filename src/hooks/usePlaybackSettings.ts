'use client'

import { useSyncExternalStore } from 'react'

const key = 'workoutapp.playback-settings'
const defaults = { sound: true, keepScreenOn: true }
type PlaybackSettings = typeof defaults
let cachedRaw: string | null = null
let cachedSettings = defaults

function getSnapshot(): PlaybackSettings {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== cachedRaw) {
      const value = JSON.parse(raw ?? '{}')
      cachedSettings = {
        sound: typeof value?.sound === 'boolean' ? value.sound : true,
        keepScreenOn: typeof value?.keepScreenOn === 'boolean' ? value.keepScreenOn : true,
      }
      cachedRaw = raw
    }
  } catch {
    // Keep the current preferences when storage is unavailable.
  }
  return cachedSettings
}

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener('playback-settings', listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener('playback-settings', listener)
  }
}

export function usePlaybackSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => defaults)
  function updateSettings(patch: Partial<PlaybackSettings>) {
    cachedSettings = { ...getSnapshot(), ...patch }
    try {
      cachedRaw = JSON.stringify(cachedSettings)
      localStorage.setItem(key, cachedRaw)
    } catch {
      // Settings still apply for this session.
    }
    window.dispatchEvent(new Event('playback-settings'))
  }
  return { settings, updateSettings }
}
