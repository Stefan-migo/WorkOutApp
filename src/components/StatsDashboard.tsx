'use client'

import Link from 'next/link'
import { useStats } from '@/hooks/useStats'
import { useSessions } from '@/hooks/useSessions'
import type { Session } from '@/types/workout'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatHours(totalSeconds: number) {
  return (totalSeconds / 3600).toFixed(1) + 'h'
}

function shortWeekLabel(weekLabel: string): string {
  return weekLabel.slice(5) // "2026-W27" → "W27"
}

export default function StatsDashboard({ sessions: propSessions }: { sessions?: Session[] } = {}) {
  const { sessions: lsSessions } = useSessions()
  const sessions = propSessions ?? lsSessions
  const stats = useStats(sessions)

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
        <h1 className="text-3xl font-bold text-fg">Statistics</h1>
        <p className="text-muted">Complete your first workout to see stats</p>
        <Link
          href="/workouts"
          className="px-6 py-3 bg-accent text-accent-on rounded-lg font-medium transition-colors"
        >
          Browse Workouts
        </Link>
      </div>
    )
  }

  const maxVolume = Math.max(...stats.weeklyVolume.map((w) => w.totalSeconds), 1)

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-fg">Statistics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard label="Total Workouts" value={String(stats.totalWorkouts)} />
        <SummaryCard label="Total Time" value={formatHours(stats.totalTimeSeconds)} />
        <SummaryCard label="Current Streak" value={String(stats.currentStreak)} />
        <SummaryCard label="This Week" value={String(stats.sessionsThisWeek)} />
      </div>

      {/* Weekly volume chart */}
      <div>
        <h2 className="text-lg font-semibold text-fg mb-4">Weekly Volume</h2>
        {/* ponytail: flex row of div bars, no chart library */}
        <div className="flex items-end gap-1 h-32">
          {stats.weeklyVolume.map((w) => (
            <div key={w.weekLabel} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-accent rounded-t min-h-[2px]"
                style={{ height: `${(w.totalSeconds / maxVolume) * 100}%` }}
              />
              <span className="text-[10px] text-muted">{shortWeekLabel(w.weekLabel)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-lg font-semibold text-fg mb-4">Recent Sessions</h2>
        <div className="flex flex-col gap-2">
          {stats.recentSessions.map((s) => {
            const name =
              s.type === 'workout'
                ? s.workoutId
                  ? `Workout: ${s.workoutId.slice(0, 8)}`
                  : 'Workout'
                : s.sequenceId
                  ? `Sequence: ${s.sequenceId.slice(0, 8)}`
                  : 'Sequence'
            const totalDuration = s.intervals.reduce((sum, i) => sum + i.actualDuration, 0)

            return (
              <div
                key={s.id}
                className="p-3 rounded-[8px] bg-surface border border-border-soft flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                        s.type === 'sequence'
                          ? 'bg-interval-prepare'
                          : 'bg-interval-work'
                      }`}
                    >
                      {s.type}
                    </span>
                    <span className="text-sm text-muted">{formatDate(s.startedAt)}</span>
                  </div>
                  {/* ponytail: fall back to id-based name since workout/sequence title requires context lookups */}
                  <p className="text-sm font-medium text-fg truncate mt-1">{name}</p>
                  <p className="text-xs text-muted">
                    {formatDuration(totalDuration)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-[8px] bg-surface border border-border-soft flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-bold text-fg">{value}</span>
    </div>
  )
}
