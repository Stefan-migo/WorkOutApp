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
import { RepCounter } from '@/components/RepCounter'
import { RepCompleteDialog } from '@/components/RepCompleteDialog'
import { useExercises } from '@/hooks/useExercises'
import { flattenWorkout, getEffectiveMode } from '@/lib/interval-engine'
import { formatTime } from '@/lib/format'
import { getIntervalName } from '@/lib/interval-display'
import type { CompletedInterval } from '@/types/workout'
import type { Interval } from '@/types/workout'
import type { Workout } from '@/types/workout'

type Phase = 'idle' | 'active' | 'complete'

export default function PlayWorkoutPage() {
  const { workouts } = useWorkoutContext()
  const { addSession } = useSessions()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  // ponytail: workouts already loaded in context — use find, not async getWorkout
  const workout = workouts.find((w) => w.id === params.id)

  // ponytail: flatten once, workout reference stable during playback
  const flat = useMemo(() => (workout ? flattenWorkout(workout) : []), [workout])

  const [phase, setPhase] = useState<Phase>('idle')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completedIntervals, setCompletedIntervals] = useState<CompletedInterval[]>([])
  const [showRepDialog, setShowRepDialog] = useState(false)
  const skipRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const sessionSavedRef = useRef(false)

  const { beep } = useBeep()
  const { notify } = useIntervalNotification()
  const interval: Interval | undefined = flat[currentIdx]
  const total = flat.length

  const { exercises, getExerciseImages } = useExercises()
  const [idbImageUrls, setIdbImageUrls] = useState<string[]>([])
  const timer = useTimer(interval?.duration ?? 0, () => {
    beep({ volume: 0.5, duration: 0.5, pitch: 1000 }) // louder transition
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
  }, handleTick)

  // ponytail: beep on tick — check by last-beep time only (≥800ms), ignore which second
  const lastBeepTimeRef = useRef(0)
  const prevRemainingRef = useRef(0)
  function handleTick(remaining: number) {
    if (remaining > 5 || remaining <= 0) return
    const prev = prevRemainingRef.current
    prevRemainingRef.current = remaining
    if (prev === remaining) return // same value as before, skip
    const now = Date.now()
    if (now - lastBeepTimeRef.current < 800) return
    lastBeepTimeRef.current = now
    beep({ volume: 0.12, duration: 0.15, pitch: 1100 })
  }

  // Auto-start timer when phase activates or interval advances
  // ponytail: reps work intervals don't use the timer — manual advance via RepCounter
  useEffect(() => {
    if (phase === 'active') {
      const isRepsWork = interval && getEffectiveMode(workout as Workout, interval) === 'reps' && interval.type === 'work'
      if (!isRepsWork) {
        timer.start()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx])

  // ponytail: double-click previous: 1st click restarts interval, 2nd within 800ms goes to previous
  const [prevClicks, setPrevClicks] = useState(0)
  const prevTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handlePrevious() {
    if (prevClicks === 0) {
      timer.start()
      setPrevClicks(1)
      if (prevTimerRef.current) clearTimeout(prevTimerRef.current)
      prevTimerRef.current = setTimeout(() => setPrevClicks(0), 800)
    } else {
      setPrevClicks(0)
      if (currentIdx > 0) setCurrentIdx((prev) => prev - 1)
    }
  }

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

  function handleRepComplete(actualReps: number, weight?: number) {
    if (!interval) return
    setCompletedIntervals((prev) => [...prev, {
      intervalId: interval.id,
      title: interval.title,
      type: interval.type,
      plannedDuration: 0,
      actualDuration: 0,
      completed: true,
      plannedReps: interval.reps,
      actualReps,
      weight,
      exerciseId: interval.exerciseId,
    }])
    setShowRepDialog(false)
    if (currentIdx < total - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      setPhase('complete')
    }
  }

  function handleRepSkip() {
    if (!interval) return
    // completed: false — a skipped set was never executed, so it must not
    // count toward personal records. Planned values kept as reference.
    setCompletedIntervals((prev) => [...prev, {
      intervalId: interval.id,
      title: interval.title,
      type: interval.type,
      plannedDuration: 0,
      actualDuration: 0,
      completed: false,
      plannedReps: interval.reps,
      actualReps: interval.reps,
      weight: interval.weight,
      exerciseId: interval.exerciseId,
    }])
    setShowRepDialog(false)
    if (currentIdx < total - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      setPhase('complete')
    }
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
      <div className="timer-dark-bg text-timer-on min-h-screen flex flex-col items-center justify-center gap-4 px-margin-mobile">
        <h1 className="font-headline-lg text-headline-lg">Workout not found</h1>
        <Link href="/workouts" className="text-timer-muted hover:text-timer-on transition-colors">
          &larr; Back to workouts
        </Link>
      </div>
    )
  }

  // ponytail: exercises already loaded — use find, not async getExercise
  const exercise = interval?.exerciseId
    ? exercises.find((e) => e.id === interval.exerciseId)
    : undefined
  // ponytail: fetch IDB images for the current exercise
  useEffect(() => {
    if (exercise?.id) {
      getExerciseImages(exercise.id).then((entries) => {
        setIdbImageUrls(entries.map((e) => e.blobUrl))
      }).catch(() => setIdbImageUrls([]))
    } else {
      setIdbImageUrls([])
    }
  }, [exercise?.id, getExerciseImages])

  const isRepsWork = !!(interval && getEffectiveMode(workout as Workout, interval) === 'reps' && interval.type === 'work')
  // ponytail: show addTime buttons on rest intervals when workout is reps mode
  const isRestInRepsWorkout = !!(interval && workout?.mode === 'reps' && (interval.type === 'rest' || interval.type === 'rest_between_cycles'))

  const nextInterval = flat[currentIdx + 1]
  // Work count up to current interval (1-based, for display naming)
  const workCount = flat.slice(0, currentIdx + 1).filter((i) => i.type === 'work').length
  // ponytail: reps mode progress is discrete — completed / total
  const progressVal = isRepsWork
    ? (completedIntervals.length / total)
    : total > 0
      ? (currentIdx + (1 - timer.timeLeft / (interval?.duration || 1))) / total
      : 0

  // ponytail: no drag, no reorder — flat list, upgrade with drag-and-drop in Phase 1
  const invalidFirst = workout.intervals[0]?.type !== 'prepare'
  const invalidLast = workout.intervals[workout.intervals.length - 1]?.type !== 'cooldown'

  return (
    <div className="timer-dark-bg text-timer-on min-h-screen flex flex-col">
      <PlayHeader title={workout.title} onClose={() => router.push('/workouts')} />

      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile py-24 w-full max-w-4xl mx-auto">
        {phase === 'idle' && (
          <>
            <h1 className="font-headline-lg text-headline-lg text-timer-on mb-8 mt-24">{workout.title}</h1>
            <p className="font-body-md text-body-md text-timer-muted mb-24">
              {total} interval{total !== 1 && 's'} &middot;{' '}
              {Math.floor(flat.reduce((s, i) => s + i.duration, 0) / 60)} min
            </p>
            {(invalidFirst || invalidLast) && (
              <div className="w-full max-w-md p-3 rounded-lg bg-timer-on/5 border border-warn/50 mb-24">
                <p className="text-sm text-center text-yellow-400">
                  {invalidFirst && 'First interval should be "Prepare". '}
                  {invalidLast && 'Last interval should be "Cooldown".'}
                </p>
              </div>
            )}
            <button
              onClick={handleStart}
              className="px-12 py-4 bg-timer-on text-accent rounded-full text-xl font-bold hover:bg-timer-on/80 transition-colors"
            >
              Start
            </button>
          </>
        )}

        {phase === 'active' && (
          <div className="flex flex-col lg:flex-row gap-24 w-full max-w-6xl mx-auto items-start">
            {/* Left column — Exercise info */}
            <div className="w-full lg:w-1/2 flex justify-center lg:sticky lg:top-24">
              {interval?.exerciseId && (
                <ExercisePanel
                  name={exercise?.name ?? ''}
                  exerciseId={interval.exerciseId}
                  description={exercise?.description}
                  images={[...(exercise?.images ?? []), ...idbImageUrls]}
                  instructions={exercise?.instructions}
                  primaryMuscles={exercise?.primaryMuscles}
                  secondaryMuscles={exercise?.secondaryMuscles}
                  force={exercise?.force}
                  mechanic={exercise?.mechanic}
                  difficulty={exercise?.difficulty}
                  equipment={exercise?.equipment}
                  category={exercise?.category}
                  chips={exercise?.muscleGroups}
                />
              )}
            </div>

            {/* Right column — Timer + Controls + Progress */}
            <div className="w-full lg:w-1/2 flex flex-col items-center gap-12">
              {isRepsWork && interval ? (
                /* Reps mode — show RepCounter, no timer ring */
                <RepCounter
                  exerciseName={exercise?.name ?? interval.title}
                  reps={interval.reps ?? 0}
                  weight={interval.weight}
                  onComplete={() => setShowRepDialog(true)}
                />
              ) : (
                <>
                  {/* Timer Ring */}
                  {interval && (
                    <TimerRing
                      timeLeft={timer.timeLeft}
                      duration={interval.duration}
                      intervalType={interval.type}
                      label={getIntervalName(interval, workCount, exercise)}
                      nextLabel={nextInterval ? `Next: ${nextInterval.type === 'work' ? getIntervalName(nextInterval, workCount + 1) : nextInterval.title} (${formatTime(nextInterval.duration)})` : undefined}
                    />
                  )}

                  {/* Controls */}
                  <TimerControls
                    status={timer.status}
                    onPause={timer.pause}
                    onResume={timer.resume}
                    onSkip={handleSkip}
                    onRestart={handleRestart}
                    onPrevious={handlePrevious}
                    showAddTime={isRestInRepsWorkout}
                    onAddTime={timer.addTime}
                  />
                </>
              )}

              {/* Rep complete dialog */}
              {showRepDialog && interval && (
                <RepCompleteDialog
                  plannedReps={interval.reps ?? 0}
                  plannedWeight={interval.weight}
                  onConfirm={handleRepComplete}
                  onSkip={handleRepSkip}
                />
              )}

              {/* Progress */}
              <div className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-8">
                  <span className="font-data-sm text-data-sm text-timer-muted">Total Progress</span>
                  <span className="font-data-sm text-data-sm text-timer-on">{Math.round(progressVal * 100)}%</span>
                </div>
                <ProgressBar progress={progressVal} label="Workout progress" dark />
                <div className="flex justify-between w-full font-label-caps text-label-caps text-timer-muted mt-8">
                  <span>Set {currentIdx + 1} of {total}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center">
            <h1 className="font-headline-lg text-headline-lg text-timer-on">Workout Complete!</h1>
            <p className="font-body-md text-body-md text-timer-muted">
              {total} interval{total !== 1 && 's'} completed
            </p>
            <p className="font-body-md text-body-md text-timer-muted">
              Total time:{' '}
              {Math.floor(flat.reduce((s, i) => s + i.duration, 0) / 60)} min
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
