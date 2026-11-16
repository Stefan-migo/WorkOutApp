import { useEffect, useState } from 'react'
import type { Interval } from '@/types/workout'
import type { ImageEntry } from './useIndexedDB'

export function useIntervalImage(
  interval: Interval | undefined,
  exerciseImage: string | undefined,
  getImages: (owner: string) => Promise<ImageEntry[]>,
) {
  const url = interval?.imageUrl
  const reference = url?.startsWith('local-image:') ? url.slice('local-image:'.length).split('::') : undefined
  const legacy = url?.startsWith('blob:')
  const owner = reference?.[0] ?? (legacy ? interval?.id : undefined)
  const blobId = reference?.[1]
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
  return (owner || reference ? resolved?.local : url) || exerciseImage || resolved?.exercise
}
