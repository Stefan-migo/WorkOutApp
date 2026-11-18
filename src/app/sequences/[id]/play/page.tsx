'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { useSessions } from '@/hooks/useSessions'
import { useTimer } from '@/hooks/useTimer'
import { useBeep } from '@/hooks/useBeep'
import { usePlaybackSettings } from '@/hooks/usePlaybackSettings'
import { useIntervalNotification } from '@/hooks/useIntervalNotification'
import { ProgressBar } from '@/components/ProgressBar'
import { PlayScreen } from '@/components/blocks/PlayScreen'
import { PlayHeader } from '@/components/PlayHeader'
import { ExercisePanel } from '@/components/ExercisePanel'
import { useExercises } from '@/hooks/useExercises'
import { flattenWorkout } from '@/lib/interval-engine'
import { getTotalRounds, getRoundAt, getProgress } from '@/lib/sequence-engine'
import { getIntervalName } from '@/lib/interval-display'
import type { CompletedInterval, Sequence } from '@/types/workout'

import { formatTime } from '@/lib/format'

type Phase = 'idle' | 'active' | 'workout-summary' | 'complete'

export default function PlaySequencePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { workouts, isLoading: isWorkoutLoading } = useWorkoutContext()
  const { getSequence } = useSequences()
  const { addSession } = useSessions()
  const { settings } = usePlaybackSettings()
  const { beep, unlock } = useBeep(settings.sound)
  const { notify } = useIntervalNotification()
  const { exercises, getExerciseImages } = useExercises()

  const [sequence, setSequence] = useState<Sequence | undefined>(undefined)
  const [loadedSequenceId, setLoadedSequenceId] = useState<string>()
  useEffect(() => {
    let isCurrent = true
    void getSequence(params.id).then((result) => {
      if (!isCurrent) return
      setSequence(result)
      setLoadedSequenceId(params.id)
    })
    return () => { isCurrent = false }
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
  const workout = roundInfo ? workouts.find((w) => w.id === roundInfo.workoutId) : undefined
  // ponytail: re-flatten at each workout boundary, stable within a workout
  const flat = useMemo(() => (workout ? flattenWorkout(workout) : []), [workout?.id])
  const currentInterval = flat[intervalIdx]
  // ponytail: reps mode fallback to timed for sequences, add full reps support when needed
  const isRepsFallback = workout?.mode === 'reps'
  const progress = sequence ? getProgress(sequence, roundIdx) : { current: 0, total: 0, percent: 0 }

  // ponytail: exercises already loaded — use find, not async getExercise
  const exercise = currentInterval?.exerciseId
    ? exercises.find((e) => e.id === currentInterval.exerciseId)
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
  // Work count up to current interval (1-based, for display naming)
  const seqWorkCount = flat.slice(0, intervalIdx + 1).filter((i) => i.type === 'work').length
  const nextInterval = flat[intervalIdx + 1]

  // ponytail: if a reps-mode interval has 0 duration (no timer needed in reps mode),
  // fall back to a default timer so the sequence doesn't flash through intervals
  const timerDuration = currentInterval?.duration && currentInterval.duration > 0
    ? currentInterval.duration
    : isRepsFallback ? 30 : 0
  const timer = useTimer(timerDuration, () => {
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

  function handleTick(remaining: number) {
    if (remaining > 5 || remaining <= 0) return
    beep({ volume: 0.3, duration: 0.15, pitch: 900 + (5 - remaining) * 100 })
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

  useEffect(() => {
    if (phase === 'workout-summary' && countdown > 0) {
      beep({ volume: 0.3, duration: 0.15, pitch: 900 + (5 - countdown) * 100 })
    }
  }, [phase, countdown, beep])

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
    void Promise.resolve(addSession(session)).then(() => router.push(`/history/${session.id}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function handleStart() {
    unlock()
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

  if ((!sequence && loadedSequenceId !== params.id) || (!workout && isWorkoutLoading)) {
    return (
      <main className="timer-dark-bg grid min-h-dvh place-items-center px-margin-mobile text-timer-muted">
        <p role="status">Loading sequence…</p>
      </main>
    )
  }

  if (!sequence) {
    return (
      <div className="timer-dark-bg text-timer-on min-h-screen flex flex-col items-center justify-center gap-4 px-margin-mobile">
        <h1 className="font-headline-lg text-headline-lg">Sequence not found</h1>
        <Link href="/sequences" className="text-timer-muted hover:text-timer-on transition-colors">
          &larr; Back to sequences
        </Link>
      </div>
    )
  }

  if (!workout && phase !== 'complete') {
    return (
      <div className="timer-dark-bg text-timer-on min-h-screen flex flex-col items-center justify-center gap-4 px-margin-mobile">
        <h1 className="font-headline-lg text-headline-lg">Workout not found</h1>
        <p className="font-body-md text-body-md text-timer-muted">A workout in this sequence may have been deleted.</p>
        <div className="flex gap-4">
          <button onClick={handleSkipWorkout} className="px-6 py-3 rounded-full bg-accent text-accent-on font-medium hover:opacity-90 transition-colors">
            Skip to next
          </button>
          <Link href="/sequences" className="px-6 py-3 rounded-full border border-timer-border text-timer-on font-medium hover:bg-timer-on/10 transition-colors">
            Back to sequences
          </Link>
        </div>
      </div>
    )
  }

  const progressVal = flat.length > 0 ? (intervalIdx + timer.progress) / flat.length : 0

  return (
    <main className="timer-dark-bg flex min-h-dvh flex-col text-timer-on">
      <PlayHeader onEnableSound={unlock} active={phase === 'active' || phase === 'workout-summary'} title={phase === 'idle' ? 'Sequence' : sequence.title} onClose={() => router.push('/sequences')} />

      <div className={`mx-auto flex w-full flex-1 flex-col items-center ${phase === 'active' ? 'max-w-6xl py-4' : 'max-w-lg justify-center px-margin-mobile py-10 text-center'}`}>
        {/* Progress bar — visible during active and summary phases */}
        {phase !== 'idle' && (
          <div className="relative mb-4 w-full max-w-2xl px-margin-mobile">
            <span className="absolute right-margin-mobile top-0 font-mono text-data-sm text-timer-on">{progress.percent}%</span>
            <ProgressBar progress={progress.percent / 100} label="Sequence progress" variant="plain" dark />
            <div className="flex justify-between w-full font-label-caps text-label-caps text-timer-muted mt-sm">
              <span className="shrink-0">Round {progress.current + 1} of {progress.total}</span>
              {workout && <span className="min-w-0 truncate text-right">{workout.title}</span>}
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <>
            <h1 className="font-headline text-headline-lg">{sequence.title}</h1>
            <p className="mb-6 mt-4 text-body-md text-timer-muted">
              {totalRounds} round{totalRounds !== 1 && 's'} &middot;{' '}
              {sequence.workoutIds.length} workout{sequence.workoutIds.length !== 1 && 's'}
              {sequence.repeatCount > 1 && ` × ${sequence.repeatCount}`}
            </p>
            <button
              onClick={handleStart}
              className="min-h-14 w-full rounded-full bg-accent px-32 text-body-lg font-semibold text-accent-on transition-colors hover:bg-accent-hover focus-visible:focus-ring sm:w-auto"
            >
              Start Sequence
            </button>
          </>
        )}

        {phase === 'active' && currentInterval && (
          <div className="mx-auto flex w-full flex-1 flex-col items-start gap-6 lg:flex-row lg:justify-center">
            <div className="flex w-full flex-1 flex-col self-stretch lg:max-w-2xl">
              <PlayScreen
                embedded
                timeLeft={timer.timeLeft}
                duration={timerDuration}
                intervalType={currentInterval.type}
                label={getIntervalName(currentInterval, seqWorkCount, exercise)}
                nextLabel={nextInterval ? `Next: ${nextInterval.type === 'work' ? getIntervalName(nextInterval, seqWorkCount + 1) : nextInterval.title} (${formatTime(nextInterval.duration)})` : undefined}
                status={timer.status}
                onPause={timer.pause}
                onResume={() => { unlock(); timer.resume() }}
                onSkip={handleSkipInterval}
                onRestart={handleRestart}
                onPrevious={intervalIdx > 0 ? () => setIntervalIdx((prev) => prev - 1) : undefined}
                setIndex={intervalIdx}
                setCount={flat.length}
                positionLabel="Step"
                totalProgress={progressVal}
                progressPercent={Math.round(progressVal * 100)}
                progressLabel="Workout progress"
                exerciseName={exercise?.name}
                isRepsMode={false}
              />
              <div className="flex flex-wrap items-center justify-center gap-3 px-margin-mobile py-4">
                <button
                  onClick={handleSkipWorkout}
                  className="min-h-11 rounded-control border border-timer-border px-4 text-sm font-medium text-timer-on transition-colors hover:bg-timer-on/10 focus-visible:focus-ring"
                >
                  Skip to next workout
                </button>
                <button
                  onClick={handleFinishEarly}
                  className="min-h-11 rounded-control border border-danger/50 px-4 text-sm font-medium text-timer-on transition-colors hover:bg-danger/10 focus-visible:focus-ring"
                >
                  Finish Early
                </button>
              </div>
            </div>
            {currentInterval.exerciseId && (
              <div className="flex w-full justify-center px-margin-mobile lg:sticky lg:top-20 lg:w-2/5 lg:py-6">
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
              </div>
            )}
          </div>
        )}

        {phase === 'workout-summary' && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center">
            <h1 className="font-headline-lg text-headline-lg text-timer-on">Workout Complete!</h1>
            <p className="font-body-md text-body-md text-timer-muted">
              {workout?.title} &mdash; {flat.length} interval{flat.length !== 1 && 's'}
            </p>
            {countdown > 0 && (
              <>
                <p className="font-body-lg text-body-lg text-timer-on">Next workout in {countdown}s</p>
                <button
                  onClick={goToNextRound}
                  className="px-6 py-3 rounded-full bg-accent text-accent-on font-medium hover:opacity-90 transition-colors"
                >
                  Next Workout
                </button>
              </>
            )}
          </div>
        )}

        {phase === 'complete' && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center">
            <h1 className="font-headline-lg text-headline-lg text-timer-on">Sequence Complete!</h1>
            <p className="font-body-md text-body-md text-timer-muted">
              {completedIntervals.length} interval{completedIntervals.length !== 1 && 's'} across{' '}
              {totalRounds} round{totalRounds !== 1 && 's'}
            </p>
            <p role="status" className="text-body-md text-timer-muted">Opening session summary…</p>
          </div>
        )}
      </div>
    </main>
  )
}
