import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://example.com/img.png' } }))
const mockRemove = vi.fn()
const mockList = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
        list: mockList,
      })),
    },
  })),
}))

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpload.mockResolvedValue({ error: null })
  })

  it('rejects non-image file types', async () => {
    const { uploadImage } = await import('../storage')
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })

    await expect(uploadImage('ex-1', file)).rejects.toThrow('Invalid file type')
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('rejects files over 10MB', async () => {
    const { uploadImage } = await import('../storage')
    const oversized = new File(['x'.repeat(11 * 1024 * 1024)], 'big.png', { type: 'image/png' })

    await expect(uploadImage('ex-1', oversized)).rejects.toThrow('File too large')
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('accepts valid image files and uploads', async () => {
    const { uploadImage } = await import('../storage')
    const file = new File(['data'], 'photo.png', { type: 'image/png' })

    const url = await uploadImage('ex-1', file)

    expect(mockUpload).toHaveBeenCalledTimes(1)
    expect(url).toBe('https://example.com/img.png')
  })

  it('accepts all allowed image mime types', async () => {
    const { uploadImage } = await import('../storage')
    const types = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

    for (const mime of types) {
      const ext = mime.split('/')[1]
      const file = new File(['data'], `img.${ext}`, { type: mime })
      await expect(uploadImage('ex-1', file)).resolves.toBeDefined()
    }

    expect(mockUpload).toHaveBeenCalledTimes(4)
  })
})

describe('deleteImage', () => {
  it('calls remove with the given path', async () => {
    mockRemove.mockResolvedValue({ error: null })
    const { deleteImage } = await import('../storage')

    await deleteImage('ex-1/img.png')

    expect(mockRemove).toHaveBeenCalledWith(['ex-1/img.png'])
  })
})

describe('listImages', () => {
  it('returns public URLs for listed files', async () => {
    mockList.mockResolvedValue({ data: [{ name: 'a.png' }, { name: 'b.png' }], error: null })
    const { listImages } = await import('../storage')

    const urls = await listImages('ex-1')

    expect(urls).toHaveLength(2)
    expect(urls[0]).toBe('https://example.com/img.png')
  })

  it('returns empty array on error', async () => {
    mockList.mockResolvedValue({ data: null, error: new Error('permission denied') })
    const { listImages } = await import('../storage')

    const urls = await listImages('ex-1')

    expect(urls).toEqual([])
  })
})
