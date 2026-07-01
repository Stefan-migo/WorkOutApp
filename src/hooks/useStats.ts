'use client'

import { useMemo } from 'react'
import type { Session } from '@/types/workout'

export interface StatsData {
  totalWorkouts: number
  totalTimeSeconds: number
  currentStreak: number
  sessionsThisWeek: number
  weeklyVolume: Array<{ weekLabel: string; totalSeconds: number }>
  recentSessions: Session[]
}

/** ISO week label like "2026-W27" for a given date. */
function getISOWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/** Build the last 12 ISO week labels ending at the week containing `now`. */
function last12WeekLabels(now: Date): string[] {
  const labels: string[] = []
  const d = new Date(now)
  // Move to Monday of the current ISO week
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)

  for (let i = 0; i < 12; i++) {
    labels.unshift(getISOWeekLabel(d))
    d.setUTCDate(d.getUTCDate() - 7)
  }
  return labels
}

export function computeStats(sessions: Session[], now: Date = new Date()): StatsData {
  const totalWorkouts = sessions.length
  const totalTimeSeconds = sessions.reduce((sum, s) => sum + s.intervals.reduce((sum, i) => sum + i.actualDuration, 0), 0)

  // Streak: consecutive calendar days (UTC) with ≥1 session, backward from now
  const sessionDates = new Set(
    sessions
      .sort((a, b) => b.startedAt - a.startedAt)
      .map((s) => new Date(s.startedAt).toISOString().slice(0, 10)),
  )

  let streak = 0
  const cursor = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  while (sessionDates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  // Sessions this ISO week
  const currentWeekLabel = getISOWeekLabel(now)
  const sessionsThisWeek = sessions.filter(
    (s) => getISOWeekLabel(new Date(s.startedAt)) === currentWeekLabel,
  ).length

  // Weekly volume: last 12 ISO weeks
  const labels = last12WeekLabels(now)
  const volumeByWeek = new Map<string, number>()
  for (const label of labels) volumeByWeek.set(label, 0)
  for (const s of sessions) {
    const label = getISOWeekLabel(new Date(s.startedAt))
    if (volumeByWeek.has(label)) {
      volumeByWeek.set(label, volumeByWeek.get(label)! + s.intervals.reduce((sum, i) => sum + i.actualDuration, 0))
    }
  }
  const weeklyVolume = labels.map((weekLabel) => ({
    weekLabel,
    totalSeconds: volumeByWeek.get(weekLabel) ?? 0,
  }))

  // Recent sessions: last 10 sorted by startedAt desc
  const recentSessions = [...sessions]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 10)

  return {
    totalWorkouts,
    totalTimeSeconds,
    currentStreak: streak,
    sessionsThisWeek,
    weeklyVolume,
    recentSessions,
  }
}

export function useStats(sessions: Session[]): StatsData {
  return useMemo(() => computeStats(sessions), [sessions])
}
