'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { EXERCISE_CLIP_SECONDS, EXERCISE_VIDEO_TYPES, MAX_EXERCISE_CLIP_BYTES } from '@/lib/exercise-media'

type Phase = 'idle' | 'opening' | 'ready' | 'recording' | 'finishing'

export function ExerciseCamera({ onCapture, onCancel }: {
  onCapture: (file: File) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const requestRef = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)
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

  async function openCamera() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Camera recording is unavailable here. Try a browser with camera support.')
      return
    }
    const request = ++requestRef.current
    setPreviewReady(false)
    setPhase('opening')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640, max: 640 }, height: { ideal: 480, max: 640 }, frameRate: { ideal: 24, max: 30 } },
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
      const mimeType = ['video/mp4;codecs=avc1.42001E', 'video/mp4', 'video/webm;codecs=vp8', 'video/webm']
        .find((type) => MediaRecorder.isTypeSupported(type))
      if (!mimeType) {
        setError('This browser cannot record MP4 or WebM.')
        return
      }
      const recorder = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 650_000 })
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
        const type = (chunks[0]?.type || recorder.mimeType).split(';')[0] ?? ''
        const file = new File(chunks, type === 'video/mp4' ? 'demonstration.mp4' : 'demonstration.webm', { type })
        if (!EXERCISE_VIDEO_TYPES.has(type) || file.size === 0 || file.size > MAX_EXERCISE_CLIP_BYTES) {
          setError(file.size > MAX_EXERCISE_CLIP_BYTES ? 'This take exceeded 1 MB. Try a shorter recording.' : 'No playable clip was captured. Try again.')
          setPhase('ready')
          return
        }
        onCapture(file)
      }
      recorder.start()
      setPhase('recording')
      timerRef.current = window.setTimeout(finish, EXERCISE_CLIP_SECONDS * 1000)
    } catch {
      setError('Could not start recording. Try again.')
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-control border border-border-soft p-3">
      <p className="text-sm text-muted">Frame your whole body. Up to {EXERCISE_CLIP_SECONDS} seconds, without audio.</p>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Camera preview"
        onPlaying={() => setPreviewReady(true)}
        className={`max-h-56 w-full rounded-control bg-surface-warm object-contain ${phase === 'idle' || phase === 'opening' ? 'hidden' : ''}`}
      />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {(phase === 'idle' || phase === 'opening') && <Button type="button" size="sm" disabled={phase === 'opening'} onClick={openCamera}>{phase === 'opening' ? 'Opening camera…' : 'Enable camera'}</Button>}
        {phase === 'ready' && <Button type="button" size="sm" disabled={!previewReady} onClick={record}>Start recording</Button>}
        {phase === 'recording' && <Button type="button" size="sm" onClick={finish}>Stop recording</Button>}
        {phase === 'finishing' && <span role="status" className="self-center text-sm">Preparing preview…</span>}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Close camera</Button>
      </div>
    </div>
  )
}
