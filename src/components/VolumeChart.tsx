interface WeeklyVolume {
  weekLabel: string
  totalSeconds: number
}

interface VolumeChartProps {
  recentVolume: WeeklyVolume[]
  maxVolume: number
  formatHours: (sec: number) => string
}

export default function VolumeChart({ recentVolume, maxVolume, formatHours }: VolumeChartProps) {
  return (
    <div className="md:col-span-8 glass-card rounded-xl p-16 flex flex-col h-96 ambient-shadow">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-16">
        Volume per Week
      </h3>
      {/* ponytail: CSS div bars, no chart library */}
      <div className="flex-1 w-full bg-surface-container-lowest rounded-lg border border-outline-variant/30 flex items-end p-8 gap-2 relative overflow-hidden">
        {recentVolume.map((w) => {
          const pct = (w.totalSeconds / maxVolume) * 100
          const isTop = w.totalSeconds === maxVolume
          return (
            <div
              key={w.weekLabel}
              className="flex-1 h-full flex flex-col justify-end group relative"
            >
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isTop ? 'bg-primary' : 'bg-primary-fixed-dim'
                }`}
                style={{ height: `${Math.max(pct, 1)}%` }}
              >
                {/* ponytail: CSS-only tooltip, no library */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-tertiary text-on-tertiary font-data-sm text-data-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {formatHours(w.totalSeconds)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 font-data-sm text-data-sm text-on-surface-variant px-8">
        {recentVolume.map((w, i) => (
          <span key={w.weekLabel}>Wk {i + 1}</span>
        ))}
      </div>
    </div>
  )
}
