interface MiniCalendarProps {
  monday: string
  todayIndex: number
  weekPlanDays: (unknown | null)[]
  assignedDays: number
  weekProgress: number
}

export default function MiniCalendar({
  monday,
  todayIndex,
  weekPlanDays,
  assignedDays,
  weekProgress,
}: MiniCalendarProps) {
  return (
    <div className="md:col-span-4 rounded-xl glass-card p-24 flex flex-col justify-between min-h-[280px]">
      <div className="flex items-center justify-between mb-16">
        <h4 className="font-headline text-headline-md text-primary">This Week</h4>
      </div>
      <div className="grid grid-cols-7 gap-xs mb-auto">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center font-label text-label-caps text-on-surface-variant mb-xs">
            {d}
          </div>
        ))}
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday)
          d.setDate(d.getDate() + i)
          const dayNum = d.getDate()
          const isToday = i === todayIndex
          const hasAssignment = weekPlanDays[i] !== null
          return (
            <div key={i} className="flex flex-col items-center gap-1 cursor-pointer">
              {isToday ? (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="font-mono text-data-sm text-on-primary font-bold">{dayNum}</span>
                </div>
              ) : (
                <span className="font-mono text-data-sm text-on-surface-variant">{dayNum}</span>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${hasAssignment ? 'bg-secondary-container' : 'bg-transparent'}`} />
            </div>
          )
        })}
      </div>
      <div className="mt-16 pt-16 border-t border-outline-variant/30 flex justify-between items-center">
        <div>
          <p className="font-mono text-data-lg text-primary">{assignedDays} / 5</p>
          <p className="font-label text-label-caps text-on-surface-variant">DAYS PLANNED</p>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-surface-container relative flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 text-secondary-container" viewBox="0 0 36 36">
            <path
              className="stroke-current"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeDasharray="100"
              strokeDashoffset={100 - weekProgress}
              strokeLinecap="round"
              strokeWidth="4"
            />
          </svg>
          <span className="font-mono text-data-sm text-primary">{weekProgress}%</span>
        </div>
      </div>
    </div>
  )
}
