import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIntervalNotification } from '../useIntervalNotification'

// ponytail: minimal mock for Notification constructor + static props
function mockNotification(permission: string) {
  const instance = { close: vi.fn(), onclick: null as (() => void) | null }
  const ctor = vi.fn(function () { return instance }) as unknown as typeof Notification;
  (ctor as unknown as Record<string, unknown>).permission = permission;
  (ctor as unknown as Record<string, unknown>).requestPermission = vi.fn(() => Promise.resolve(permission))
  return { ctor, instance }
}

describe('useIntervalNotification', () => {
  let notificationInstance: { close: ReturnType<typeof vi.fn>; onclick: (() => void) | null }
  let notificationCtor: typeof Notification

  beforeEach(() => {
    const mock = mockNotification('granted')
    notificationCtor = mock.ctor
    notificationInstance = mock.instance as unknown as typeof notificationInstance
    vi.stubGlobal('Notification', notificationCtor)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  it('shows notification when document.hidden is true and permission granted', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 3, 10) })

    expect(notificationCtor).toHaveBeenCalledWith(
      'WorkOutApp - Test Workout',
      expect.objectContaining({ body: 'Interval 3 of 10' }),
    )
  })

  it('skips notification when document is visible', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 1, 5) })

    expect(notificationCtor).not.toHaveBeenCalled()
  })

  it('skips notification when permission denied', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    const { ctor } = mockNotification('denied')
    vi.stubGlobal('Notification', ctor)

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 2, 8) })

    expect(ctor).not.toHaveBeenCalled()
  })

  it('requests permission when status is default and tab is hidden', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    const { ctor } = mockNotification('default')
    vi.stubGlobal('Notification', ctor)

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 1, 3) })

    const req = (ctor as unknown as Record<string, unknown>).requestPermission as ReturnType<typeof vi.fn>
    expect(req).toHaveBeenCalled()
    expect(ctor).not.toHaveBeenCalled()
  })

  it('clicks notification focuses window and closes notification', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    const focusSpy = vi.fn()
    Object.defineProperty(window, 'focus', { value: focusSpy, writable: true })

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 3, 10) })

    act(() => { notificationInstance.onclick?.() })

    expect(focusSpy).toHaveBeenCalled()
    expect(notificationInstance.close).toHaveBeenCalled()
  })
})
