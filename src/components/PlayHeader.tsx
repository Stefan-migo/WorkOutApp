'use client'

interface PlayHeaderProps {
  title: string
  onClose: () => void
}

export function PlayHeader({ title, onClose }: PlayHeaderProps) {
  return (
    <header className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop w-full border-b border-white/10 glass-panel-dark sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Close">
          <span className="material-symbols-outlined text-white">close</span>
        </button>
        <div>
          <h1 className="font-headline-md text-headline-md text-white font-bold tracking-tight">Active Session</h1>
          <p className="font-body-md text-body-md text-gray-400">{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-white">volume_up</span>
        <span className="material-symbols-outlined text-white">more_vert</span>
      </div>
    </header>
  )
}
