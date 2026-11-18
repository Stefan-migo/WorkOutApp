'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useWorkoutRecording } from '@/hooks/useWorkoutRecording'
import { WorkoutRecordingPanel } from '@/components/WorkoutRecordingPanel'

const WorkoutRecordingContext = createContext<(() => void) | null>(null)

export function useOpenWorkoutRecording() {
  return useContext(WorkoutRecordingContext)
}

export function WorkoutRecordingProvider({ children }: { children: ReactNode }) {
  const recording = useWorkoutRecording()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const previousPath = useRef(pathname)

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    recording.stop()
  }, [pathname, recording.stop])

  return (
    <WorkoutRecordingContext.Provider value={() => setOpen(true)}>
      {children}
      {open && <WorkoutRecordingPanel recording={recording} onClose={() => {
        const hasVideo = recording.status === 'recording' || recording.status === 'stopping' || recording.video
        if (hasVideo && !window.confirm('Discard this video? Download or save it first to keep a copy.')) return
        recording.discard()
        setOpen(false)
      }} />}
    </WorkoutRecordingContext.Provider>
  )
}
