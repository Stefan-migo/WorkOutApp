import Link from 'next/link'

interface UpNextCardProps {
  totalSessions: number
  thisWeekSessions: number
}

export default function UpNextCard({ totalSessions, thisWeekSessions }: UpNextCardProps) {
  return (
    <div className="md:col-span-12">
      <h4 className="font-headline text-headline-md text-accent mb-16">Up Next</h4>
      <div className="glass-card rounded-xl p-16 flex flex-col md:flex-row items-center justify-between gap-16 border-l-4 border-l-accent hover:bg-surface/30 transition-colors">
        {totalSessions > 0 ? (
          <>
            <div className="flex items-center gap-24 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center bg-surface w-16 h-16 rounded-lg border border-border-soft shrink-0">
                <span className="font-mono text-data-sm text-muted">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                </span>
                <span className="font-mono text-data-lg text-accent font-bold">
                  {new Date().getDate()}
                </span>
              </div>
              <div>
                <h5 className="font-headline text-body-lg font-bold text-accent">
                  {totalSessions > 0
                    ? `${totalSessions} Session${totalSessions !== 1 && 's'} Completed`
                    : 'No sessions yet'}
                </h5>
                <div className="flex items-center gap-8 mt-1">
                  <span className="material-symbols-outlined text-data-sm text-muted">schedule</span>
                  <span className="font-mono text-data-sm text-muted text-[12px]">
                    {thisWeekSessions} this week
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={totalSessions > 0 ? '/history' : '/workouts/new'}
              className="w-full md:w-auto px-24 py-8 rounded-full border border-border text-accent font-label text-label-caps hover:bg-accent hover:text-accent-on transition-colors text-center focus-visible:focus-ring"
            >
              {totalSessions > 0 ? 'VIEW HISTORY' : 'CREATE FIRST'}
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-24 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center bg-surface w-16 h-16 rounded-lg border border-border-soft shrink-0">
                <span className="material-symbols-outlined text-[28px] text-muted">fitness_center</span>
              </div>
              <div>
                <h5 className="font-headline text-body-lg font-bold text-accent">Get Started</h5>
                <p className="font-body text-body-md text-muted mt-1">
                  Create your first workout to start training
                </p>
              </div>
            </div>
            <Link
              href="/workouts/new"
              className="w-full md:w-auto px-24 py-8 rounded-full bg-accent text-accent-on font-label text-label-caps hover:bg-accent-hover transition-colors text-center focus-visible:focus-ring"
            >
              CREATE WORKOUT
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
