import 'fake-indexeddb/auto'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIndexedDB } from '../useIndexedDB'

function createMockFile(sizeInBytes: number, name = 'test.jpg', type = 'image/jpeg'): File {
  const blob = new Blob(['x'.repeat(sizeInBytes)], { type })
  return new File([blob], name, { type })
}

afterEach(() => {
  vi.restoreAllMocks()
})

vi.setConfig({ testTimeout: 30000, hookTimeout: 20000 })

describe('useIndexedDB', () => {
  let testId = 0
  function nextId(): string {
    testId++
    return `ex-${Date.now()}-${testId}`
  }

  it('saves an image and retrieves it as a blob URL', async () => {
    const exId = nextId()
    const { result } = renderHook(() => useIndexedDB())
    const file = createMockFile(1024)

    const blobUrl = await result.current.saveImage(exId, file)
    expect(blobUrl).toMatch(/^blob:/)

    const images = await result.current.getImages(exId)
    expect(images).toHaveLength(1)
    expect(images[0]!.blobUrl).toMatch(/^blob:/)
  })

  it('retrieves images only for the requested exercise', async () => {
    const ex1 = nextId()
    const ex2 = nextId()
    const ex3 = nextId()
    const { result } = renderHook(() => useIndexedDB())

    await result.current.saveImage(ex1, createMockFile(512, 'img1.jpg'))
    await result.current.saveImage(ex1, createMockFile(768, 'img2.jpg'))
    await result.current.saveImage(ex2, createMockFile(256, 'other.jpg'))

    const ex1Images = await result.current.getImages(ex1)
    expect(ex1Images).toHaveLength(2)

    const ex2Images = await result.current.getImages(ex2)
    expect(ex2Images).toHaveLength(1)

    const ex3Images = await result.current.getImages(ex3)
    expect(ex3Images).toHaveLength(0)
  })

  it('enforces 10MB cap per exercise', async () => {
    const exId = nextId()
    const { result } = renderHook(() => useIndexedDB())

    await result.current.saveImage(exId, createMockFile(2_000_000, 'small.jpg'))
    await result.current.saveImage(exId, createMockFile(2_000_000, 'another.jpg'))

    const bigFile = createMockFile(8_000_000, 'big.jpg')
    await expect(result.current.saveImage(exId, bigFile)).rejects.toThrow(
      /10MB|cap|too large/i,
    )
  })

  it('allows saving just under 10MB total per exercise', async () => {
    const exId = nextId()
    const { result } = renderHook(() => useIndexedDB())

    await result.current.saveImage(exId, createMockFile(4_000_000))
    await result.current.saveImage(exId, createMockFile(5_900_000))

    const images = await result.current.getImages(exId)
    expect(images).toHaveLength(2)
  })

  it('enforces 10MB cap independently per exercise', async () => {
    const ex1 = nextId()
    const ex2 = nextId()
    const { result } = renderHook(() => useIndexedDB())

    await result.current.saveImage(ex1, createMockFile(9_500_000))
    await result.current.saveImage(ex2, createMockFile(9_500_000))

    await expect(
      result.current.saveImage(ex1, createMockFile(1_000_000)),
    ).rejects.toThrow(/10MB|cap|too large/i)

    const ex2Images = await result.current.getImages(ex2)
    expect(ex2Images).toHaveLength(1)
  })

  it('deletes an image by blobId and count decreases', async () => {
    const exId = nextId()
    const { result } = renderHook(() => useIndexedDB())

    await result.current.saveImage(exId, createMockFile(512, 'img1.jpg'))
    await result.current.saveImage(exId, createMockFile(768, 'img2.jpg'))

    const images = await result.current.getImages(exId)
    expect(images).toHaveLength(2)

    const deletedId = images[0]!.blobId
    const remainingId = images[1]!.blobId
    await result.current.deleteImage(exId, deletedId)

    const remaining = await result.current.getImages(exId)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.blobId).toBe(remainingId)
  })

  it('revokes blob URLs on unmount', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const { result, unmount } = renderHook(() => useIndexedDB())

    await result.current.saveImage('revoke-test', createMockFile(512))
    await result.current.getImages('revoke-test')

    revokeSpy.mockClear()
    unmount()

    expect(revokeSpy).toHaveBeenCalled()
  })

  it('getUsage returns total bytes across all exercises', async () => {
    const { result } = renderHook(() => useIndexedDB())

    await result.current.saveImage('usage-1', createMockFile(1000))
    await result.current.saveImage('usage-2', createMockFile(2000))

    const usage = await result.current.getUsage()
    expect(usage).toBeGreaterThanOrEqual(3000)
  })

  it('getImages returns empty for unknown exercise', async () => {
    const { result } = renderHook(() => useIndexedDB())
    const images = await result.current.getImages('nonexistent')
    expect(images).toEqual([])
  })
})
