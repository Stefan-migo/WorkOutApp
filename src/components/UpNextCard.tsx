interface UpNextCardProps {
  session?: { title: string; details: string; dayLabel: string }
}

export default function UpNextCard({ session }: UpNextCardProps) {
  if (!session) return null

  return (
    <section className="glass-card rounded-dialog p-24">
      <h2 className="mb-8 text-label-caps text-muted">Up next</h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-sm font-semibold text-accent">{session.dayLabel}</span>
        <p className="break-words text-lg font-semibold text-fg-2">{session.title}</p>
        <span className="text-sm text-muted">{session.details}</span>
      </div>
    </section>
  )
}
