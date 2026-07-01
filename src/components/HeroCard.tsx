import Link from 'next/link'
import type { Workout } from '@/types/workout'

interface HeroCardProps {
  todayWorkout: Workout | null | undefined
  workoutCount: number
  totalSessions: number
}

export default function HeroCard({ todayWorkout, workoutCount, totalSessions }: HeroCardProps) {
  return (
    <div className="md:col-span-8 rounded-xl overflow-hidden glass-card relative min-h-[280px] flex flex-col justify-end p-24 group transition-transform duration-300 hover:-translate-y-1 ambient-shadow border-l-4 border-l-secondary-container">
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23091426\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
      />
      <div className="relative z-10 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-24">
        <div>
          <div className="flex gap-8 mb-8">
            <span className="bg-surface-tint/10 text-primary-container px-8 py-1 rounded-full font-label text-label-caps tracking-wider border border-outline-variant/20 backdrop-blur-md">
              {todayWorkout ? 'TODAY' : 'WELCOME'}
            </span>
            <span className="bg-surface-tint/10 text-primary-container px-8 py-1 rounded-full font-label text-label-caps tracking-wider border border-outline-variant/20 backdrop-blur-md">
              {workoutCount} WORKOUT{workoutCount !== 1 && 'S'}
            </span>
          </div>
          <h3 className="font-headline text-headline-lg text-primary mb-xs tracking-tight">
            {todayWorkout?.title ?? 'Ready to train?'}
          </h3>
          <p className="font-body text-body-md text-on-surface-variant max-w-md">
            {todayWorkout
              ? `${todayWorkout.intervals.length} intervals · ${Math.floor(
                  todayWorkout.intervals.reduce((s, i) => s + i.duration, 0) / 60
                )} min`
              : totalSessions > 0
                ? `${totalSessions} session${totalSessions !== 1 && 's'} completed. Keep the momentum!`
                : 'Create your first workout and start your journey.'}
          </p>
        </div>
        {todayWorkout && (
          <Link
            href={`/workouts/${todayWorkout.id}/play`}
            className="shrink-0 bg-primary-container text-on-primary rounded-full w-20 h-20 flex items-center justify-center ambient-shadow hover:bg-primary transition-all duration-300 hover:scale-105 active:scale-95 group/btn focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            <span className="font-label text-label-caps font-bold tracking-widest group-hover/btn:hidden">START</span>
            <span className="material-symbols-outlined text-[32px] hidden group-hover/btn:block">play_arrow</span>
          </Link>
        )}
      </div>
    </div>
  )
}
