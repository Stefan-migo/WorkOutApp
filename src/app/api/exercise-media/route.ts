import { EXERCISE_IMAGE_TYPES, EXERCISE_MEDIA_PATH, MAX_EXERCISE_IMAGE_BYTES, PRIVATE_MEDIA_CACHE_CONTROL } from '@/lib/exercise-media'
import { getR2Bucket } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'

const NO_STORE = { 'Cache-Control': PRIVATE_MEDIA_CACHE_CONTROL }
const IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return error ? null : data.user
}

function fail(error: string, status: number) {
  return Response.json({ error }, { status, headers: NO_STORE })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return fail('Sign in to upload an image.', 401)

  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return fail('Expected JSON upload metadata.', 415)
  }
  const payload = await request.json().catch(() => null)
  const type = payload?.type
  const size = payload?.size
  if (typeof type !== 'string' || !EXERCISE_IMAGE_TYPES.has(type)) {
    return fail('Choose a GIF, JPEG, PNG, WebP or AVIF image.', 415)
  }
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_EXERCISE_IMAGE_BYTES) {
    return fail('Choose an image up to 10 MB.', 413)
  }

  const bucket = getR2Bucket()
  if (!bucket) return fail('Cloud image storage is unavailable.', 503)

  const id = crypto.randomUUID()
  const uploadUrl = await bucket.sign(`${user.id}/${id}`, 'PUT', {
    ...NO_STORE,
    'Content-Type': type,
    'Content-Length': String(size),
  })
  return Response.json({ uploadUrl, imageUrl: `${EXERCISE_MEDIA_PATH}?id=${id}` }, { headers: NO_STORE })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: auth, error } = await supabase.auth.getUser()
  const user = auth.user
  if (error || !user) return fail('Sign in to view this image.', 401)

  const params = new URL(request.url).searchParams
  const id = params.get('id')
  if (!id || !IMAGE_ID.test(id)) return fail('Image not found.', 404)

  const bucket = getR2Bucket()
  if (!bucket) return fail('Cloud image storage is unavailable.', 503)

  let ownerId = user.id
  const exerciseId = params.get('exerciseId')
  if (exerciseId) {
    if (!IMAGE_ID.test(exerciseId)) return fail('Image not found.', 404)
    const { data: exercise, error: lookupError } = await supabase.from('exercises')
      .select('user_id, images').eq('id', exerciseId).eq('visibility', 'community').maybeSingle()
    if (lookupError || !exercise?.user_id || !exercise.images?.includes(`${EXERCISE_MEDIA_PATH}?id=${id}`)) {
      return fail('Image not found.', 404)
    }
    ownerId = exercise.user_id
  }

  const url = await bucket.sign(`${ownerId}/${id}`, 'GET')
  return new Response(null, { status: 307, headers: { ...NO_STORE, Location: url } })
}
