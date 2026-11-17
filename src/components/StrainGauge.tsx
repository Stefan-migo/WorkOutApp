export default function StrainGauge({ workShare }: { workShare: number | null }) {
  return (
    <section className="glass-card min-w-0 rounded-card p-4 md:col-span-4">
      <h3 className="text-lg font-semibold text-fg-2">Work time share</h3>
      {workShare === null ? (
        <p className="mt-2 text-sm text-muted">No timed workout intervals yet.</p>
      ) : (
        <>
          <p className="mt-2 text-3xl font-bold tabular-nums text-accent">{workShare}%</p>
          <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-surface-warm">
            <div className="h-full rounded-full bg-accent" style={{ width: `${workShare}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">Share of logged timed intervals spent in Work.</p>
        </>
      )}
    </section>
  )
}
