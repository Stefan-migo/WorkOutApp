'use client'

import { useEffect, useRef, useState } from 'react'
import type { useWorkoutRecording } from '@/hooks/useWorkoutRecording'
import { Button } from '@/components/ui/Button'

type Recording = ReturnType<typeof useWorkoutRecording>

export function WorkoutRecordingPanel({ recording, onClose }: { recording: Recording; onClose: () => void }) {
  const { status, stream, video, error } = recording
  const preview = useRef<HTMLVideoElement>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [microphone, setMicrophone] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [sharing, setSharing] = useState(false)
  const configure = status === 'idle'

  useEffect(() => {
    const element = preview.current
    if (!element || !stream) return
    element.srcObject = stream
    void element.play().catch(() => undefined)
    return () => { element.srcObject = null }
  }, [stream, collapsed])

  useEffect(() => {
    if (status === 'recorded') setCollapsed(false)
  }, [status])

  async function share() {
    if (!video || sharing) return
    setSaveError('')
    setSharing(true)
    try {
      await navigator.share({ files: [video.file], title: 'Workout recording' })
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        setSaveError('Could not open the save menu. Use Download video instead.')
      }
    } finally {
      setSharing(false)
    }
  }

  const canShare = video && typeof navigator.canShare === 'function' && navigator.canShare({ files: [video.file] })

  return (
    <aside aria-label="Workout recording" className="training-theme fixed bottom-3 right-3 z-50 w-[calc(100%-1.5rem)] max-w-sm rounded-lg border border-border-soft bg-surface p-3 text-fg-2 shadow-lg">
      <div className="flex items-center gap-2">
        <p role="status" className="flex-1 text-sm font-semibold">
          {status === 'recording' ? '● Recording workout' : status === 'stopping' ? 'Preparing video…' : 'Workout camera'}
        </p>
        <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)} className="min-h-11 px-2 text-sm focus-visible:focus-ring">
          {collapsed ? 'Expand' : 'Minimize'}
        </button>
        <button type="button" aria-label="Close workout camera" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full focus-visible:focus-ring">
          <span aria-hidden="true" className="material-symbols-outlined">close</span>
        </button>
      </div>
      {!collapsed && (
        <div className="grid max-h-[60dvh] gap-3 overflow-y-auto">
          <p className="text-sm text-muted">Save your video to your device before closing this page. Recording stops when you leave the app or reach 200 MB.</p>
          {configure && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex flex-1 flex-col gap-1 text-sm">
                Camera
                <select value={facing} onChange={(event) => setFacing(event.target.value as typeof facing)} className="min-h-11 rounded-lg border border-border-soft bg-surface px-2">
                  <option value="user">Front camera</option>
                  <option value="environment">Rear camera</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={microphone} onChange={(event) => setMicrophone(event.target.checked)} />
                Microphone
              </label>
            </div>
          )}
          {stream && <video ref={preview} aria-label="Live workout camera" autoPlay muted playsInline className="max-h-[28dvh] w-full rounded-lg bg-timer-bg object-contain" />}
          {video && <video src={video.url} aria-label="Recorded workout preview" controls playsInline className="max-h-[28dvh] w-full rounded-lg bg-timer-bg" />}
          {error && <p role="alert" className="text-sm">{error}</p>}
          {saveError && <p role="alert" className="text-sm">{saveError}</p>}
          {configure && <Button onClick={() => void recording.openCamera(facing, microphone)}>Open camera</Button>}
          {status === 'opening' && <p role="status" className="text-sm">Waiting for camera access…</p>}
          {status === 'ready' && <Button onClick={recording.start}>Start recording</Button>}
          {status === 'recorded' && video && (
            <div className="flex flex-wrap items-center gap-2">
              <a href={video.url} download={video.file.name} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-on focus-visible:focus-ring">
                Download video
              </a>
              {canShare && <Button variant="outline" disabled={sharing} onClick={() => void share()}>Save or share</Button>}
              <Button variant="ghost" onClick={() => {
                if (window.confirm('Discard this video and record another? Save a copy first.')) recording.discard()
              }}>Record another</Button>
            </div>
          )}
        </div>
      )}
      {status === 'recording' && <Button className="mt-2 w-full" variant="danger" onClick={recording.stop}>Stop recording</Button>}
    </aside>
  )
}
