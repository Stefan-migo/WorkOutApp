interface HeatmapCell {
  date: string
  count: number
}

interface ConsistencyHeatmapProps {
  heatmap: HeatmapCell[][]
}

export default function ConsistencyHeatmap({ heatmap }: ConsistencyHeatmapProps) {
  return (
    <div className="glass-card flex min-w-0 flex-col gap-2 rounded-card p-4 md:col-span-7">
      <h3 className="text-lg font-semibold text-fg-2">
        Consistency
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Sessions over four weeks">
        {heatmap.flat().map(({ date, count }) => (
          <div
            key={date}
            role="img"
            aria-label={`${date}: ${count} session${count === 1 ? '' : 's'}`}
            title={`${date}: ${count} session${count === 1 ? '' : 's'}`}
            className={`h-5 rounded-sm ${count > 1 ? 'bg-accent' : count === 1 ? 'bg-accent/55' : 'bg-surface-warm'}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted">{heatmap.flat().filter(({ count }) => count > 0).length} active days in the last four weeks</p>
    </div>
  )
}
