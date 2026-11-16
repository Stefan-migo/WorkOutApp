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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-24">
      <PageHeading title="Training log" action={
        <Link href="/history/new" className="inline-flex min-h-11 items-center rounded-control bg-accent px-16 text-sm font-semibold text-accent-on hover:bg-accent-hover focus-visible:focus-ring">Log free training</Link>
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
          <h2 id={`log-${day}`} className="text-lg font-semibold">
            <time dateTime={day}>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'full' })}</time>
          </h2>
          {entries.sort((a, b) => b.session.startedAt - a.session.startedAt).map(({ session, title }) => {
            const duration = session.intervals.reduce((sum, interval) => sum + interval.actualDuration, 0)
            const free = session.type === 'free'
            const count = session.intervals.length
            return (
              <Link key={session.id} href={`/history/${session.id}`} className="glass-card flex items-center justify-between gap-8 rounded-card p-16 hover:bg-surface-warm focus-visible:focus-ring">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-fg-2">{title}</h3>
                  <p className="text-sm text-muted">{free ? 'Free training' : session.type === 'workout' ? 'Workout' : 'Sequence'} · {count} {free ? (count === 1 ? 'exercise' : 'exercises') : (count === 1 ? 'interval' : 'intervals')}{duration > 0 ? ` · ${formatDuration(duration)}` : ''}</p>
                  {free && <p className="mt-1 truncate text-sm text-muted">{session.intervals.map((interval) => interval.title).join(', ')}</p>}
                </div>
                <time dateTime={new Date(session.startedAt).toISOString()} className="shrink-0 text-sm text-muted">
                  {new Date(session.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </time>
              </Link>
            )
          })}
        </section>
      ))}
    </div>
  )
}
