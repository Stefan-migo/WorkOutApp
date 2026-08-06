'use client'

interface PlayHeaderProps {
  title: string
  onClose: () => void
}

export function PlayHeader({ title, onClose }: PlayHeaderProps) {
  return (
    <header className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop w-full border-b border-timer-border/50 glass-panel-dark sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-timer-on/10 transition-colors" aria-label="Close">
          <span className="material-symbols-outlined text-timer-on">close</span>
        </button>
        <div>
          <h1 className="font-headline-md text-headline-md text-timer-on font-bold tracking-tight">Active Session</h1>
          <p className="font-body-md text-body-md text-timer-muted">{title}</p>
        </div>
      </div>
    </header>
  )
}
