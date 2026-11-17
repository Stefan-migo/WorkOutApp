import { formatDuration } from '@/lib/format'

interface VolumeChartProps {
  recentVolume: { weekLabel: string; totalSeconds: number }[]
  maxVolume: number
}

function weekStart(label: string) {
  const [year, week] = label.split('-W').map(Number)
  const january4 = new Date(year!, 0, 4, 12)
  january4.setDate(4 - ((january4.getDay() + 6) % 7) + (week! - 1) * 7)
  return january4.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function VolumeChart({ recentVolume, maxVolume }: VolumeChartProps) {
  return (
    <section className="glass-card min-w-0 rounded-card p-4 md:col-span-8">
      <h3 className="mb-3 text-lg font-semibold text-fg-2">Volume per Week</h3>
      <ul className="grid grid-cols-4 gap-2">
        {recentVolume.map(({ weekLabel, totalSeconds }) => (
          <li key={weekLabel} className="flex min-w-0 flex-col items-center gap-1.5">
            <span className="text-xs font-semibold tabular-nums text-fg-2">{formatDuration(totalSeconds)}</span>
            <div aria-hidden="true" className="flex h-24 w-full items-end rounded-control bg-surface-warm p-1 sm:h-32">
              <div className="w-full rounded-sm bg-accent" style={{ height: totalSeconds ? `max(3px, ${totalSeconds / maxVolume * 100}%)` : 0 }} />
            </div>
            <span className="text-center text-xs text-muted">{weekStart(weekLabel)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
