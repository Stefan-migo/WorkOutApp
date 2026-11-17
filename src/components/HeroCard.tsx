import Link from 'next/link'

interface HeroCardProps {
  training?: { title: string; details: string; href: string; kind: 'workout' | 'sequence' }
  hasWorkouts: boolean
  loading?: boolean
  planUnavailable?: boolean
}

export default function HeroCard({ training, hasWorkouts, loading, planUnavailable }: HeroCardProps) {
  const title = loading
    ? 'Loading your plan…'
    : training?.title ?? (planUnavailable ? 'Plan unavailable' : hasWorkouts ? 'No session scheduled' : 'Build your first workout')
  const details = training?.details ?? (planUnavailable
    ? 'You can still browse your workouts.'
    : hasWorkouts ? 'Pick a workout if you’d like to train today.' : 'Add intervals or rep-based sets to get started.')
  const href = training?.href ?? (hasWorkouts || planUnavailable ? '/workouts' : '/workouts/new')
  const action = training ? `Start ${training.kind}` : hasWorkouts || planUnavailable ? 'Choose a workout' : 'Create workout'

  return (
    <section className="rounded-dialog border border-border-soft bg-surface-warm p-4 sm:p-6" aria-busy={loading}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent"><span className="material-symbols-outlined text-lg" aria-hidden="true">fitness_center</span>{training?.kind === 'sequence' ? 'Scheduled sequence' : 'Training plan'}</div>
      <h2 className="break-words text-2xl font-bold tracking-tight text-fg-2 sm:text-3xl">{title}</h2>
      {!loading && (
        <>
          <p className="mt-8 text-body-md text-muted">{details}</p>
          <Link href={href} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-accent-on hover:bg-accent-hover sm:w-auto">
            <span className="material-symbols-outlined" aria-hidden="true">{training ? 'play_arrow' : hasWorkouts || planUnavailable ? 'fitness_center' : 'add'}</span>
            {action}
          </Link>
        </>
      )}
    </section>
  )
}
