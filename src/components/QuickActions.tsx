import Link from 'next/link'

export default function QuickActions() {
  return (
    <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-24">
      <Link
        href="/workouts/new"
        className="glass-card p-16 rounded-xl flex items-center gap-16 hover:bg-surface-variant/50 transition-colors duration-200 group border-l-4 border-l-transparent hover:border-l-primary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
      >
        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[24px]">add_circle</span>
        </div>
        <div>
          <h5 className="font-headline text-body-md font-bold text-primary">Create Workout</h5>
          <p className="font-label text-label-caps text-on-surface-variant mt-1">CUSTOM ROUTINE</p>
        </div>
      </Link>
      <Link
        href="/exercises"
        className="glass-card p-16 rounded-xl flex items-center gap-16 hover:bg-surface-variant/50 transition-colors duration-200 group border-l-4 border-l-transparent hover:border-l-primary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
      >
        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[24px]">search</span>
        </div>
        <div>
          <h5 className="font-headline text-body-md font-bold text-primary">Browse Exercises</h5>
          <p className="font-label text-label-caps text-on-surface-variant mt-1">LIBRARY &amp; FORMS</p>
        </div>
      </Link>
      <Link
        href="/calendar"
        className="glass-card p-16 rounded-xl flex items-center gap-16 hover:bg-surface-variant/50 transition-colors duration-200 group border-l-4 border-l-transparent hover:border-l-primary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
      >
        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[24px]">calendar_month</span>
        </div>
        <div>
          <h5 className="font-headline text-body-md font-bold text-primary">View Calendar</h5>
          <p className="font-label text-label-caps text-on-surface-variant mt-1">PLANNING &amp; HISTORY</p>
        </div>
      </Link>
    </div>
  )
}
