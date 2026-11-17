import { useEffect, useRef, useState } from 'react'

export function useExerciseDemoDraft(open: boolean) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>()
  const uploaded = useRef<{ file: File; url: string } | null>(null)

  useEffect(() => {
    if (!open) {
      setCameraOpen(false)
      setFile(null)
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

  function capture(next: File) {
    uploaded.current = null
    setFile(next)
    setCameraOpen(false)
  }

  function discard() {
    uploaded.current = null
    setFile(null)
  }

  async function getMedia(upload: (file: File) => Promise<string>) {
    if (!file) return undefined
    if (uploaded.current?.file === file) return uploaded.current.url
    const url = await upload(file)
    uploaded.current = { file, url }
    return url
  }

  return { cameraOpen, setCameraOpen, preview, file, capture, discard, getMedia }
}
