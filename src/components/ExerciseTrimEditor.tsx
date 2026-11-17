'use client'

import { useState, type RefObject } from 'react'
import type { ClipRange } from '@/lib/exercise-recording'
import { Button } from './ui/Button'

export function ExerciseTrimEditor({ preview, duration, range, onChange, videoRef, disabled }: {
  preview: string
  duration: number
  range: ClipRange | null
  onChange: (range: ClipRange | null) => void
  videoRef: RefObject<HTMLVideoElement | null>
  disabled: boolean
}) {
  const [actualDuration, setActualDuration] = useState(duration)
  const [playing, setPlaying] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const endOfClip = Math.max(0.1, Math.floor(actualDuration * 10) / 10)
  const start = range?.start ?? 0
  const end = range?.end ?? endOfClip

  function select(next: ClipRange, position: number) {
    const video = videoRef.current
    if (video) {
      video.pause()
      video.currentTime = position
    }
    onChange(next.start === 0 && next.end === endOfClip ? null : next)
  }

  function playSelection() {
    const video = videoRef.current
    if (!video) return
    setPreviewError('')
    if (!video.paused) {
      video.pause()
      return
    }
    video.currentTime = start
    void video.play().catch(() => setPreviewError('Could not play this take. Try recording again.'))
  }

  return (
    <div className="flex flex-col gap-2 rounded-control border border-border-soft p-3">
      <video
        ref={videoRef}
        src={preview}
        aria-label="Recorded demonstration"
        className="max-h-56 w-full rounded-control bg-surface-warm object-contain"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => {
          const seconds = event.currentTarget.duration
          if (Number.isFinite(seconds) && seconds > 0) setActualDuration(seconds)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          if (!disabled && playing && video.currentTime >= end) video.pause()
        }}
      />
      <label className="flex flex-col gap-1 text-sm">
        <span>Start <output className="font-mono">{start.toFixed(1)} s</output></span>
        <input type="range" className="w-full accent-accent" min={0} max={endOfClip} step={0.1} value={start} disabled={disabled} onChange={(event) => {
          const value = Math.min(Number(event.target.value), Math.max(0, end - 0.2))
          const next = Math.round(value * 10) / 10
          select({ start: next, end }, next)
        }} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>End <output className="font-mono">{end.toFixed(1)} s</output></span>
        <input type="range" className="w-full accent-accent" min={0.1} max={endOfClip} step={0.1} value={end} disabled={disabled} onChange={(event) => {
          const value = Math.min(endOfClip, Math.max(start + 0.2, Number(event.target.value)))
          const next = Math.round(value * 10) / 10
          select({ start, end: next }, Math.max(start, next - 0.1))
        }} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={playSelection}>{playing && !disabled ? 'Pause preview' : 'Play selection'}</Button>
        {range && <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => select({ start: 0, end: endOfClip }, 0)}>Reset trim</Button>}
        <span className="text-xs tabular-nums text-muted">{(end - start).toFixed(1)} s selected</span>
      </div>
      {previewError && <p role="alert" className="text-sm text-danger">{previewError}</p>}
    </div>
  )
}
