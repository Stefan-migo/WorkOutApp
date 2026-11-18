'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createExerciseRecorder } from '@/lib/exercise-recording'

export type RecordingStatus = 'idle' | 'opening' | 'ready' | 'recording' | 'stopping' | 'recorded'
const MAX_RECORDING_BYTES = 200 * 1024 * 1024

export function useWorkoutRecording() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [video, setVideo] = useState<{ url: string; file: File } | null>(null)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const requestRef = useRef(0)
  const videoUrlRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  const releaseCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (mountedRef.current) setStream(null)
  }, [])

  const stop = useCallback(() => {
    requestRef.current += 1
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      setStatus('stopping')
      recorder.stop()
    } else if (!recorder) {
      releaseCamera()
      setStatus((previous) => previous === 'recorded' ? previous : 'idle')
    }
  }, [releaseCamera])

  const discard = useCallback(() => {
    requestRef.current += 1
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder) {
      recorder.ondataavailable = null
      recorder.onstop = null
      recorder.onerror = null
      if (recorder.state !== 'inactive') recorder.stop()
    }
    releaseCamera()
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current)
    videoUrlRef.current = null
    setVideo(null)
    setError('')
    setStatus('idle')
  }, [releaseCamera])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      requestRef.current += 1
      const recorder = recorderRef.current
      if (recorder) {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.onerror = null
        if (recorder.state !== 'inactive') recorder.stop()
      }
      releaseCamera()
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current)
    }
  }, [releaseCamera])

  useEffect(() => {
    if (status !== 'recording' && status !== 'stopping' && !video) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [status, video])

  useEffect(() => {
    if (status !== 'recording') return
    const stopOnBackground = () => {
      if (document.visibilityState === 'hidden') {
        setError('Recording stopped because the app went into the background. Save your clip before recording another.')
        stop()
      }
    }
    document.addEventListener('visibilitychange', stopOnBackground)
    return () => document.removeEventListener('visibilitychange', stopOnBackground)
  }, [status, stop])

  const openCamera = useCallback(async (facingMode: 'user' | 'environment', audio: boolean) => {
    if (streamRef.current || recorderRef.current) return
    const request = ++requestRef.current
    setError('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Recording requires HTTPS and a browser with camera recording support.')
      return
    }
    setStatus('opening')
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio,
      })
      if (!mountedRef.current || request !== requestRef.current) {
        acquired.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = acquired
      setStream(acquired)
      setStatus('ready')
      acquired.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (streamRef.current !== acquired) return
          setError('The camera was interrupted. Save any recorded video, then reopen the camera.')
          stop()
        })
      })
    } catch (cause) {
      if (!mountedRef.current || request !== requestRef.current) return
      const name = cause instanceof DOMException ? cause.name : ''
      setError(name === 'NotAllowedError'
        ? 'Camera access was denied. Allow access in your browser settings and try again.'
        : 'The camera could not be opened. Check that it is available and try again.')
      setStatus('idle')
    }
  }, [stop])

  const start = useCallback(() => {
    if (!streamRef.current || recorderRef.current) return
    try {
      const recorder = createExerciseRecorder(streamRef.current, 2_000_000)
      const chunks: Blob[] = []
      let bytes = 0
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return
        chunks.push(event.data)
        bytes += event.data.size
        if (bytes >= MAX_RECORDING_BYTES && recorder.state === 'recording') {
          setError('Recording reached the 200 MB memory limit. Save this clip before recording another.')
          stop()
        }
      }
      recorder.onstop = () => {
        if (!mountedRef.current || recorderRef.current !== recorder) return
        recorderRef.current = null
        releaseCamera()
        if (!chunks.length) {
          setError('No video was captured. Reopen the camera and try again.')
          setStatus('idle')
          return
        }
        try {
          const type = recorder.mimeType || chunks[0]?.type || 'video/webm'
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const extension = type.includes('mp4') ? '.mp4' : '.webm'
          const file = new File(chunks, 'workout-' + timestamp + extension, { type })
          const url = URL.createObjectURL(file)
          videoUrlRef.current = url
          setVideo({ file, url })
          setStatus('recorded')
        } catch {
          setError('The video could not be prepared. Try a shorter recording to reduce memory usage.')
          setStatus('idle')
        }
      }
      recorder.onerror = () => {
        setError('Recording was interrupted. Save any video captured so far.')
        stop()
      }
      recorderRef.current = recorder
      recorder.start(1000)
      setStatus('recording')
    } catch {
      recorderRef.current = null
      releaseCamera()
      setError('Recording could not start on this device. Try another supported browser.')
      setStatus('idle')
    }
  }, [releaseCamera, stop])

  return { status, stream, video, error, openCamera, start, stop, discard }
}
