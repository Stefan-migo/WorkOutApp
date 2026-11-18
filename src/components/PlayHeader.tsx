'use client'

import { PlaybackSettings } from './PlaybackSettings'

interface PlayHeaderProps {
  title: string
  onClose: () => void
  active?: boolean
  onEnableSound?: () => void
}

export function PlayHeader({ title, onClose, active = false, onEnableSound }: PlayHeaderProps) {
  return (
    <>
    <header className="sticky top-0 z-30 flex min-h-[64px] w-full items-center gap-3 border-b border-timer-border bg-timer-bg px-margin-mobile md:px-margin-desktop">
      <button
        type="button"
        onClick={onClose}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-timer-border text-timer-on transition-colors hover:bg-timer-on/10 focus-visible:focus-ring"
        aria-label="Close"
      >
        <span aria-hidden="true" className="material-symbols-outlined">close</span>
      </button>
      <p className="min-w-0 truncate font-headline text-body-lg font-semibold text-timer-on">{title}</p>
      <PlaybackSettings active={active} onEnableSound={onEnableSound} />
    </header>
    {!active && (
      <p className="border-b border-timer-border bg-timer-bg px-margin-mobile py-3 text-sm text-timer-on md:px-margin-desktop">
        You can switch apps to start your music, then return to your workout. Sound alerts are off while this app is in the background.
      </p>
    )}
    </>
  )
}
