'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useSessions } from '@/hooks/useSessions'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { formatDuration } from '@/lib/format'
import { SEGMENT_DOT } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'
import { Button, EmptyState, SearchInput } from '@/components/ui'
import { PageHeading } from '@/components/ui/PageHeading'

function formatDate(ts: number) {
  const d = new Date(ts)
  return {
    month: d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  }
}

// ponytail: heuristic type labels from interval composition — no category field on sessions yet
function deriveSessionTags(
  intervals: { type: IntervalType; title: string }[],
): string[] {
  const tags: string[] = []
  if (intervals.some((i) => i.type === 'work')) tags.push('HIIT')
  if (intervals.some((i) => i.type === 'rest' || i.type === 'cooldown'))
    tags.push('Interval')
  if (intervals.some((i) => /run/i.test(i.title) || /treadmill/i.test(i.title)))
    tags.push('Cardio')
  if (!tags.length) tags.push('Training')
  return tags.slice(0, 2)
}

// ponytail: load = rough heuristic (min * type factor) — no actual load tracking
function deriveLoad(
  intervals: { type: IntervalType; actualDuration: number }[],
): number {
  const factors: Record<string, number> = {
    work: 2,
    prepare: 1,
    rest: 0.5,
    cooldown: 0.3,
  }
  const total = intervals.reduce(
    (s, i) => s + i.actualDuration * (factors[i.type] ?? 1),
    0,
  )
  return Math.round(total / 60)
}

// ponytail: zone distribution from interval type durations — no HR zone data
function zoneDistribution(
  intervals: { type: IntervalType; actualDuration: number }[],
): Record<IntervalType, number> {
  const total = intervals.reduce((s, i) => s + i.actualDuration, 0) || 1
  const groups: Record<string, number> = {
    prepare: 0,
    work: 0,
    rest: 0,
    rest_between_cycles: 0,
    cooldown: 0,
  }
  for (const i of intervals) groups[i.type] = (groups[i.type] ?? 0) + i.actualDuration
  const prepare = Math.round(((groups.prepare ?? 0) / total) * 100)
  const work = Math.round(((groups.work ?? 0) / total) * 100)
  const rest = Math.round(((groups.rest ?? 0) / total) * 100)
  const rest_between_cycles = Math.round(((groups.rest_between_cycles ?? 0) / total) * 100)
  return {
    prepare,
    work,
    rest,
    rest_between_cycles,
    cooldown: Math.max(0, 100 - prepare - work - rest - rest_between_cycles),
  }
}

// ponytail: predominant type for accent bar — uses simple sum, no weighting
function predominantType(
  intervals: { type: IntervalType; actualDuration: number }[],
): IntervalType {
  const totals: Record<string, number> = {
    prepare: 0,
    work: 0,
    rest: 0,
    rest_between_cycles: 0,
    cooldown: 0,
  }
  for (const i of intervals) totals[i.type] = (totals[i.type] ?? 0) + i.actualDuration
  return (
    (Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] as IntervalType) ??
    'work'
  )
}

export default function HistoryPage() {
  const { sessions, isLoading } = useSessions()
  const { workouts } = useWorkoutContext()
  const { sequences } = useSequences()
  const [search, setSearch] = useState('')

  // ponytail: client-side filter on session name — use arrays to avoid async getters
  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.trim().toLowerCase()
    return sessions.filter((s) => {
      const name =
        s.type === 'workout'
          ? workouts.find((w) => w.id === s.workoutId)?.title ?? ''
          : sequences.find((sq) => sq.id === s.sequenceId)?.title ?? ''
      return name.toLowerCase().includes(q)
    })
  }, [sessions, search, workouts, sequences])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-24">
      <PageHeading title="History" description="Review your completed training sessions." />
      {sessions.length > 0 && (
        <div className="w-full sm:max-w-sm">
          <SearchInput label="Search sessions" value={search} onChange={setSearch} />
        </div>
      )}

      {/* History items */}
      <div className="flex flex-col gap-16">
        {sessions.length === 0 ? (
          isLoading ? <p role="status" className="text-muted">Loading sessions…</p> : (
            <div className="glass-card rounded-xl px-16">
              <EmptyState
                title="No sessions yet"
                body="Complete a workout to see it here."
                action={<Link href="/workouts" className="inline-flex min-h-11 items-center rounded-control bg-accent px-16 font-semibold text-accent-on focus-visible:focus-ring">Browse workouts</Link>}
              />
            </div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No sessions match your search"
            action={<Button variant="outline" onClick={() => setSearch('')}>Clear search</Button>}
          />
        ) : filtered.map((s) => {
          const name =
            s.type === 'workout'
              ? workouts.find((w) => w.id === s.workoutId)?.title ?? 'Unknown Workout'
              : sequences.find((sq) => sq.id === s.sequenceId)?.title ?? 'Unknown Sequence'
          const totalDuration = s.intervals.reduce(
            (sum, i) => sum + i.actualDuration,
            0,
          )
          const tags = deriveSessionTags(s.intervals)
          const zones = zoneDistribution(s.intervals)
          const { month, day } = formatDate(s.startedAt)
          const accentColor = SEGMENT_DOT[predominantType(s.intervals)]

          return (
            <Link
              key={s.id}
              href={`/history/${s.id}`}
              className="glass-card rounded-xl p-16 md:p-24 flex flex-col md:flex-row gap-16 transition-colors hover:bg-surface-warm focus-visible:focus-ring group relative"
            >
              <div
                className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${accentColor}`}
              />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
                {/* Date & Title */}
                <div className="col-span-1 md:col-span-4 flex gap-16 items-center">
                  <div className="bg-surface w-12 h-12 rounded-lg flex flex-col items-center justify-center border border-border-soft flex-shrink-0">
                    <span className="font-label-caps text-label-caps text-muted leading-none">
                      {month}
                    </span>
                    <span className="font-data-lg text-data-lg text-fg-2 leading-none mt-1">
                      {day}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-body-md text-body-md font-bold text-fg-2 leading-tight group-hover:text-accent transition-colors">
                      {name}
                    </h3>
                    <div className="flex gap-xs mt-xs">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="px-8 py-0.5 bg-surface rounded-full font-label-caps text-[10px] text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Metrics */}
                <div className="col-span-1 md:col-span-4 flex justify-between md:justify-around px-0 md:px-16 border-y md:border-y-0 md:border-x border-border-soft py-16 md:py-0">
                  <div className="text-center">
                    <p className="font-label-caps text-[10px] text-muted mb-1">
                      Duration
                    </p>
                    <p className="font-data-lg text-data-lg text-fg-2">
                      {formatDuration(totalDuration)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-label-caps text-[10px] text-muted mb-1">
                      Estimated load
                    </p>
                    <p className="font-data-lg text-data-lg text-fg-2">
                      {deriveLoad(s.intervals)}
                    </p>
                  </div>
                </div>
                {/* Timeline Preview */}
                <div className="col-span-1 md:col-span-4 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-caps text-[10px] text-muted">
                      Interval breakdown
                    </span>
                    <span className="material-symbols-outlined text-muted text-sm group-hover:text-accent transition-colors">
                      arrow_forward
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface overflow-hidden flex">
                    {zones.prepare > 0 && (
                      <div
                        className="h-full bg-segment-prepare"
                        style={{ width: `${zones.prepare}%` }}
                      />
                    )}
                    {zones.work > 0 && (
                      <div
                        className="h-full bg-segment-work"
                        style={{ width: `${zones.work}%` }}
                      />
                    )}
                    {zones.rest + zones.rest_between_cycles > 0 && (
                      <div
                        className="h-full bg-segment-rest"
                        style={{ width: `${zones.rest + zones.rest_between_cycles}%` }}
                      />
                    )}
                    {zones.cooldown > 0 && (
                      <div
                        className="h-full bg-segment-cooldown"
                        style={{ width: `${zones.cooldown}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
