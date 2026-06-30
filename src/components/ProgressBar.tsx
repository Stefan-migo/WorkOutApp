'use client'

interface ProgressBarProps {
  progress: number
  label?: string
}

// ponytail: pure CSS bar, upgrade to canvas/SVG if gradient segments per interval type are needed
export function ProgressBar({ progress, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)))

  return (
    <div className="w-full">
      {label && <span className="text-sm text-muted mb-1 block">{label}</span>}
      <div
        className="w-full bg-border rounded-full overflow-hidden min-h-[44px] flex items-center"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className="h-3 bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
