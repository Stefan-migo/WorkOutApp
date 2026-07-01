'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useStats } from '@/hooks/useStats'
import { useSessions } from '@/hooks/useSessions'
import { exportAllData } from '@/lib/export-data'
import { formatDuration } from '@/lib/format'
import type { Session } from '@/types/workout'
import VolumeChart from '@/components/VolumeChart'
import StrainGauge from '@/components/StrainGauge'
import ConsistencyHeatmap from '@/components/ConsistencyHeatmap'

export { formatDuration, formatHours }

function formatHours(totalSeconds: number) {
  return (totalSeconds / 3600).toFixed(1) + 'h'
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
  const recentVolume = stats.weeklyVolume.slice(-4)
  const maxVolume = Math.max(...recentVolume.map((w) => w.totalSeconds), 1)

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-24 p-margin-mobile md:p-margin-desktop text-center">
        <span className="material-symbols-outlined text-[64px] text-on-surface-variant">
          monitoring
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          Performance Stats
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
          Complete your first workout to see stats
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
    <div className="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-24">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">
            Performance Stats
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Last 30 Days Overview
          </p>
        </div>
        <div className="flex gap-8">
          <button
            onClick={exportAllData}
            className="px-4 py-2 border border-outline rounded font-label-caps text-label-caps text-on-surface hover:bg-surface-variant transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
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
          <div className="flex items-center mb-16 border-b border-outline-variant/30 pb-8">
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Personal Records
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="font-body-md text-body-md text-on-surface-variant text-center">
              PR tracking coming in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
