'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { EXERCISE_CLIP_SECONDS } from '@/lib/exercise-media'

import { createExerciseRecorder, recordingFile } from '@/lib/exercise-recording'

type Phase = 'idle' | 'opening' | 'ready' | 'countdown' | 'recording' | 'finishing'

export function ExerciseCamera({ onCapture, onCancel }: {
  onCapture: (file: File, duration: number) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const requestRef = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)
  const startedAt = useRef(0)
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [delay, setDelay] = useState(5)
  const [limit, setLimit] = useState(EXERCISE_CLIP_SECONDS)
  const [remaining, setRemaining] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [previewReady, setPreviewReady] = useState(false)

  useEffect(() => () => {
    requestRef.current++
    window.clearTimeout(timerRef.current)
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      recorder.onerror = null
      recorder.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  async function openCamera(nextFacing = facing) {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Camera recording is unavailable here. Try a browser with camera support.')
      return
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    const request = ++requestRef.current
    setPreviewReady(false)
    setPhase('opening')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: nextFacing }, width: { ideal: 640, max: 640 }, height: { ideal: 480, max: 640 }, frameRate: { ideal: 24, max: 30 } },
      })
      if (request !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setPhase('ready')
    } catch {
      if (request === requestRef.current) {
        setPhase('idle')
        setError('Could not open the camera. Check browser permissions and try again.')
      }
    }
  }

  function finish() {
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') {
      window.clearTimeout(timerRef.current)
      setPhase('finishing')
      recorder.stop()
    }
  }

  function record() {
    if (!streamRef.current) return
    setError('')
    try {
      const recorder = createExerciseRecorder(streamRef.current)
      recorderRef.current = recorder
      const chunks: Blob[] = []
      recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data) }
      recorder.onerror = () => {
        window.clearTimeout(timerRef.current)
        recorder.onstop = null
        setError('Recording stopped unexpectedly. Try again.')
        setPhase('ready')
      }
      recorder.onstop = () => {
        window.clearTimeout(timerRef.current)
        try {
          const duration = Math.min(limit, Math.max(0.1, (performance.now() - startedAt.current) / 1000))
          onCapture(recordingFile(recorder, chunks), duration)
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Could not prepare this take.')
          setPhase('ready')
        }
      }
      startedAt.current = performance.now()
      recorder.start()
      setPhase('recording')
      timerRef.current = window.setTimeout(finish, limit * 1000)
    } catch {
      setPhase('ready')
      setError('Could not start recording. Try again.')
    }
  }

  function startCountdown() {
    setPhase('countdown')
    const end = performance.now() + delay * 1000
    function tick() {
      const seconds = Math.ceil((end - performance.now()) / 1000)
      if (seconds <= 0) {
        record()
        return
      }
      setRemaining(seconds)
      timerRef.current = window.setTimeout(tick, 1000)
    }
    tick()
  }

  const canConfigure = phase === 'idle' || phase === 'ready'

  return (
    <div className="flex flex-col gap-2 rounded-control border border-border-soft p-3">
      <p className="text-sm text-muted">Frame your whole body. Up to {EXERCISE_CLIP_SECONDS} seconds, without audio.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">Camera
          <select className="min-h-11 rounded-control border border-border-soft bg-surface px-2" value={facing} disabled={!canConfigure} onChange={(event) => {
            const next = event.target.value as typeof facing
            setFacing(next)
            if (phase === 'ready') void openCamera(next)
          }}>
            <option value="environment">Rear camera</option>
            <option value="user">Front camera</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">Countdown
          <select className="min-h-11 rounded-control border border-border-soft bg-surface px-2" value={delay} disabled={!canConfigure} onChange={(event) => setDelay(Number(event.target.value))}>
            {[3, 5, 10].map((seconds) => <option key={seconds} value={seconds}>{seconds} seconds</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">Recording length
          <select className="min-h-11 rounded-control border border-border-soft bg-surface px-2" value={limit} disabled={!canConfigure} onChange={(event) => setLimit(Number(event.target.value))}>
            {Array.from({ length: EXERCISE_CLIP_SECONDS }, (_, index) => index + 1).map((seconds) => <option key={seconds} value={seconds}>{seconds} s</option>)}
          </select>
        </label>
      </div>
      <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Camera preview"
        onPlaying={() => setPreviewReady(true)}
        className={`max-h-56 w-full rounded-control bg-surface-warm object-contain ${phase === 'idle' || phase === 'opening' ? 'hidden' : ''}`}
      />
        {phase === 'countdown' && (
          <div role="status" aria-label={`Recording starts in ${remaining} seconds`} className="pointer-events-none absolute inset-0 grid place-items-center rounded-control bg-black/30">
            <span className="text-6xl font-bold tabular-nums text-white">{remaining}</span>
          </div>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {(phase === 'idle' || phase === 'opening') && <Button type="button" size="sm" disabled={phase === 'opening'} onClick={() => void openCamera()}>{phase === 'opening' ? 'Opening camera…' : 'Enable camera'}</Button>}
        {phase === 'ready' && <Button type="button" size="sm" disabled={!previewReady} onClick={startCountdown}>Start countdown</Button>}
        {phase === 'countdown' && <Button type="button" variant="outline" size="sm" onClick={() => {
          window.clearTimeout(timerRef.current)
          setPhase('ready')
        }}>Cancel countdown</Button>}
        {phase === 'recording' && <Button type="button" size="sm" onClick={finish}>Stop recording</Button>}
        {phase === 'finishing' && <span role="status" className="self-center text-sm">Preparing preview…</span>}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Close camera</Button>
      </div>
    </div>
  )
}
