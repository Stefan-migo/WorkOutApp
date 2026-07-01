import Link from 'next/link'

interface UpNextCardProps {
  totalSessions: number
  thisWeekSessions: number
}

export default function UpNextCard({ totalSessions, thisWeekSessions }: UpNextCardProps) {
  return (
    <div className="md:col-span-12">
      <h4 className="font-headline text-headline-md text-primary mb-16">Up Next</h4>
      <div className="glass-card rounded-xl p-16 flex flex-col md:flex-row items-center justify-between gap-16 border-l-4 border-l-primary-fixed-dim hover:bg-surface-variant/30 transition-colors">
        {totalSessions > 0 ? (
          <>
            <div className="flex items-center gap-24 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center bg-surface w-16 h-16 rounded-lg border border-outline-variant/30 shrink-0">
                <span className="font-mono text-data-sm text-on-surface-variant">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                </span>
                <span className="font-mono text-data-lg text-primary font-bold">
                  {new Date().getDate()}
                </span>
              </div>
              <div>
                <h5 className="font-headline text-body-lg font-bold text-primary">
                  {totalSessions > 0
                    ? `${totalSessions} Session${totalSessions !== 1 && 's'} Completed`
                    : 'No sessions yet'}
                </h5>
                <div className="flex items-center gap-8 mt-1">
                  <span className="material-symbols-outlined text-data-sm text-on-surface-variant">schedule</span>
                  <span className="font-mono text-data-sm text-on-surface-variant text-[12px]">
                    {thisWeekSessions} this week
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={totalSessions > 0 ? '/history' : '/workouts/new'}
              className="w-full md:w-auto px-24 py-8 rounded-full border border-outline-variant text-primary font-label text-label-caps hover:bg-primary-container hover:text-on-primary transition-colors text-center focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              {totalSessions > 0 ? 'VIEW HISTORY' : 'CREATE FIRST'}
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-24 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center bg-surface w-16 h-16 rounded-lg border border-outline-variant/30 shrink-0">
                <span className="material-symbols-outlined text-[28px] text-on-surface-variant">fitness_center</span>
              </div>
              <div>
                <h5 className="font-headline text-body-lg font-bold text-primary">Get Started</h5>
                <p className="font-body text-body-md text-on-surface-variant mt-1">
                  Create your first workout to start training
                </p>
              </div>
            </div>
            <Link
              href="/workouts/new"
              className="w-full md:w-auto px-24 py-8 rounded-full bg-primary-container text-on-primary font-label text-label-caps hover:bg-primary transition-colors text-center focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              CREATE WORKOUT
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
