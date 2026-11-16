'use client'

interface PlayHeaderProps {
  title: string
  onClose: () => void
}

export function PlayHeader({ title, onClose }: PlayHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[64px] w-full items-center gap-3 border-b border-timer-border bg-timer-bg px-margin-mobile md:px-margin-desktop">
      <button
        type="button"
        onClick={onClose}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-timer-border text-timer-on transition-colors hover:bg-timer-on/10 focus-visible:focus-ring"
        aria-label="Close"
      >
        <span aria-hidden="true" className="material-symbols-outlined">close</span>
      </button>
      <p className="truncate font-headline text-body-lg font-semibold text-timer-on">{title}</p>
    </header>
  )
}
