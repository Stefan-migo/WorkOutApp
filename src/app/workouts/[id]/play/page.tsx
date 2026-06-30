'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSessions } from '@/hooks/useSessions'
import { useTimer } from '@/hooks/useTimer'
import { useBeep } from '@/hooks/useBeep'
import { useIntervalNotification } from '@/hooks/useIntervalNotification'
import { TimerDisplay } from '@/components/TimerDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { TimerControls } from '@/components/TimerControls'
import { useExercises } from '@/hooks/useExercises'
import { flattenWorkout } from '@/lib/interval-engine'
import type { IntervalType, CompletedInterval } from '@/types/workout'
import type { FlattenedInterval } from '@/lib/interval-engine'

type Phase = 'idle' | 'active' | 'complete'

const TYPE_BADGES: Record<IntervalType, string> = {
  prepare: 'bg-interval-prepare',
  work: 'bg-interval-work',
  rest: 'bg-interval-rest',
  cooldown: 'bg-interval-cooldown',
}

export default function PlayWorkoutPage() {
  const { getWorkout } = useWorkoutContext()
  const { addSession } = useSessions()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const workout = getWorkout(params.id)

  // ponytail: flatten once, workout reference stable during playback
  const flat = useMemo(() => (workout ? flattenWorkout(workout) : []), [workout])

  const [phase, setPhase] = useState<Phase>('idle')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completedIntervals, setCompletedIntervals] = useState<CompletedInterval[]>([])
  const startedRef = useRef(false)
  const skipRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const sessionSavedRef = useRef(false)

  const { beep } = useBeep()
  const { notify } = useIntervalNotification()
  const interval: FlattenedInterval | undefined = flat[currentIdx]
  const total = flat.length

  const { getExercise } = useExercises()
  const timer = useTimer(interval?.duration ?? 0, () => {
    beep()
    notify(workout?.title ?? 'Workout', currentIdx + 1, total)
    if (skipRef.current) {
      skipRef.current = false
      if (currentIdx < total - 1) {
        setCurrentIdx((prev) => prev + 1)
      } else {
        setPhase('complete')
      }
      return
    }
    // natural completion — capture full planned duration
    if (interval) {
      setCompletedIntervals((prev) => [...prev, {
        intervalId: interval.id,
        title: interval.title,
        type: interval.type,
        plannedDuration: interval.duration,
        actualDuration: interval.duration,
        completed: true,
      }])
    }
    if (currentIdx < total - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      setPhase('complete')
    }
  })

  // Auto-start timer when phase activates or interval advances
  useEffect(() => {
    if (phase === 'active') {
      timer.start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx])

  function handleStart() {
    startedAtRef.current = Date.now()
    setPhase('active')
  }

  function handleSkip() {
    // capture partial actualDuration before timer.skip() resets timeLeft
    if (interval) {
      const elapsed = interval.duration - timer.timeLeft
      setCompletedIntervals((prev) => [...prev, {
        intervalId: interval.id,
        title: interval.title,
        type: interval.type,
        plannedDuration: interval.duration,
        actualDuration: Math.max(0, elapsed),
        completed: false,
      }])
    }
    skipRef.current = true
    timer.skip()
  }

  function handleRestart() {
    timer.start()
  }

  // Save session on complete
  useEffect(() => {
    if (phase !== 'complete' || sessionSavedRef.current) return
    sessionSavedRef.current = true
    const session = {
      id: crypto.randomUUID(),
      type: 'workout' as const,
      workoutId: params.id,
      startedAt: startedAtRef.current,
      completedAt: Date.now(),
      intervals: completedIntervals,
    }
    addSession(session)
    router.push(`/history/${session.id}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center text-fg">
        <h1 className="text-2xl font-bold">Workout not found</h1>
        <Link href="/workouts" className="text-accent hover:underline">
          &larr; Back to workouts
        </Link>
      </div>
    )
  }

  const exercise = interval?.exerciseId ? getExercise(interval.exerciseId) : undefined
  const progressVal =
    total > 0
      ? (currentIdx + (1 - timer.timeLeft / (interval?.duration || 1))) / total
      : 0

  // ponytail: no drag, no reorder — flat list, upgrade with drag-and-drop in Phase 1
  const badgeClass = interval ? TYPE_BADGES[interval.type] ?? 'bg-zinc-600' : 'bg-zinc-600'
  const invalidFirst = workout.intervals[0]?.type !== 'prepare'
  const invalidLast = workout.intervals[workout.intervals.length - 1]?.type !== 'cooldown'

  return (
    <div className="max-w-lg mx-auto w-full p-6 flex flex-col items-center gap-8 bg-[#1e1416] text-[#f7f3f1] min-h-screen">
      {phase === 'idle' && (
        <>
          <h1 className="text-3xl font-bold text-center mt-12" style={{ color: '#f7f3f1' }}>{workout.title}</h1>
          <p className="text-center" style={{ color: '#8a7678' }}>
            {total} interval{total !== 1 && 's'} &middot;{' '}
            {Math.floor(flat.reduce((s, i) => s + i.duration, 0) / 60)} min
          </p>
          {(invalidFirst || invalidLast) && (
            <div className="w-full p-3 rounded-lg" style={{ backgroundColor: '#2a1e20', border: '1px solid #8a7040', color: '#8a7040' }}>
              <p className="text-sm text-center">
                {invalidFirst && 'First interval should be "Prepare". '}
                {invalidLast && 'Last interval should be "Cooldown".'}
              </p>
            </div>
          )}
          <button
            onClick={handleStart}
            className="mt-4 px-12 py-4 bg-accent hover:bg-accent text-accent-on rounded-full text-xl font-bold transition-colors min-w-[44px] min-h-[44px]"
          >
            Start
          </button>
        </>
      )}

      {phase === 'active' && (
        <>
          <div className="flex items-center gap-3 w-full">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${badgeClass}`}>
              {interval?.type}
            </span>
            <span className="text-sm" style={{ color: '#8a7678' }}>
              {currentIdx + 1} / {total}
            </span>
            {interval?.cycleIndex != null && interval?.cycleCount != null && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-accent text-accent">
                Cycle {interval.cycleIndex}/{interval.cycleCount}
              </span>
            )}
            {interval?.setIndex != null && interval?.setCount != null && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-accent text-accent">
                Set {interval.setIndex}/{interval.setCount}
              </span>
            )}
          </div>

          <h2 className="text-xl font-semibold -mt-4" style={{ color: '#f7f3f1' }}>{interval?.title}</h2>

          {exercise && <p className="text-sm text-center -mt-4" style={{ color: '#8a7678' }}>{exercise.description}</p>}

          <TimerDisplay timeLeft={timer.timeLeft} />
          <ProgressBar progress={progressVal} label="Workout progress" />
          <TimerControls
            status={timer.status}
            onPause={timer.pause}
            onResume={timer.resume}
            onSkip={handleSkip}
            onRestart={handleRestart}
          />

          {/* ponytail: timeline chips, flat list; no animation on transition */}
          {total > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {flat.map((intv, i) => {
                const isCurrent = i === currentIdx
                const isPast = i < currentIdx
                return (
                  <span
                    key={intv.id}
                    className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums border ${
                      isCurrent
                        ? 'border-accent text-accent' 
                        : isPast
                          ? 'border-border text-muted'
                          : 'border-border text-muted'
                    }`}
                    style={isCurrent ? { borderColor: '#7a1a28', color: '#7a1a28' } : {}}
                  >
                    {Math.floor(intv.duration / 60)}:{(intv.duration % 60).toString().padStart(2, '0')}
                  </span>
                )
              })}
            </div>
          )}
        </>
      )}

      {phase === 'complete' && (
        <div className="flex flex-col items-center gap-4 mt-12 text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#3a7050' }}>Workout Complete!</h1>
          <p style={{ color: '#8a7678' }}>
            {total} interval{total !== 1 && 's'} completed
          </p>
          <p style={{ color: '#8a7678' }}>
            Total time:{' '}
            {Math.floor(flat.reduce((s, i) => s + i.duration, 0) / 60)} min
          </p>
          <button
            onClick={() => router.push('/workouts')}
            className="mt-4 px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#2a1e20', color: '#f7f3f1' }}
          >
            Back to Workouts
          </button>
        </div>
      )}
    </div>
  )
}
