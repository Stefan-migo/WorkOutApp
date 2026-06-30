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
import { TimerDisplay } from '@/components/TimerDisplay'
import { ProgressBar } from '@/components/ProgressBar'
import { TimerControls } from '@/components/TimerControls'
import { flattenWorkout } from '@/lib/interval-engine'
import { getTotalRounds, getRoundAt, getProgress } from '@/lib/sequence-engine'
import type { CompletedInterval } from '@/types/workout'

type Phase = 'idle' | 'active' | 'workout-summary' | 'complete'

const TYPE_BADGES: Record<string, string> = {
  prepare: 'bg-interval-prepare',
  work: 'bg-interval-work',
  rest: 'bg-interval-rest',
  cooldown: 'bg-interval-cooldown',
}

export default function PlaySequencePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { getWorkout } = useWorkoutContext()
  const { getSequence } = useSequences()
  const { addSession } = useSessions()
  const { beep } = useBeep()
  const { notify } = useIntervalNotification()

  const sequence = getSequence(params.id)
  const totalRounds = sequence ? getTotalRounds(sequence) : 0

  const [roundIdx, setRoundIdx] = useState(0)
  const [intervalIdx, setIntervalIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [completedIntervals, setCompletedIntervals] = useState<CompletedInterval[]>([])
  const startedAtRef = useRef(Date.now())
  const skipRef = useRef(false)
  const sessionSavedRef = useRef(false)

  const roundInfo = sequence ? getRoundAt(sequence, roundIdx) : undefined
  const workout = roundInfo ? getWorkout(roundInfo.workoutId) : undefined
  // ponytail: re-flatten at each workout boundary, stable within a workout
  const flat = useMemo(() => (workout ? flattenWorkout(workout) : []), [workout?.id])
  const currentInterval = flat[intervalIdx]
  const progress = sequence ? getProgress(sequence, roundIdx) : { current: 0, total: 0, percent: 0 }

  const timer = useTimer(currentInterval?.duration ?? 0, () => {
    beep()
    notify(workout?.title ?? sequence.title, intervalIdx + 1, flat.length)
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
  })

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
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center text-fg">
        <h1 className="text-2xl font-bold">Sequence not found</h1>
        <Link href="/sequences" className="text-accent hover:underline">
          &larr; Back to sequences
        </Link>
      </div>
    )
  }

  if (!workout && phase !== 'complete') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center text-fg">
        <h1 className="text-2xl font-bold">Workout not found</h1>
        <p className="text-muted">A workout in this sequence may have been deleted.</p>
        <div className="flex gap-4">
          <button onClick={handleSkipWorkout} className="px-6 py-3 rounded-lg bg-accent text-accent-on font-medium">
            Skip to next
          </button>
          <Link href="/sequences" className="px-6 py-3 rounded-lg bg-surface text-fg font-medium">
            Back to sequences
          </Link>
        </div>
      </div>
    )
  }

  const badgeClass = currentInterval ? TYPE_BADGES[currentInterval.type] ?? 'bg-zinc-600' : 'bg-zinc-600'
  const totalDuration = flat.reduce((s, i) => s + i.duration, 0)
  const progressVal =
    totalDuration > 0 && currentInterval
      ? (flat.slice(0, intervalIdx).reduce((s, i) => s + i.duration, 0) +
          (currentInterval.duration - timer.timeLeft)) / totalDuration
      : 0

  return (
    <div className="max-w-lg mx-auto w-full p-6 flex flex-col items-center gap-8 bg-[#1e1416] text-[#f7f3f1] min-h-screen">
      {/* Progress bar — visible during active and summary phases */}
      {phase !== 'idle' && (
        <div className="w-full">
          <div className="flex justify-between text-sm mb-1" style={{ color: '#8a7678' }}>
            <span>Workout {progress.current + 1}/{progress.total}</span>
            <span>{progress.percent}% complete</span>
          </div>
          <ProgressBar progress={progress.percent / 100} label="Sequence progress" />
        </div>
      )}

      {phase === 'idle' && (
        <>
          <h1 className="text-3xl font-bold text-center mt-12" style={{ color: '#f7f3f1' }}>{sequence.title}</h1>
          <p className="text-center" style={{ color: '#8a7678' }}>
            {totalRounds} round{totalRounds !== 1 && 's'} &middot;{' '}
            {sequence.workoutIds.length} workout{sequence.workoutIds.length !== 1 && 's'}
            {sequence.repeatCount > 1 && ` × ${sequence.repeatCount}`}
          </p>
          <button
            onClick={handleStart}
            className="mt-4 px-12 py-4 bg-accent hover:bg-accent text-accent-on rounded-full text-xl font-bold transition-colors min-w-[44px] min-h-[44px]"
          >
            Start Sequence
          </button>
        </>
      )}

      {phase === 'active' && (
        <>
          <div className="flex items-center gap-3 w-full">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${badgeClass}`}>
              {currentInterval?.type}
            </span>
            <span className="text-sm" style={{ color: '#8a7678' }}>
              {intervalIdx + 1} / {flat.length}
            </span>
            {roundInfo && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-accent text-accent">
                Round {roundInfo.round}/{sequence.repeatCount}
              </span>
            )}
          </div>

          <h2 className="text-xl font-semibold -mt-4" style={{ color: '#f7f3f1' }}>
            {workout?.title} &mdash; {currentInterval?.title}
          </h2>

          <TimerDisplay timeLeft={timer.timeLeft} />
          <ProgressBar progress={progressVal} label="Workout progress" />
          <TimerControls
            status={timer.status}
            onPause={timer.pause}
            onResume={timer.resume}
            onSkip={handleSkipInterval}
            onRestart={handleRestart}
          />

          {/* ponytail: flat skip + finish buttons, no sub-menus */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleSkipWorkout}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted hover:text-fg transition-colors min-w-[44px] min-h-[44px]"
            >
              Skip to next workout
            </button>
            <button
              onClick={handleFinishEarly}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-status-warning text-status-warning hover:text-fg transition-colors min-w-[44px] min-h-[44px]"
            >
              Finish Early
            </button>
          </div>
        </>
      )}

      {phase === 'workout-summary' && (
        <div className="flex flex-col items-center gap-4 mt-12 text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#3a7050' }}>Workout Complete!</h1>
          <p style={{ color: '#8a7678' }}>
            {workout?.title} &mdash; {flat.length} interval{flat.length !== 1 && 's'}
          </p>
          {countdown > 0 && (
            <>
              <p className="text-lg" style={{ color: '#f7f3f1' }}>Next workout in {countdown}s</p>
              <button
                onClick={goToNextRound}
                className="px-6 py-3 rounded-lg bg-accent text-accent-on font-medium transition-colors min-w-[44px] min-h-[44px]"
              >
                Next Workout
              </button>
            </>
          )}
        </div>
      )}

      {phase === 'complete' && (
        <div className="flex flex-col items-center gap-4 mt-12 text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#3a7050' }}>Sequence Complete!</h1>
          <p style={{ color: '#8a7678' }}>
            {completedIntervals.length} interval{completedIntervals.length !== 1 && 's'} across{' '}
            {totalRounds} round{totalRounds !== 1 && 's'}
          </p>
          <p style={{ color: '#8a7678' }}>Saving session...</p>
        </div>
      )}
    </div>
  )
}
