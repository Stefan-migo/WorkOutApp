'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
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
import { getTotalRounds, getRoundAt, getProgress } from '@/lib/sequence-engine'
import type { CompletedInterval, Sequence } from '@/types/workout'

import { formatTime } from '@/lib/format'

type Phase = 'idle' | 'active' | 'workout-summary' | 'complete'

export default function PlaySequencePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { getWorkout } = useWorkoutContext()
  const { getSequence } = useSequences()
  const { addSession } = useSessions()
  const { beep } = useBeep()
  const { notify } = useIntervalNotification()
  const { getExercise, getExerciseImages } = useExercises()

  const [sequence, setSequence] = useState<Sequence | undefined>(undefined)
  useEffect(() => {
    getSequence(params.id).then(setSequence)
  }, [params.id, getSequence])
  const totalRounds = sequence ? getTotalRounds(sequence) : 0

  const [roundIdx, setRoundIdx] = useState(0)
  const [intervalIdx, setIntervalIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [completedIntervals, setCompletedIntervals] = useState<CompletedInterval[]>([])
  const [idbImageUrls, setIdbImageUrls] = useState<string[]>([])
  const startedAtRef = useRef(Date.now())
  const skipRef = useRef(false)
  const sessionSavedRef = useRef(false)

  const roundInfo = sequence ? getRoundAt(sequence, roundIdx) : undefined
  const workout = roundInfo ? getWorkout(roundInfo.workoutId) : undefined
  // ponytail: re-flatten at each workout boundary, stable within a workout
  const flat = useMemo(() => (workout ? flattenWorkout(workout) : []), [workout?.id])
  const currentInterval = flat[intervalIdx]
  const progress = sequence ? getProgress(sequence, roundIdx) : { current: 0, total: 0, percent: 0 }

  const exercise = currentInterval?.exerciseId ? getExercise(currentInterval.exerciseId) : undefined
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
  const nextInterval = flat[intervalIdx + 1]

  const timer = useTimer(currentInterval?.duration ?? 0, () => {
    beep({ volume: 0.5, duration: 0.5, pitch: 1000 }) // louder transition
    notify(workout?.title ?? sequence?.title ?? 'Sequence', intervalIdx + 1, flat.length)
    if (skipRef.current) {
      // skip handler already captured interval data, just advance
      skipRef.current = false
      if (intervalIdx < flat.length - 1) {
        setIntervalIdx((prev) => prev + 1)
      } else {
        setPhase('workout-summary')
      }
      return
    }
    // natural completion — capture full planned duration
    if (currentInterval) {
      setCompletedIntervals((prev) => [...prev, {
        intervalId: currentInterval.id,
        title: currentInterval.title,
        type: currentInterval.type,
        plannedDuration: currentInterval.duration,
        actualDuration: currentInterval.duration,
        completed: true,
      }])
    }
    if (intervalIdx < flat.length - 1) {
      setIntervalIdx((prev) => prev + 1)
    } else {
      setPhase('workout-summary')
    }
  }, handleTick)

  // ponytail: beep on tick — check by last-beep time only (≥800ms), ignore which second
  const lastBeepTimeRefSeq = useRef(0)
  const prevRemainingRefSeq = useRef(0)
  function handleTick(remaining: number) {
    if (remaining > 5 || remaining <= 0) return
    const prev = prevRemainingRefSeq.current
    prevRemainingRefSeq.current = remaining
    if (prev === remaining) return
    const now = Date.now()
    if (now - lastBeepTimeRefSeq.current < 800) return
    lastBeepTimeRefSeq.current = now
    beep({ volume: 0.12, duration: 0.15, pitch: 1100 })
  }

  // Auto-start timer when phase activates or interval/round advances
  useEffect(() => {
    if (phase === 'active') {
      timer.start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, intervalIdx, roundIdx])

  // Auto-advance countdown during workout-summary
  const [countdown, setCountdown] = useState(5)
  useEffect(() => {
    if (phase !== 'workout-summary') return
    setCountdown(5)
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  // When countdown hits 0, advance to next round or complete
  useEffect(() => {
    if (phase !== 'workout-summary' || countdown > 0) return
    if (roundIdx >= totalRounds - 1) {
      setPhase('complete')
    } else {
      setRoundIdx((prev) => prev + 1)
      setIntervalIdx(0)
      setPhase('active')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  // Save session on complete
  useEffect(() => {
    if (phase !== 'complete' || sessionSavedRef.current || !sequence) return
    sessionSavedRef.current = true
    const session = {
      id: crypto.randomUUID(),
      type: 'sequence' as const,
      sequenceId: sequence.id,
      startedAt: startedAtRef.current,
      completedAt: Date.now(),
      intervals: completedIntervals,
    }
    addSession(session)
    router.push(`/history/${session.id}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function handleStart() {
    startedAtRef.current = Date.now()
    setPhase('active')
  }

  function handleSkipInterval() {
    skipRef.current = true
    // capture partial actualDuration before timer.skip() resets timeLeft
    if (currentInterval) {
      const elapsed = currentInterval.duration - timer.timeLeft
      setCompletedIntervals((prev) => [...prev, {
        intervalId: currentInterval.id,
        title: currentInterval.title,
        type: currentInterval.type,
        plannedDuration: currentInterval.duration,
        actualDuration: Math.max(0, elapsed),
        completed: false,
      }])
    }
    timer.skip()
  }

  function handleSkipWorkout() {
    // mark remaining intervals of current workout as not completed
    const remaining = flat.slice(intervalIdx)
    setCompletedIntervals((prev) => [...prev, ...remaining.map((intv) => ({
      intervalId: intv.id,
      title: intv.title,
      type: intv.type,
      plannedDuration: intv.duration,
      actualDuration: intv === currentInterval
        ? Math.max(0, intv.duration - timer.timeLeft)
        : 0,
      completed: false,
    } satisfies CompletedInterval))])
    setPhase('workout-summary')
  }

  function handleFinishEarly() {
    // skip current workout + all remaining rounds
    const remaining = flat.slice(intervalIdx)
    setCompletedIntervals((prev) => [...prev, ...remaining.map((intv) => ({
      intervalId: intv.id,
      title: intv.title,
      type: intv.type,
      plannedDuration: intv.duration,
      actualDuration: intv === currentInterval
        ? Math.max(0, intv.duration - timer.timeLeft)
        : 0,
      completed: false,
    } satisfies CompletedInterval))])
    setPhase('complete')
  }

  function goToNextRound() {
    if (roundIdx >= totalRounds - 1) {
      setPhase('complete')
    } else {
      setRoundIdx((prev) => prev + 1)
      setIntervalIdx(0)
    }
  }

  function handleRestart() {
    timer.start()
  }

  // --- Render ---

  if (!sequence) {
    return (
      <div className="timer-dark-bg text-white min-h-screen flex flex-col items-center justify-center gap-4 px-margin-mobile">
        <h1 className="font-headline-lg text-headline-lg">Sequence not found</h1>
        <Link href="/sequences" className="text-gray-400 hover:text-white transition-colors">
          &larr; Back to sequences
        </Link>
      </div>
    )
  }

  if (!workout && phase !== 'complete') {
    return (
      <div className="timer-dark-bg text-white min-h-screen flex flex-col items-center justify-center gap-4 px-margin-mobile">
        <h1 className="font-headline-lg text-headline-lg">Workout not found</h1>
        <p className="font-body-md text-body-md text-gray-400">A workout in this sequence may have been deleted.</p>
        <div className="flex gap-4">
          <button onClick={handleSkipWorkout} className="px-6 py-3 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition-colors">
            Skip to next
          </button>
          <Link href="/sequences" className="px-6 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-colors">
            Back to sequences
          </Link>
        </div>
      </div>
    )
  }

  const totalDuration = flat.reduce((s, i) => s + i.duration, 0)
  const progressVal =
    totalDuration > 0 && currentInterval
      ? (flat.slice(0, intervalIdx).reduce((s, i) => s + i.duration, 0) +
          (currentInterval.duration - timer.timeLeft)) / totalDuration
      : 0

  return (
    <div className="timer-dark-bg text-white min-h-screen flex flex-col">
      <PlayHeader title={sequence.title} onClose={() => router.push('/sequences')} />

      <main className="flex-grow flex flex-col items-center px-margin-mobile py-24 w-full max-w-4xl mx-auto">
        {/* Progress bar — visible during active and summary phases */}
        {phase !== 'idle' && (
          <div className="w-full max-w-2xl mb-24">
            <div className="flex justify-between items-center mb-8">
              <span className="font-data-sm text-data-sm text-gray-400">{sequence.title} Progress</span>
              <span className="font-data-sm text-data-sm text-white">{progress.percent}%</span>
            </div>
            <ProgressBar progress={progress.percent / 100} dark />
            <div className="flex justify-between w-full font-label-caps text-label-caps text-gray-400 mt-sm">
              <span>{progress.current + 1}/{progress.total}</span>
              {workout && <span>Workout: {workout.title}</span>}
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <>
            <h1 className="font-headline-lg text-headline-lg text-white mb-8 mt-24">{sequence.title}</h1>
            <p className="font-body-md text-body-md text-gray-400 mb-24">
              {totalRounds} round{totalRounds !== 1 && 's'} &middot;{' '}
              {sequence.workoutIds.length} workout{sequence.workoutIds.length !== 1 && 's'}
              {sequence.repeatCount > 1 && ` × ${sequence.repeatCount}`}
            </p>
            <button
              onClick={handleStart}
              className="px-12 py-4 rounded-full text-xl font-bold transition-colors bg-primary text-on-primary hover:opacity-90"
            >
              Start Sequence
            </button>
          </>
        )}

        {phase === 'active' && (
          <div className="flex flex-col lg:flex-row gap-24 w-full max-w-6xl mx-auto items-start">
            {/* Left column — Exercise info */}
            <div className="w-full lg:w-1/2 flex justify-center lg:sticky lg:top-24">
              {currentInterval?.exerciseId && (
                <ExercisePanel
                  name={exercise?.name ?? ''}
                  exerciseId={currentInterval.exerciseId}
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
              {/* Timer Ring */}
              {currentInterval && (
                <TimerRing
                  timeLeft={timer.timeLeft}
                  duration={currentInterval.duration}
                  intervalType={currentInterval.type}
                  label={currentInterval.title}
                  nextLabel={nextInterval ? `Next: ${nextInterval.title} (${formatTime(nextInterval.duration)})` : undefined}
                />
              )}

              {/* Controls */}
              <TimerControls
                status={timer.status}
                onPause={timer.pause}
                onResume={timer.resume}
                onSkip={handleSkipInterval}
                onRestart={handleRestart}
                onPrevious={() => {
                  if (intervalIdx > 0) {
                    setIntervalIdx((prev) => prev - 1)
                  }
                }}
              />

              {/* Workout-level Progress */}
              <div className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-8">
                  <span className="font-data-sm text-data-sm text-gray-400">{workout?.title ?? 'Workout'} Progress</span>
                  <span className="font-data-sm text-data-sm text-white">{Math.round(progressVal * 100)}%</span>
                </div>
                <ProgressBar progress={progressVal} dark />
                <div className="flex justify-between w-full font-label-caps text-label-caps text-gray-400 mt-8">
                  <span>{intervalIdx + 1} of {flat.length}</span>
                  <span>{currentInterval?.title ?? ''}</span>
                </div>
              </div>

              {/* ponytail: flat skip + finish buttons, no sub-menus */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleSkipWorkout}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-gray-400 hover:text-white transition-colors"
                >
                  Skip to next workout
                </button>
                <button
                  onClick={handleFinishEarly}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-red-400/50 text-red-400 hover:text-white transition-colors"
                >
                  Finish Early
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'workout-summary' && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center">
            <h1 className="font-headline-lg text-headline-lg text-white">Workout Complete!</h1>
            <p className="font-body-md text-body-md text-gray-400">
              {workout?.title} &mdash; {flat.length} interval{flat.length !== 1 && 's'}
            </p>
            {countdown > 0 && (
              <>
                <p className="font-body-lg text-body-lg text-white">Next workout in {countdown}s</p>
                <button
                  onClick={goToNextRound}
                  className="px-6 py-3 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition-colors"
                >
                  Next Workout
                </button>
              </>
            )}
          </div>
        )}

        {phase === 'complete' && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center">
            <h1 className="font-headline-lg text-headline-lg text-white">Sequence Complete!</h1>
            <p className="font-body-md text-body-md text-gray-400">
              {completedIntervals.length} interval{completedIntervals.length !== 1 && 's'} across{' '}
              {totalRounds} round{totalRounds !== 1 && 's'}
            </p>
            <p className="font-body-md text-body-md text-gray-400">Saving session...</p>
          </div>
        )}
      </main>
    </div>
  )
}
