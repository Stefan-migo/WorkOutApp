'use client'

type ProgressVariant = 'plain' | 'futuristic' | 'segmented'
type ProgressSize = 'sm' | 'md' | 'lg'

interface ProgressBarProps {
  progress: number
  label?: string
  dark?: boolean
  variant?: ProgressVariant
  size?: ProgressSize
  showTicks?: boolean
  className?: string
}

const HEIGHTS: Record<ProgressSize, string> = {
  sm: 'h-2.5',
  md: 'h-4',
  lg: 'h-6',
}

const TICKS = [25, 50, 75]

// ponytail: pure CSS bar, upgrade to canvas/SVG if gradient segments per interval type are needed
export function ProgressBar({
  progress,
  label,
  dark,
  variant = 'futuristic',
  size = 'md',
  showTicks = true,
  className,
}: ProgressBarProps) {
  const raw = progress <= 1 ? progress * 100 : progress
  const pct = Math.min(100, Math.max(0, Math.round(raw)))

  if (variant === 'futuristic') {
    const height = HEIGHTS[size]
    return (
      <div
        className={`relative w-full select-none ${className ?? ''}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={`relative w-full overflow-hidden rounded-full transition-all duration-300 ${height} ${
            dark
              ? 'bg-surface border border-border-soft/50 shadow-[inset_0_2px_4px_var(--color-surface)] backdrop-blur-md'
              : 'bg-surface/60 border border-border-soft/50 shadow-inner'
          }`}
        >
          {/* Slat micro-grid texture */}
          <div
            className="absolute inset-0 opacity-20 z-10"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent 5px, var(--color-border-soft) 5px, var(--color-border-soft) 7px)',
            }}
          />
          {/* Milestone ticks */}
          {showTicks && pct > 0 && (
            <div className="absolute inset-0 z-10">
              {TICKS.map((tick) => (
                <div
                  key={tick}
                  className={`absolute top-0 h-full ${pct >= tick ? 'bg-accent' : 'bg-border-soft/60'}`}
                  style={{ left: `${tick}%`, width: 1 }}
                />
              ))}
            </div>
          )}
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_0_14px_var(--color-accent)] transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
          {/* Shimmer streak inside the fill */}
          <div
            className="absolute inset-0 opacity-60 animate-[progressShimmer_2.5s_infinite_linear]"
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-fg-2) 60%, transparent) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
          {/* Leading energy node */}
          {pct > 0 && pct < 100 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 z-20"
              style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-accent/75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-fg shadow-[0_0_10px_var(--color-accent),0_0_20px_var(--color-accent)]" />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'segmented') {
    const height = HEIGHTS[size]
    const activeSegments = Math.round((pct / 100) * 20)
    return (
      <div
        className={`flex gap-1 ${className ?? ''}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        {Array.from({ length: 20 }, (_, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-sm transition-all duration-300 ${height} ${
              idx < activeSegments
                ? `bg-accent shadow-[0_0_8px_var(--color-accent)]${
                    idx === activeSegments - 1 ? ' scale-y-110 bg-fg shadow-[0_0_12px_var(--color-accent)]' : ''
                  }`
                : dark
                  ? 'bg-surface border border-border-soft/50'
                  : 'bg-border/40'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      {label && <span className={`text-sm mb-1 block ${dark ? 'text-timer-muted' : 'text-muted'}`}>{label}</span>}
      <div
        className={`w-full rounded-full overflow-hidden ${dark ? 'bg-timer-track h-2' : 'bg-surface min-h-[44px] flex items-center'}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={`rounded-full transition-all duration-500 ease-out ${dark ? 'h-2 bg-timer-on' : 'h-3 bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
