import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportAllData } from '../export-data'

describe('exportAllData', () => {
  let capturedBlob: Blob | null
  let capturedAnchor: HTMLAnchorElement | null
  let clickCount: number
  let revokeSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    capturedBlob = null
    capturedAnchor = null
    clickCount = 0
    revokeSpy = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => {
        capturedBlob = blob
        return 'blob:mock'
      }),
      revokeObjectURL: revokeSpy,
    })

    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName)
      if (tagName.toLowerCase() === 'a') {
        capturedAnchor = el as HTMLAnchorElement
        vi.spyOn(el, 'click').mockImplementation(() => { clickCount++ })
      }
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('exports all workoutapp.* keys into a JSON file', async () => {
    localStorage.setItem('workoutapp.workouts', JSON.stringify([{ id: 'w1', title: 'Full Body' }]))
    localStorage.setItem('workoutapp.sessions', JSON.stringify([{ id: 's1' }]))

    exportAllData()

    expect(clickCount).toBe(1)
    expect(capturedBlob).not.toBeNull()
    const text = await capturedBlob!.text()
    expect(JSON.parse(text)).toEqual({
      workouts: [{ id: 'w1', title: 'Full Body' }],
      sessions: [{ id: 's1' }],
    })
    expect(capturedBlob!.type).toBe('application/json')
  })

  it('handles empty localStorage gracefully', async () => {
    exportAllData()

    expect(clickCount).toBe(1)
    expect(capturedBlob).not.toBeNull()
    const text = await capturedBlob!.text()
    expect(JSON.parse(text)).toEqual({})
  })

  it('skips corrupt entries and exports valid keys', async () => {
    localStorage.setItem('workoutapp.workouts', JSON.stringify([{ id: 'w1' }]))
    localStorage.setItem('workoutapp.sessions', 'corrupt-json')
    localStorage.setItem('workoutapp.exercises', JSON.stringify([{ id: 'e1' }]))

    exportAllData()

    const text = await capturedBlob!.text()
    expect(JSON.parse(text)).toEqual({
      workouts: [{ id: 'w1' }],
      exercises: [{ id: 'e1' }],
    })
  })

  it('sets download filename with date', () => {
    localStorage.setItem('workoutapp.workouts', JSON.stringify([]))

    exportAllData()

    const today = new Date().toISOString().slice(0, 10)
    expect(capturedAnchor?.download).toBe(`workoutapp-export-${today}.json`)
  })
})
