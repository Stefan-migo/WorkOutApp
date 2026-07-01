'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useSessions } from '@/hooks/useSessions'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { formatDuration } from '@/lib/format'
import { SEGMENT_DOT } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'

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
    cooldown: 0,
  }
  for (const i of intervals) groups[i.type] = (groups[i.type] ?? 0) + i.actualDuration
  const prepare = Math.round(((groups.prepare ?? 0) / total) * 100)
  const work = Math.round(((groups.work ?? 0) / total) * 100)
  const rest = Math.round(((groups.rest ?? 0) / total) * 100)
  return {
    prepare,
    work,
    rest,
    cooldown: Math.max(0, 100 - prepare - work - rest),
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
    cooldown: 0,
  }
  for (const i of intervals) totals[i.type] = (totals[i.type] ?? 0) + i.actualDuration
  return (
    (Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] as IntervalType) ??
    'work'
  )
}

export default function HistoryPage() {
  const { sessions } = useSessions()
  const { getWorkout } = useWorkoutContext()
  const { getSequence } = useSequences()
  const [search, setSearch] = useState('')

  // ponytail: client-side filter on session name
  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter((s) => {
      const name =
        s.type === 'workout'
          ? getWorkout(s.workoutId!)?.title ?? ''
          : getSequence(s.sequenceId!)?.title ?? ''
      return name.toLowerCase().includes(q)
    })
  }, [sessions, search, getWorkout, getSequence])

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-24 p-margin-mobile md:p-margin-desktop text-center">
        <span className="material-symbols-outlined text-[64px] text-on-surface-variant">
          fitness_center
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          No sessions yet
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
          Complete a workout to see it here
        </p>
        <Link
          href="/workouts"
          className="px-24 py-16 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-primary/90 transition-colors ambient-shadow"
        >
          Browse Workouts
        </Link>
      </div>
    )
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-5xl mx-auto flex flex-col gap-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-16 mb-24">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-8">
            History
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Review your past performance and metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-8 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 pl-10 pr-16 py-8 rounded-lg bg-surface-container-lowest border border-outline-variant/30 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
              placeholder="Search sessions..."
              type="text"
            />
          </div>

        </div>
      </div>

      {/* History items */}
      <div className="flex flex-col gap-16">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[64px] text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">No sessions match your search.</p>
          </div>
        ) : filtered.map((s) => {
          const name =
            s.type === 'workout'
              ? getWorkout(s.workoutId!)?.title ?? 'Unknown Workout'
              : getSequence(s.sequenceId!)?.title ?? 'Unknown Sequence'
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
              className="glass-card rounded-xl p-16 md:p-24 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`}
              />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Date & Title */}
                <div className="col-span-1 md:col-span-4 flex gap-16 items-center">
                  <div className="bg-surface-container w-12 h-12 rounded-lg flex flex-col items-center justify-center border border-outline-variant/20 flex-shrink-0">
                    <span className="font-label-caps text-label-caps text-on-surface-variant leading-none">
                      {month}
                    </span>
                    <span className="font-data-lg text-data-lg text-on-surface leading-none mt-1">
                      {day}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-body-md text-body-md font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    <div className="flex gap-xs mt-xs">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="px-8 py-0.5 bg-surface-container-high rounded-full font-label-caps text-[10px] text-on-surface-variant"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Metrics */}
                <div className="col-span-1 md:col-span-4 flex justify-between md:justify-around px-0 md:px-16 border-y md:border-y-0 md:border-x border-outline-variant/20 py-16 md:py-0">
                  <div className="text-center">
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">
                      DURATION
                    </p>
                    <p className="font-data-lg text-data-lg text-on-surface">
                      {formatDuration(totalDuration)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">
                      LOAD
                    </p>
                    <p className="font-data-lg text-data-lg text-on-surface">
                      {deriveLoad(s.intervals)}
                    </p>
                  </div>
                </div>
                {/* Timeline Preview */}
                <div className="col-span-1 md:col-span-4 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-caps text-[10px] text-on-surface-variant">
                      ZONE DISTRIBUTION
                    </span>
                    <span className="material-symbols-outlined text-outline text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden flex">
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
                    {zones.rest > 0 && (
                      <div
                        className="h-full bg-segment-rest"
                        style={{ width: `${zones.rest}%` }}
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
