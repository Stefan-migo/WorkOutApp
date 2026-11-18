'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSessions } from '@/hooks/useSessions'
import { useTimer } from '@/hooks/useTimer'
import { useBeep } from '@/hooks/useBeep'
import { usePlaybackSettings } from '@/hooks/usePlaybackSettings'
import { useIntervalNotification } from '@/hooks/useIntervalNotification'
import { PlayHeader } from '@/components/PlayHeader'
import { RepCompleteDialog } from '@/components/RepCompleteDialog'
import { PlayScreen } from '@/components/blocks/PlayScreen'
import { useIntervalImage } from '@/hooks/useIntervalImage'
import { useExercises } from '@/hooks/useExercises'
import { flattenWorkout, getEffectiveMode } from '@/lib/interval-engine'
import { formatDuration, formatTime } from '@/lib/format'
import { getIntervalName } from '@/lib/interval-display'
import type { CompletedInterval } from '@/types/workout'
import type { Interval } from '@/types/workout'
import type { Workout } from '@/types/workout'

type Phase = 'idle' | 'active' | 'complete'

export default function PlayWorkoutPage() {
  const { workouts, isLoading } = useWorkoutContext()
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

  const { settings } = usePlaybackSettings()
  const { beep, unlock } = useBeep(settings.sound)
  const { notify } = useIntervalNotification()
  const interval: Interval | undefined = flat[currentIdx]
  const total = flat.length

  const { exercises, getExerciseImages } = useExercises()
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

  function handleTick(remaining: number) {
    if (remaining > 5 || remaining <= 0) return
    beep({ volume: 0.3, duration: 0.15, pitch: 900 + (5 - remaining) * 100 })
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
    unlock()
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
    void Promise.resolve(addSession(session)).then(() => router.push(`/history/${session.id}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ponytail: exercises already loaded — use find, not async getExercise
  const exercise = interval?.exerciseId
    ? exercises.find((e) => e.id === interval.exerciseId)
    : undefined
  const nextInterval = flat[currentIdx + 1]
  const upcomingWork = interval?.type !== 'work'
    ? flat.slice(currentIdx + 1).find((item) => item.type === 'work')
    : undefined
  const upcomingExercise = exercises.find((item) => item.id === upcomingWork?.exerciseId)
  const imageUrl = useIntervalImage(interval, exercise?.images?.[0], getExerciseImages)
  const nextImageUrl = useIntervalImage(upcomingWork, upcomingExercise?.images?.[0], getExerciseImages)

  if (!workout) {
    return (
      <main className="timer-dark-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-margin-mobile text-center text-timer-on">
        {isLoading ? (
          <p role="status" className="text-timer-muted">Loading workout…</p>
        ) : (
          <>
            <h1 className="font-headline text-headline-lg">Workout not found</h1>
            <Link href="/workouts" className="text-timer-muted hover:text-timer-on transition-colors">
              &larr; Back to workouts
            </Link>
          </>
        )}
      </main>
    )
  }

  const isRepsWork = !!(interval && getEffectiveMode(workout as Workout, interval) === 'reps' && interval.type === 'work')
  // ponytail: show addTime buttons on rest intervals when workout is reps mode
  const isRestInRepsWorkout = !!(interval && workout?.mode === 'reps' && (interval.type === 'rest' || interval.type === 'rest_between_cycles'))

  // Work count up to current interval (1-based, for display naming)
  const workCount = flat.slice(0, currentIdx + 1).filter((i) => i.type === 'work').length
  const intervalMeasure = (step: Interval) =>
    step.type === 'work' && getEffectiveMode(workout, step) === 'reps'
      ? `${step.reps ?? 0} reps`
      : formatTime(step.duration)

  const nextLabel = nextInterval && !(nextImageUrl && nextInterval === upcomingWork)
    ? `Next: ${getIntervalName(nextInterval, workCount + 1)} (${intervalMeasure(nextInterval)})`
    : undefined
  // ponytail: reps mode progress is discrete — completed / total
  const progressVal = isRepsWork
    ? currentIdx / total
    : total > 0
      ? (currentIdx + timer.progress) / total
      : 0

  // ponytail: no drag, no reorder — flat list, upgrade with drag-and-drop in Phase 1
  const invalidFirst = workout.intervals[0]?.type !== 'prepare'
  const invalidLast = workout.intervals[workout.intervals.length - 1]?.type !== 'cooldown'
  const plannedDuration = formatDuration(flat.reduce((sum, step) => sum + step.duration, 0))

  return (
    <main className="timer-dark-bg flex min-h-dvh flex-col text-timer-on">
      <PlayHeader onEnableSound={unlock} active={phase === 'active'} title={phase === 'idle' ? 'Workout' : workout.title} onClose={() => router.push('/workouts')} />
      {phase === 'active' ? (
        <>
          <PlayScreen
            embedded
            timeLeft={timer.timeLeft}
            duration={interval?.duration ?? 0}
            intervalType={interval?.type ?? 'prepare'}
            label={interval ? getIntervalName(interval, workCount, exercise) : ''}
            nextLabel={nextLabel}
            status={timer.status}
            onPause={timer.pause}
            onResume={() => { unlock(); timer.resume() }}
            onSkip={handleSkip}
            onRestart={handleRestart}
            onPrevious={handlePrevious}
            onAddTime={timer.addTime}
            showAddTime={isRestInRepsWorkout}
            setIndex={currentIdx}
            setCount={total}
            positionLabel="Step"
            totalProgress={progressVal}
            progressPercent={Math.round(progressVal * 100)}
            isRepsMode={isRepsWork}
            exerciseName={exercise?.name ?? interval?.title}
            reps={interval?.reps ?? 0}
            weight={interval?.weight}
            onComplete={() => setShowRepDialog(true)}
            imageUrl={imageUrl}
            nextImageUrl={nextImageUrl}
            nextImageLabel={upcomingWork ? getIntervalName(upcomingWork, workCount + 1, upcomingExercise) : undefined}
            nextImageDetail={upcomingWork ? intervalMeasure(upcomingWork) : undefined}
          />
          {showRepDialog && interval && (
            <RepCompleteDialog
              plannedReps={interval.reps ?? 0}
              plannedWeight={interval.weight}
              onConfirm={handleRepComplete}
              onSkip={handleRepSkip}
            />
          )}
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-10 text-center">
          {phase === 'idle' ? (
            <>
              <h1 className="font-headline text-headline-lg">{workout.title}</h1>
              <p className="text-body-md text-timer-muted">
                {total} interval{total !== 1 && 's'} &middot; {workout.mode === 'reps' ? 'Reps and rest' : `${plannedDuration} planned`}
              </p>
              {(invalidFirst || invalidLast) && (
                <div className="w-full rounded-card border border-warn/50 bg-timer-on/5 p-3">
                  <p className="text-sm text-timer-on">
                    {invalidFirst && 'First interval should be "Prepare". '}
                    {invalidLast && 'Last interval should be "Cooldown".'}
                  </p>
                </div>
              )}
              <button
                onClick={handleStart}
                className="mt-3 min-h-14 w-full rounded-full bg-accent px-32 text-body-lg font-semibold text-accent-on transition-colors hover:bg-accent-hover focus-visible:focus-ring sm:w-auto"
              >
                Start
              </button>
            </>
          ) : (
            <>
              <h1 className="font-headline text-headline-lg">Workout Complete!</h1>
              <p className="text-body-md text-timer-muted">
                {completedIntervals.filter((step) => step.completed).length} of {total} steps completed
              </p>
              <p role="status" className="text-body-md text-timer-muted">Opening session summary…</p>
            </>
          )}
        </div>
      )}
    </main>
  )
}
