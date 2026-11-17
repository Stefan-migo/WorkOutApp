import { useEffect, useRef, useState } from 'react'
import { trimExerciseRecording, type ClipRange } from '@/lib/exercise-recording'

export function useExerciseDemoDraft(open: boolean) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [range, setRange] = useState<ClipRange | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [preview, setPreview] = useState<string>()
  const uploaded = useRef<{ file: File; url: string } | null>(null)

  useEffect(() => {
    if (!open) {
      setCameraOpen(false)
      setFile(null)
      setRange(null)
      uploaded.current = null
    }
  }, [open])

  useEffect(() => {
    if (!file) {
      setPreview(undefined)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function capture(next: File, seconds: number) {
    uploaded.current = null
    setFile(next)
    setDuration(seconds)
    setRange(null)
    setCameraOpen(false)
  }

  function discard() {
    uploaded.current = null
    setFile(null)
    setRange(null)
  }

  async function getMedia(upload: (file: File) => Promise<string>) {
    if (!file) return undefined
    if (uploaded.current?.file === file) return uploaded.current.url
    if (range && !videoRef.current) throw new Error('Open the recorded preview before saving.')
    const media = range && videoRef.current ? await trimExerciseRecording(videoRef.current, range) : file
    const url = await upload(media)
    uploaded.current = { file, url }
    return url
  }

  function changeRange(next: ClipRange | null) {
    setRange(next)
    uploaded.current = null
  }

  return { cameraOpen, setCameraOpen, preview, file, capture, discard, getMedia, duration, range, changeRange, videoRef }
}
