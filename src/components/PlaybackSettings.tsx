'use client'

import { usePlaybackSettings } from '@/hooks/usePlaybackSettings'
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock'

export function PlaybackSettings({ active, onEnableSound }: { active: boolean; onEnableSound?: () => void }) {
  const { settings, updateSettings } = usePlaybackSettings()
  const wakeLock = useScreenWakeLock(active && settings.keepScreenOn)

  return (
    <details className="relative ml-auto shrink-0 text-timer-on">
      <summary className="cursor-pointer rounded-full p-3 focus-visible:focus-ring">
        Settings
      </summary>
      <div className="absolute right-0 top-full z-40 grid w-72 gap-4 rounded-lg border border-timer-border bg-timer-bg p-4 shadow-lg">
        <label className="flex items-center justify-between gap-3">
          Countdown sounds
          <input type="checkbox" checked={settings.sound} onChange={(event) => {
            if (event.target.checked) onEnableSound?.()
            updateSettings({ sound: event.target.checked })
          }} />
        </label>
        <p className="text-sm">Sound alerts are off while this app is in the background.</p>
        <label className="flex items-center justify-between gap-3">
          Keep screen awake
          <input type="checkbox" checked={settings.keepScreenOn} onChange={(event) => updateSettings({ keepScreenOn: event.target.checked })} />
        </label>
        {active && settings.keepScreenOn && (
          <p role="status" className="text-sm">
            {wakeLock === 'active' ? 'Screen will stay awake while this page is visible.' : 'Screen wake lock is unavailable. Check your device settings.'}
          </p>
        )}
      </div>
    </details>
  )
}
