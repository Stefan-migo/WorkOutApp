'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useTimer } from '@/hooks/useTimer'
import { TimerDisplay } from '@/components/TimerDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { TimerControls } from '@/components/TimerControls'
import { getExercise } from '@/data/exercises'
import type { IntervalType } from '@/types/workout'

type Phase = 'idle' | 'active' | 'complete'

const TYPE_BADGES: Record<IntervalType, string> = {
  prepare: 'bg-amber-600',
  work: 'bg-green-600',
  rest: 'bg-red-600',
  cooldown: 'bg-purple-600',
}

export default function PlayWorkoutPage() {
  const { getWorkout } = useWorkoutContext()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const workout = getWorkout(params.id)

  const [phase, setPhase] = useState<Phase>('idle')
  const [currentIdx, setCurrentIdx] = useState(0)
  const startedRef = useRef(false)

  const interval = workout?.intervals[currentIdx]
  const total = workout?.intervals.length ?? 0

  const timer = useTimer(interval?.duration ?? 0, () => {
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
    setPhase('active')
  }

  function handleSkip() {
    timer.skip()
  }

  function handleRestart() {
    timer.start()
  }

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Workout not found</h1>
        <Link href="/workouts" className="text-blue-400 hover:underline">
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

  return (
    <div className="max-w-lg mx-auto w-full p-6 flex flex-col items-center gap-8">
      {phase === 'idle' && (
        <>
          <h1 className="text-3xl font-bold text-center mt-12">{workout.title}</h1>
          <p className="text-zinc-400 text-center">
            {total} interval{total !== 1 && 's'} &middot;{' '}
            {Math.floor(workout.intervals.reduce((s, i) => s + i.duration, 0) / 60)} min
          </p>
          <button
            onClick={handleStart}
            className="mt-4 px-12 py-4 bg-green-600 hover:bg-green-500 rounded-full text-xl font-bold transition-colors min-w-[44px] min-h-[44px]"
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
            <span className="text-zinc-400 text-sm">
              {currentIdx + 1} / {total}
            </span>
          </div>

          <h2 className="text-xl font-semibold -mt-4">{interval?.title}</h2>

          {exercise && <p className="text-sm text-zinc-400 text-center -mt-4">{exercise.description}</p>}

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
              {workout.intervals.map((intv, i) => {
                const isCurrent = i === currentIdx
                const isPast = i < currentIdx
                return (
                  <span
                    key={intv.id}
                    className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums border ${
                      isCurrent
                        ? 'border-blue-500 text-blue-400 bg-blue-950'
                        : isPast
                          ? 'border-zinc-700 text-zinc-500'
                          : 'border-zinc-700 text-zinc-400'
                    }`}
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
          <h1 className="text-3xl font-bold text-green-400">Workout Complete!</h1>
          <p className="text-zinc-400">
            {total} interval{total !== 1 && 's'} completed
          </p>
          <p className="text-zinc-400">
            Total time:{' '}
            {Math.floor(workout.intervals.reduce((s, i) => s + i.duration, 0) / 60)} min
          </p>
          <button
            onClick={() => router.push('/workouts')}
            className="mt-4 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
          >
            Back to Workouts
          </button>
        </div>
      )}
    </div>
  )
}
