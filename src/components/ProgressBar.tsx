'use client'

interface ProgressBarProps {
  progress: number
  label?: string
  dark?: boolean
}

// ponytail: pure CSS bar, upgrade to canvas/SVG if gradient segments per interval type are needed
export function ProgressBar({ progress, label, dark }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)))

  return (
    <div className="w-full">
      {label && <span className={`text-sm mb-1 block ${dark ? 'text-gray-400' : 'text-muted'}`}>{label}</span>}
      <div
        className={`w-full rounded-full overflow-hidden ${dark ? 'bg-[#1E293B] h-2' : 'bg-border min-h-[44px] flex items-center'}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={`rounded-full transition-all duration-500 ease-out ${dark ? 'h-2 bg-white' : 'h-3 bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
