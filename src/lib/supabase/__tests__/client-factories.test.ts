import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must mock before any imports that use @supabase/ssr
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

vi.mock('@supabase/ssr', () => {
  const mockFrom = vi.fn()
  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/img.png' } })),
    })),
  }

  const mockClient = {
    from: mockFrom,
    storage: mockStorage,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }

  return {
    createBrowserClient: vi.fn(() => ({ ...mockClient })),
    createServerClient: vi.fn(() => ({ ...mockClient })),
  }
})

describe('createBrowserClient', () => {
  it('creates a client with browser factory', async () => {
    const { createClient } = await import('../client')
    const client = createClient()

    expect(client).toBeDefined()
    expect(client.from).toBeDefined()
    expect(client.storage).toBeDefined()
  })

  it('uses environment variables for URL and anon key', async () => {
    const { createBrowserClient } = await import('@supabase/ssr')
    const { createClient } = await import('../client')
    createClient()

    expect(createBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
  })
})

describe('createServerClient', () => {
  it('creates a server client via server factory', async () => {
    const { createClient } = await import('../server')

    const client = await createClient()
    expect(client).toBeDefined()
    expect(client.from).toBeDefined()
  })
})

describe('updateSession (middleware)', () => {
  it('returns a NextResponse with auth headers', async () => {
    const { updateSession } = await import('../middleware')
    const { createServerClient } = await import('@supabase/ssr')

    const mockRequest = {
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
      url: 'http://localhost:3000/workouts',
    }

    const result = await updateSession(mockRequest as any)

    expect(result).toBeDefined()
    expect(result.response).toBeDefined()
    expect(result.response.headers).toBeDefined()
    expect(createServerClient).toHaveBeenCalled()
  })
})

describe('storage client', () => {
  beforeEach(async () => {
    // Re-mock before each test
    vi.mocked((await import('@supabase/ssr')).createBrowserClient).mockClear()
  })

  it('uploadImage uploads file and returns public URL', async () => {
    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://example.com/ex-1/abc.png' } }))

    vi.mocked((await import('@supabase/ssr')).createBrowserClient).mockReturnValue({
      from: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
          remove: vi.fn(),
          list: vi.fn(),
        })),
      },
      auth: { getUser: vi.fn() },
    } as any)

    // Clear module cache to get fresh imports
    const { uploadImage } = await import('../storage')

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const url = await uploadImage('ex-1', file)

    expect(url).toBe('https://example.com/ex-1/abc.png')
    expect(mockUpload).toHaveBeenCalled()
  })

  it('deleteImage calls remove on storage', async () => {
    const mockRemove = vi.fn().mockResolvedValue({ error: null })

    vi.mocked((await import('@supabase/ssr')).createBrowserClient).mockReturnValue({
      from: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          remove: mockRemove,
          upload: vi.fn(),
          getPublicUrl: vi.fn(),
          list: vi.fn(),
        })),
      },
      auth: { getUser: vi.fn() },
    } as any)

    const { deleteImage } = await import('../storage')
    await deleteImage('ex-1/img.png')

    expect(mockRemove).toHaveBeenCalledWith(['ex-1/img.png'])
  })

  it('listImages returns URLs for listed files', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [{ name: 'a.png' }, { name: 'b.png' }], error: null })
    const mockGetPublicUrl = vi.fn()
      .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/ex-1/a.png' } })
      .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/ex-1/b.png' } })

    vi.mocked((await import('@supabase/ssr')).createBrowserClient).mockReturnValue({
      from: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          list: mockList,
          getPublicUrl: mockGetPublicUrl,
          upload: vi.fn(),
          remove: vi.fn(),
        })),
      },
      auth: { getUser: vi.fn() },
    } as any)

    const { listImages } = await import('../storage')
    const urls = await listImages('ex-1')

    expect(urls).toHaveLength(2)
    expect(urls[0]).toBe('https://example.com/ex-1/a.png')
    expect(urls[1]).toBe('https://example.com/ex-1/b.png')
  })

  it('listImages returns empty array on error', async () => {
    vi.mocked((await import('@supabase/ssr')).createBrowserClient).mockReturnValue({
      from: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          list: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
          getPublicUrl: vi.fn(),
          upload: vi.fn(),
          remove: vi.fn(),
        })),
      },
      auth: { getUser: vi.fn() },
    } as any)

    const { listImages } = await import('../storage')
    const urls = await listImages('ex-1')
    expect(urls).toEqual([])
  })
})
