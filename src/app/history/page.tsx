'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSessions } from '@/hooks/useSessions'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { localDateKey } from '@/lib/calendar-utils'
import { formatDuration } from '@/lib/format'
import { Button, EmptyState, SearchInput } from '@/components/ui'
import { PageHeading } from '@/components/ui/PageHeading'
import type { Session } from '@/types/workout'

export default function HistoryPage() {
  const { sessions, isLoading, error } = useSessions()
  const { workouts } = useWorkoutContext()
  const { sequences } = useSequences()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const days = new Map<string, { session: Session; title: string }[]>()

  for (const session of sessions) {
    const title = session.type === 'free' ? session.title || 'Free training'
      : session.type === 'workout'
        ? workouts.find((workout) => workout.id === session.workoutId)?.title ?? 'Unknown workout'
        : sequences.find((sequence) => sequence.id === session.sequenceId)?.title ?? 'Unknown sequence'
    if (query && !title.toLowerCase().includes(query) && !session.intervals.some((interval) => interval.title.toLowerCase().includes(query))) continue
    const day = localDateKey(new Date(session.startedAt))
    const group = days.get(day) ?? []
    group.push({ session, title })
    days.set(day, group)
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 sm:gap-24">
      <PageHeading title="Training log" action={
        <Link href="/history/new" className="inline-flex min-h-11 items-center rounded-control bg-accent gap-1.5 px-3 text-sm font-semibold text-accent-on hover:bg-accent-hover focus-visible:focus-ring"><span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>Log free training</Link>
      } />
      {error && <p role="alert" className="text-sm text-danger">Could not refresh your training log.</p>}
      {sessions.length > 0 && (
        <div className="w-full sm:max-w-sm">
          <SearchInput label="Search sessions" value={search} onChange={setSearch} />
        </div>
      )}
      {isLoading && sessions.length === 0 && <p role="status" className="text-muted">Loading sessions…</p>}
      {!isLoading && !error && sessions.length === 0 && (
        <EmptyState title="No sessions yet" body="Complete a workout or log training you did on your own." action={<Link href="/workouts" className="text-sm font-semibold text-accent hover:underline">Browse workouts</Link>} />
      )}
      {sessions.length > 0 && days.size === 0 && (
        <EmptyState title="No sessions match your search" action={<Button variant="outline" onClick={() => setSearch('')}>Clear search</Button>} />
      )}
      {[...days.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([day, entries]) => (
        <section key={day} aria-labelledby={`log-${day}`} className="flex flex-col gap-8">
          <h2 id={`log-${day}`} className="text-sm font-semibold text-muted">
            <time dateTime={day}>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</time>
          </h2>
          <div className="divide-y divide-border-soft rounded-card border border-border-soft bg-surface">
            {entries.sort((a, b) => b.session.startedAt - a.session.startedAt).map(({ session, title }) => {
              const duration = session.intervals.reduce((sum, interval) => sum + interval.actualDuration, 0)
              const free = session.type === 'free'
              const count = session.intervals.length
              return (
                <Link key={session.id} href={`/history/${session.id}`} className="flex min-h-16 items-center gap-3 rounded-card px-3 py-3 hover:bg-surface-warm focus-visible:focus-ring sm:px-4">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-control bg-surface-warm text-accent">
                    <span className="material-symbols-outlined !text-[20px] leading-none">{free ? 'edit_note' : session.type === 'workout' ? 'fitness_center' : 'repeat'}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-fg-2">{title}</h3>
                    <p className="text-sm text-muted">{free ? 'Free training' : session.type === 'workout' ? 'Workout' : 'Sequence'} · {count} {free ? (count === 1 ? 'exercise' : 'exercises') : (count === 1 ? 'interval' : 'intervals')}{duration > 0 ? ` · ${formatDuration(duration)}` : ''}</p>
                    {free && <p className="mt-1 truncate text-sm text-muted">{session.intervals.map((interval) => interval.title).join(', ')}</p>}
                  </div>
                  <time dateTime={new Date(session.startedAt).toISOString()} className="shrink-0 text-xs tabular-nums text-muted">
                    {new Date(session.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </time>
                  <span aria-hidden="true" className="material-symbols-outlined text-base text-muted">chevron_right</span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
