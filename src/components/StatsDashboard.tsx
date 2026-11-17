'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useStats } from '@/hooks/useStats'
import { useSessions } from '@/hooks/useSessions'
import { exportAllData } from '@/lib/export-data'
import { formatDuration } from '@/lib/format'
import { computePRs, hasStrength, type PRRecord } from '@/lib/pr-engine'
import { localDateKey } from '@/lib/calendar-utils'
import type { Session } from '@/types/workout'
import VolumeChart from '@/components/VolumeChart'
import StrainGauge from '@/components/StrainGauge'
import ConsistencyHeatmap from '@/components/ConsistencyHeatmap'
import { Button, EmptyState } from '@/components/ui'
import { PageHeading } from '@/components/ui/PageHeading'

export { formatDuration, formatHours }

function formatHours(totalSeconds: number) {
  return (totalSeconds / 3600).toFixed(1) + 'h'
}

function strengthValue(r: PRRecord): string {
  const parts: string[] = []
  if (r.bestWeight != null) parts.push(`${r.bestWeight} kg`)
  if (r.bestReps != null) parts.push(`\u00d7 ${r.bestReps}`)
  if (r.bestE1RM != null) parts.push(`e1RM ${Math.round(r.bestE1RM)}`)
  return parts.join(' \u00b7 ')
}

interface HeatmapCell {
  date: string
  count: number
}

// ponytail: ISO week Monday alignment, no date library
function buildHeatmap(sessions: Session[]): HeatmapCell[][] {
  const countByDate = new Map<string, number>()
  for (const s of sessions) {
    const key = localDateKey(new Date(s.startedAt))
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1)
  }

  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const weeks: HeatmapCell[][] = []
  for (let w = 3; w >= 0; w--) {
    const week: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() - w * 7 + d)
      const key = localDateKey(day)
      week.push({ date: key, count: countByDate.get(key) ?? 0 })
    }
    weeks.push(week)
  }
  return weeks
}

export default function StatsDashboard({ sessions: propSessions }: { sessions?: Session[] } = {}) {
  const { sessions: lsSessions, isLoading } = useSessions()
  const sessions = propSessions ?? lsSessions
  const stats = useStats(sessions)

  const workShare = useMemo(() => {
    let workSec = 0
    let restSec = 0
    for (const s of sessions) {
      if (s.type === 'free') continue
      for (const i of s.intervals) {
        if (i.type === 'work') workSec += i.actualDuration
        else restSec += i.actualDuration
      }
    }
    const total = workSec + restSec
    return total > 0 ? Math.round(workSec / total * 100) : null
  }, [sessions])

  const heatmap = useMemo(() => buildHeatmap(sessions), [sessions])
  const prs = useMemo(() => computePRs(sessions), [sessions])
  const strengthPRs = prs.filter(hasStrength)
  const cardioPRs = prs.filter((r) => r.bestCardioSeconds != null)
  const recentVolume = stats.weeklyVolume.slice(-4)
  const maxVolume = Math.max(...recentVolume.map((w) => w.totalSeconds), 1)

  if (sessions.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 sm:gap-24">
        <PageHeading title="Performance Stats" />
        {isLoading && propSessions == null ? <p role="status" className="text-muted">Loading statistics…</p> : (
          <div className="glass-card rounded-xl px-16">
            <EmptyState
              title="No training data yet"
              body="Complete your first workout to see your progress here."
              action={<Link href="/workouts" className="inline-flex min-h-11 items-center rounded-control bg-accent px-16 font-semibold text-accent-on focus-visible:focus-ring">Browse workouts</Link>}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 sm:gap-24">
      <PageHeading
        title="Performance Stats"
        action={<Button variant="outline" onClick={exportAllData}>Export JSON</Button>}
      />
      <dl className="grid grid-cols-2 divide-x divide-border-soft rounded-card bg-surface-warm">
        <div className="p-3">
          <dt className="text-xs font-medium text-muted">Sessions this week</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-fg-2">{stats.sessionsThisWeek}</dd>
        </div>
        <div className="p-3">
          <dt className="text-xs font-medium text-muted">Training time this week</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-fg-2">{formatDuration(recentVolume.at(-1)?.totalSeconds ?? 0)}</dd>
        </div>
      </dl>
      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-12">
        <VolumeChart recentVolume={recentVolume} maxVolume={maxVolume} />
        <StrainGauge workShare={workShare} />
        <ConsistencyHeatmap heatmap={heatmap} />

        {/* Personal Records — 5 cols */}
        <div className="glass-card flex min-w-0 flex-col rounded-card p-4 md:col-span-5">
          <div className="flex items-center mb-16 border-b border-border-soft pb-8">
            <h3 className="font-headline-md text-headline-md text-fg-2">
              Personal Records
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-16 pr-8">
            <section>
              <h4 className="font-label-caps text-label-caps text-muted mb-8">
                Strength
              </h4>
              {strengthPRs.length === 0 ? (
                <p className="font-body-sm text-body-sm text-muted">
                  No strength PRs yet — complete rep-based workouts to track them.
                </p>
              ) : (
                <ul className="space-y-8">
                  {strengthPRs.map((r) => (
                    <li key={r.exercise} className="flex flex-wrap items-baseline justify-between gap-8">
                      <span className="font-body-md text-body-md text-fg-2">{r.exercise}</span>
                      <span className="font-data-sm text-data-sm text-accent whitespace-nowrap">
                        {strengthValue(r)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h4 className="font-label-caps text-label-caps text-muted mb-8">
                Cardio
              </h4>
              {cardioPRs.length === 0 ? (
                <p className="font-body-sm text-body-sm text-muted">
                  No cardio PRs yet — complete timed run, bike or row intervals to track them.
                </p>
              ) : (
                <ul className="space-y-8">
                  {cardioPRs.map((r) => (
                    <li key={r.exercise} className="flex flex-wrap items-baseline justify-between gap-8">
                      <span className="font-body-md text-body-md text-fg-2">{r.exercise}</span>
                      <span className="font-data-sm text-data-sm text-accent whitespace-nowrap">
                        {formatDuration(r.bestCardioSeconds!)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
