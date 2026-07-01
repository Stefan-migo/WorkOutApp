interface HeatmapCell {
  date: string
  count: number
}

interface ConsistencyHeatmapProps {
  heatmap: HeatmapCell[][]
}

export default function ConsistencyHeatmap({ heatmap }: ConsistencyHeatmapProps) {
  return (
    <div className="md:col-span-7 glass-card rounded-xl p-16 h-48 ambient-shadow flex flex-col">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-8">
        Consistency
      </h3>
      <div className="flex-1 grid grid-cols-7 gap-1 auto-rows-fr">
        {heatmap.flat().map((cell) => {
          let bgClass = 'bg-surface-variant'
          if (cell.count > 1) bgClass = 'bg-primary'
          else if (cell.count === 1) bgClass = 'bg-primary/50'
          return (
            <div
              key={cell.date}
              className={`${bgClass} rounded-sm w-full h-full opacity-80 hover:opacity-100 transition-opacity`}
            />
          )
        })}
      </div>
      <div className="flex justify-between mt-2 font-data-sm text-data-sm text-on-surface-variant">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span>
        <span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  )
}
