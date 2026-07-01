'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSessions } from '@/hooks/useSessions'
import { useTimer } from '@/hooks/useTimer'
import { useBeep } from '@/hooks/useBeep'
import { useIntervalNotification } from '@/hooks/useIntervalNotification'
import { ProgressBar } from '@/components/ProgressBar'
import { TimerControls } from '@/components/TimerControls'
import { TimerRing } from '@/components/TimerRing'
import { PlayHeader } from '@/components/PlayHeader'
import { ExercisePanel } from '@/components/ExercisePanel'
import { useExercises } from '@/hooks/useExercises'
import { flattenWorkout } from '@/lib/interval-engine'
import { formatTime } from '@/lib/format'
import type { CompletedInterval } from '@/types/workout'
import type { FlattenedInterval } from '@/lib/interval-engine'

type Phase = 'idle' | 'active' | 'complete'

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
      <div className="timer-dark-bg text-white min-h-screen flex flex-col items-center justify-center gap-4 px-margin-mobile">
        <h1 className="font-headline-lg text-headline-lg">Workout not found</h1>
        <Link href="/workouts" className="text-gray-400 hover:text-white transition-colors">
          &larr; Back to workouts
        </Link>
      </div>
    )
  }

  const exercise = interval?.exerciseId ? getExercise(interval.exerciseId) : undefined
  const nextInterval = flat[currentIdx + 1]
  const progressVal =
    total > 0
      ? (currentIdx + (1 - timer.timeLeft / (interval?.duration || 1))) / total
      : 0

  // ponytail: no drag, no reorder — flat list, upgrade with drag-and-drop in Phase 1
  const invalidFirst = workout.intervals[0]?.type !== 'prepare'
  const invalidLast = workout.intervals[workout.intervals.length - 1]?.type !== 'cooldown'

  return (
    <div className="timer-dark-bg text-white min-h-screen flex flex-col">
      <PlayHeader title={workout.title} onClose={() => router.push('/workouts')} />

      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile py-24 w-full max-w-4xl mx-auto">
        {phase === 'idle' && (
          <>
            <h1 className="font-headline-lg text-headline-lg text-white mb-8 mt-24">{workout.title}</h1>
            <p className="font-body-md text-body-md text-gray-400 mb-24">
              {total} interval{total !== 1 && 's'} &middot;{' '}
              {Math.floor(flat.reduce((s, i) => s + i.duration, 0) / 60)} min
            </p>
            {(invalidFirst || invalidLast) && (
              <div className="w-full max-w-md p-3 rounded-lg bg-white/5 border border-yellow-700/50 mb-24">
                <p className="text-sm text-center text-yellow-400">
                  {invalidFirst && 'First interval should be "Prepare". '}
                  {invalidLast && 'Last interval should be "Cooldown".'}
                </p>
              </div>
            )}
            <button
              onClick={handleStart}
              className="px-12 py-4 bg-white text-primary rounded-full text-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Start
            </button>
          </>
        )}

        {phase === 'active' && (
          <>
            {/* Timer Ring */}
            {interval && (
              <TimerRing
                timeLeft={timer.timeLeft}
                duration={interval.duration}
                intervalType={interval.type}
                label={interval.type}
                nextLabel={nextInterval ? `Next: ${nextInterval.type} (${formatTime(nextInterval.duration)})` : undefined}
              />
            )}

            {/* Exercise Panel */}
            {exercise && (
              <ExercisePanel
                name={exercise.name}
                description={exercise.description}
                chips={exercise.muscleGroups}
              />
            )}

            {/* Controls */}
            <TimerControls
              status={timer.status}
              onPause={timer.pause}
              onResume={timer.resume}
              onSkip={handleSkip}
              onRestart={handleRestart}
              onRewind={() => timer.addTime(-10)}
            />

            {/* Progress */}
            <div className="w-full max-w-2xl mt-24">
              <div className="flex justify-between items-center mb-8">
                <span className="font-data-sm text-data-sm text-gray-400">Total Progress</span>
                <span className="font-data-sm text-data-sm text-white">{Math.round(progressVal * 100)}%</span>
              </div>
              <ProgressBar progress={progressVal} label="Workout progress" dark />
              <div className="flex justify-between w-full font-label-caps text-label-caps text-gray-400 mt-8">
                <span>Set {currentIdx + 1} of {total}</span>
              </div>
            </div>
          </>
        )}

        {phase === 'complete' && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center">
            <h1 className="font-headline-lg text-headline-lg text-white">Workout Complete!</h1>
            <p className="font-body-md text-body-md text-gray-400">
              {total} interval{total !== 1 && 's'} completed
            </p>
            <p className="font-body-md text-body-md text-gray-400">
              Total time:{' '}
              {Math.floor(flat.reduce((s, i) => s + i.duration, 0) / 60)} min
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
