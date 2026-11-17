import type { Interval } from '@/types/workout'

export const EXERCISE_MEDIA_PATH = '/api/exercise-media'
export const PRIVATE_MEDIA_CACHE_CONTROL = 'private, no-store'
export const MAX_EXERCISE_CLIP_BYTES = 1024 * 1024
export const EXERCISE_CLIP_SECONDS = 10
export const EXERCISE_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])

export function exerciseMediaUrl(id: string, video = false) {
  return `${EXERCISE_MEDIA_PATH}?id=${id}${video ? '&kind=video' : ''}`
}

export function isExerciseVideo(url: string) {
  return isCloudExerciseMedia(url) && new URLSearchParams(url.split('?')[1]).get('kind') === 'video'
}

export const MAX_EXERCISE_IMAGE_BYTES = 10 * 1024 * 1024

export const EXERCISE_IMAGE_TYPES = new Set([
  'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp',
])

export function isCloudExerciseMedia(url: string) {
  return url.startsWith(`${EXERCISE_MEDIA_PATH}?id=`)
}

export function getLocalIntervalImageReference(interval?: Interval) {
  const url = interval?.imageUrl
  if (url?.startsWith('local-image:')) {
    const [owner, blobId] = url.slice('local-image:'.length).split('::')
    return { owner, blobId }
  }
  if (url?.startsWith('blob:')) return { owner: interval?.id, blobId: undefined }
}

export function withExerciseMediaAccess(url: string, exerciseId: string) {
  return isCloudExerciseMedia(url)
    ? `${url}&exerciseId=${encodeURIComponent(exerciseId)}`
    : url
}

export async function uploadExerciseMedia(file: File): Promise<string> {
  const type = file.type.split(';')[0] ?? file.type
  const ticket = await fetch(EXERCISE_MEDIA_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, size: file.size }),
  })
  const result = await ticket.json().catch(() => null)
  if (!ticket.ok || !result?.uploadUrl || !result?.imageUrl) {
    throw new Error(result?.error ?? 'Could not start the image upload.')
  }

  const upload = await fetch(result.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': type, 'Cache-Control': PRIVATE_MEDIA_CACHE_CONTROL },
    body: file,
  })
  if (!upload.ok) throw new Error('Could not upload the image to storage.')
  return result.imageUrl
}
