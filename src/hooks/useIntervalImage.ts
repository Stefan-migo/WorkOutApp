import { useEffect, useState } from 'react'
import { getLocalIntervalImageReference } from '@/lib/exercise-media'
import type { Interval } from '@/types/workout'
import type { ImageEntry } from './useIndexedDB'

export function useIntervalImage(
  interval: Interval | undefined,
  exerciseImage: string | undefined,
  getImages: (owner: string) => Promise<ImageEntry[]>,
) {
  const url = interval?.imageUrl
  const reference = getLocalIntervalImageReference(interval)
  const { owner, blobId } = reference ?? {}
  const exerciseId = exerciseImage ? undefined : interval?.exerciseId
  const key = JSON.stringify([owner, blobId, exerciseId])
  const [loaded, setLoaded] = useState<{ key: string; local?: string; exercise?: string }>()

  useEffect(() => {
    if (!owner && !exerciseId) return
    let active = true
    const lookup = (id?: string) => id ? getImages(id).catch(() => []) : Promise.resolve([])
    Promise.all([lookup(owner), lookup(exerciseId)]).then(([local, exercise]) => {
      if (!active) return
      setLoaded({
        key,
        local: (blobId ? local.find((entry) => entry.blobId === blobId) : local.at(-1))?.blobUrl,
        exercise: exercise[0]?.blobUrl,
      })
    })
    return () => { active = false }
  }, [owner, blobId, exerciseId, key, getImages])

  const resolved = loaded?.key === key ? loaded : undefined
  return (reference ? resolved?.local : url) || exerciseImage || resolved?.exercise
}
