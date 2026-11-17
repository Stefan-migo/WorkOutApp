'use client'

import { useEffect, useRef, type ReactEventHandler } from 'react'
import { isExerciseVideo } from '@/lib/exercise-media'

interface Props {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  onError?: ReactEventHandler<HTMLImageElement | HTMLVideoElement>
  'data-testid'?: string
}

function ExerciseVideo({ src, alt, className, loading, onError, 'data-testid': testId }: Props) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const play = () => {
      if (!video.hasAttribute('src')) video.src = src
      void video.play().catch(() => {})
    }
    if (typeof IntersectionObserver === 'undefined') {
      play()
      return () => video.pause()
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        play()
      } else {
        video.pause()
      }
    })
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [src])

  return (
    <video
      ref={ref}
      src={loading === 'lazy' ? undefined : src}
      aria-label={alt || undefined}
      data-testid={testId}
      className={className}
      onError={onError}
      autoPlay={loading !== 'lazy'}
      loop
      muted
      playsInline
      preload={loading === 'lazy' ? 'none' : 'metadata'}
    />
  )
}

export function ExerciseMedia(props: Props) {
  if (isExerciseVideo(props.src)) return <ExerciseVideo key={props.src} {...props} />
  return <img {...props} decoding="async" />
}
