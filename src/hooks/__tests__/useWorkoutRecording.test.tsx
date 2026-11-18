import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useWorkoutRecording } from '../useWorkoutRecording'
import { WorkoutRecordingProvider } from '@/context/WorkoutRecordingContext'
import { PlayHeader } from '@/components/PlayHeader'

let pathname = '/workouts/test/play'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

class FakeRecorder {
  static isTypeSupported = vi.fn((type: string) => type === 'video/webm')
  static instances: FakeRecorder[] = []
  state = 'inactive'
  mimeType = 'video/webm'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() { FakeRecorder.instances.push(this) }
  start() { this.state = 'recording' }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['video'], { type: this.mimeType }) })
    this.onstop?.()
  }
}

let track: EventTarget & { stop: ReturnType<typeof vi.fn> }
let stream: MediaStream
let getUserMedia: ReturnType<typeof vi.fn>
let createObjectURL: ReturnType<typeof vi.fn>
let revokeObjectURL: ReturnType<typeof vi.fn>

beforeEach(() => {
  pathname = '/workouts/test/play'
  track = Object.assign(new EventTarget(), { stop: vi.fn() })
  stream = { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream
  getUserMedia = vi.fn().mockResolvedValue(stream)
  createObjectURL = vi.fn().mockReturnValue('blob:workout')
  revokeObjectURL = vi.fn()
  FakeRecorder.instances = []
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  vi.stubGlobal('isSecureContext', true)
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }))
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('workout recording', () => {
  it('records locally, releases camera, and retains the video until discarded', async () => {
    const { result } = renderHook(() => useWorkoutRecording())
    await act(async () => { await result.current.openCamera('environment', false) })
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({
      audio: false, video: expect.objectContaining({ facingMode: { ideal: 'environment' } }),
    }))
    act(() => { result.current.start() })
    expect(result.current.status).toBe('recording')
    act(() => { result.current.stop() })
    expect(result.current.status).toBe('recorded')
    expect(track.stop).toHaveBeenCalledOnce()
    expect(result.current.video?.file.name).toMatch(/workout-.*\.webm$/)
    expect(result.current.video?.file.size).toBeGreaterThan(0)
    act(() => { result.current.discard() })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:workout')
    expect(result.current.video).toBeNull()
  })

  it('releases a camera permission request that finishes after cancellation', async () => {
    let resolve!: (stream: MediaStream) => void
    getUserMedia.mockReturnValue(new Promise<MediaStream>((done) => { resolve = done }))
    const { result } = renderHook(() => useWorkoutRecording())
    let request!: Promise<void>
    act(() => { request = result.current.openCamera('user', false) })
    act(() => { result.current.discard() })
    await act(async () => { resolve(stream); await request })
    expect(track.stop).toHaveBeenCalledOnce()
    expect(result.current.status).toBe('idle')
    expect(result.current.stream).toBeNull()
  })

  it('shows a permission error and allows retrying', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    const { result } = renderHook(() => useWorkoutRecording())
    await act(async () => { await result.current.openCamera('user', true) })
    expect(result.current.error).toContain('denied')
    expect(result.current.status).toBe('idle')
    await act(async () => { await result.current.openCamera('user', false) })
    expect(result.current.status).toBe('ready')
    expect(result.current.error).toBe('')
  })

  it('finalizes the available clip when the camera is interrupted', async () => {
    const { result } = renderHook(() => useWorkoutRecording())
    await act(async () => { await result.current.openCamera('user', false) })
    act(() => { result.current.start() })
    act(() => { track.dispatchEvent(new Event('ended')) })
    expect(result.current.status).toBe('recorded')
    expect(result.current.error).toContain('interrupted')
    expect(result.current.video).not.toBeNull()
  })

  it('releases the camera and recording resources on unmount', async () => {
    const { result, unmount } = renderHook(() => useWorkoutRecording())
    await act(async () => { await result.current.openCamera('user', false) })
    act(() => { result.current.start() })
    unmount()
    expect(track.stop).toHaveBeenCalledOnce()
    expect(FakeRecorder.instances[0]?.state).toBe('inactive')
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('preserves the clip when the user switches to another app', async () => {
    const { result } = renderHook(() => useWorkoutRecording())
    await act(async () => { await result.current.openCamera('user', false) })
    act(() => { result.current.start() })
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(result.current.status).toBe('recorded')
    expect(result.current.video).not.toBeNull()
    expect(track.stop).toHaveBeenCalledOnce()
  })

  it('leaves a usable error if video allocation fails during finalization', async () => {
    createObjectURL.mockImplementation(() => { throw new Error('allocation failed') })
    const { result } = renderHook(() => useWorkoutRecording())
    await act(async () => { await result.current.openCamera('user', false) })
    act(() => { result.current.start(); result.current.stop() })
    expect(result.current.status).toBe('idle')
    expect(result.current.error).toContain('shorter recording')
    expect(track.stop).toHaveBeenCalledOnce()
  })

  it('keeps a downloadable clip when playback navigates to the session summary', async () => {
    function Playback() {
      return <WorkoutRecordingProvider><PlayHeader title="Workout" onClose={() => {}} active /></WorkoutRecordingProvider>
    }
    const { rerender } = render(<Playback />)
    fireEvent.click(screen.getByRole('button', { name: 'Record workout' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open camera' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start recording' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Start recording' }))
    pathname = '/history/session'
    rerender(<Playback />)
    await waitFor(() => expect(screen.getByRole('link', { name: 'Download video' })).toHaveAttribute('href', 'blob:workout'))
    expect(track.stop).toHaveBeenCalledOnce()
  })
})
