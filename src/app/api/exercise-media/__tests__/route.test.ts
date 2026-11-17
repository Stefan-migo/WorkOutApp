import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../route'

const { getUser, maybeSingle } = vi.hoisted(() => ({ getUser: vi.fn(), maybeSingle: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    const query = { select: () => query, eq: () => query, maybeSingle }
    return { auth: { getUser }, from: () => query }
  },
}))

const path = 'https://app.example.com/api/exercise-media'
const id = 'd477b988-377d-4cbc-a783-efccd0904ac6'

function metadata(type: string, size: number) {
  return new Request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, size }),
  })
}

beforeEach(() => {
  getUser.mockResolvedValue({ data: { user: { id: 'owner-id' } }, error: null })
  vi.stubEnv('R2_ACCOUNT_ID', 'account-id')
  vi.stubEnv('R2_BUCKET_NAME', 'private-assets')
  vi.stubEnv('R2_ACCESS_KEY_ID', 'test-key')
  vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret')
})

afterEach(() => vi.unstubAllEnvs())

describe('exercise media route', () => {
  it('requires a session for both reads and writes', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await GET(new Request(`${path}?id=${id}`))).status).toBe(401)
    expect((await POST(metadata('image/gif', 128))).status).toBe(401)
  })

  it('rejects unsupported formats, excessive size and invalid identifiers', async () => {
    expect((await POST(metadata('image/svg+xml', 128))).status).toBe(415)
    expect((await POST(metadata('image/gif', 11 * 1024 * 1024))).status).toBe(413)
    expect((await GET(new Request(`${path}?id=other-user%2F${id}`))).status).toBe(404)
  })

  it('signs a user-scoped upload with type and size and returns a stable asset URL', async () => {
    const response = await POST(metadata('image/gif', 128))
    expect(response.status).toBe(200)
    const { imageUrl, uploadUrl } = await response.json()
    const signed = new URL(uploadUrl)
    expect(signed.origin).toBe('https://account-id.r2.cloudflarestorage.com')
    expect(signed.pathname).toBe(`/private-assets/owner-id/${imageUrl.split('=')[1]}`)
    expect(imageUrl).toMatch(/^\/api\/exercise-media\?id=[a-f0-9-]{36}$/)
    expect(signed.searchParams.get('X-Amz-SignedHeaders')).toBe('cache-control;content-length;content-type;host')
    expect(signed.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/)
  })

  it('reads the image only under the signed-in user and disables response caching', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'different-user' } }, error: null })
    const response = await GET(new Request(`${path}?id=${id}`))
    expect(response.status).toBe(307)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    const signed = new URL(response.headers.get('location')!)
    expect(signed.pathname).toBe(`/private-assets/different-user/${id}`)
    expect(signed.searchParams.get('X-Amz-Expires')).toBe('60')
  })

  it('signs a community attachment under the owner only while it is listed on the published exercise', async () => {
    const exerciseId = '22940d39-12bb-4257-a895-317a67e20380'
    const request = () => new Request(`${path}?id=${id}&exerciseId=${exerciseId}`)
    maybeSingle.mockResolvedValueOnce({ data: { user_id: 'author-id', images: [`/api/exercise-media?id=${id}`] }, error: null })
    const response = await GET(request())
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe(`/private-assets/author-id/${id}`)

    maybeSingle.mockResolvedValueOnce({ data: { user_id: 'author-id', images: [] }, error: null })
    expect((await GET(request())).status).toBe(404)
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect((await GET(request())).status).toBe(404)
  })

  it('accepts a compressed demonstration and applies a separate 1 MB cap', async () => {
    expect((await POST(metadata('video/webm', 1024 * 1024 + 1))).status).toBe(413)
    const response = await POST(metadata('video/mp4', 780_000))
    expect(response.status).toBe(200)
    const { imageUrl, uploadUrl } = await response.json()
    expect(imageUrl).toMatch(/&kind=video$/)
    expect(new URL(uploadUrl).searchParams.get('X-Amz-SignedHeaders')).toContain('content-length;content-type')
  })

  it('checks the exact published video reference before signing as its owner', async () => {
    const exerciseId = '22940d39-12bb-4257-a895-317a67e20380'
    const published = { data: { user_id: 'author-id', images: [`/api/exercise-media?id=${id}&kind=video`] }, error: null }
    maybeSingle.mockResolvedValueOnce(published).mockResolvedValueOnce(published)
    const base = `${path}?id=${id}&exerciseId=${exerciseId}`
    expect((await GET(new Request(base))).status).toBe(404)
    const response = await GET(new Request(`${base}&kind=video`))
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe(`/private-assets/author-id/${id}`)
  })

  it('reports missing R2 configuration without issuing upload credentials', async () => {
    vi.stubEnv('R2_SECRET_ACCESS_KEY', '')
    expect((await POST(metadata('image/gif', 128))).status).toBe(503)
  })
})
