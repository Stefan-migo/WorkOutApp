'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useStats } from '@/hooks/useStats'
import { useSessions } from '@/hooks/useSessions'
import { exportAllData } from '@/lib/export-data'
import { formatDuration } from '@/lib/format'
import { computePRs, hasStrength, type PRRecord } from '@/lib/pr-engine'
import type { Session } from '@/types/workout'
import VolumeChart from '@/components/VolumeChart'
import StrainGauge from '@/components/StrainGauge'
import ConsistencyHeatmap from '@/components/ConsistencyHeatmap'

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
    const key = new Date(s.startedAt).toISOString().slice(0, 10)
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
      const key = day.toISOString().slice(0, 10)
      week.push({ date: key, count: countByDate.get(key) ?? 0 })
    }
    weeks.push(week)
  }
  return weeks
}

export default function StatsDashboard({ sessions: propSessions }: { sessions?: Session[] } = {}) {
  const { sessions: lsSessions } = useSessions()
  const sessions = propSessions ?? lsSessions
  const stats = useStats(sessions)

  // ponytail: RPE from work/rest ratio — no actual RPE tracking
  const avgRpe = useMemo(() => {
    let workSec = 0
    let restSec = 0
    for (const s of sessions) {
      for (const i of s.intervals) {
        if (i.type === 'work') workSec += i.actualDuration
        else restSec += i.actualDuration
      }
    }
    const ratio = workSec + restSec > 0 ? workSec / (workSec + restSec) : 0
    return Math.round(ratio * 10 * 10) / 10
  }, [sessions])

  const heatmap = useMemo(() => buildHeatmap(sessions), [sessions])
  const prs = useMemo(() => computePRs(sessions), [sessions])
  const strengthPRs = prs.filter(hasStrength)
  const cardioPRs = prs.filter((r) => r.bestCardioSeconds != null)
  const recentVolume = stats.weeklyVolume.slice(-4)
  const maxVolume = Math.max(...recentVolume.map((w) => w.totalSeconds), 1)

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-24 p-margin-mobile md:p-margin-desktop text-center">
        <span className="material-symbols-outlined text-[64px] text-muted">
          monitoring
        </span>
        <h1 className="font-headline-lg text-headline-lg text-fg-2">
          Performance Stats
        </h1>
        <p className="font-body-md text-body-md text-muted max-w-sm">
          Complete your first workout to see stats
        </p>
        <Link
          href="/workouts"
          className="px-24 py-16 bg-accent text-accent-on rounded-lg font-label-caps text-label-caps hover:bg-accent/90 transition-colors ambient-shadow"
        >
          Browse Workouts
        </Link>
      </div>
    )
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-24">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-fg-2 mb-1">
            Performance Stats
          </h2>
          <p className="font-body-lg text-body-lg text-muted">
            Last 30 Days Overview
          </p>
        </div>
        <div className="flex gap-8">
          <button
            onClick={exportAllData}
            className="px-4 py-2 border border-border rounded font-label-caps text-label-caps text-fg-2 hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-24">
        <VolumeChart recentVolume={recentVolume} maxVolume={maxVolume} formatHours={formatHours} />
        <StrainGauge avgRpe={avgRpe} />
        <ConsistencyHeatmap heatmap={heatmap} />

        {/* Personal Records — 5 cols */}
        <div className="md:col-span-5 glass-card rounded-xl p-16 ambient-shadow flex flex-col">
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
                    <li key={r.exercise} className="flex items-baseline justify-between gap-8">
                      <span className="font-body-md text-body-md text-fg-2 truncate">{r.exercise}</span>
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
                    <li key={r.exercise} className="flex items-baseline justify-between gap-8">
                      <span className="font-body-md text-body-md text-fg-2 truncate">{r.exercise}</span>
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
