import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIntervalNotification } from '../useIntervalNotification'

describe('useIntervalNotification', () => {
  let notificationCtor: ReturnType<typeof vi.fn>
  let notificationInstance: { close: ReturnType<typeof vi.fn>; onclick: (() => void) | null }

  beforeEach(() => {
    notificationInstance = { close: vi.fn(), onclick: null }
    notificationCtor = vi.fn(function () { return notificationInstance }) as unknown as ReturnType<typeof vi.fn> & { permission: string; requestPermission: ReturnType<typeof vi.fn> }
    notificationCtor.permission = 'granted'
    notificationCtor.requestPermission = vi.fn(() => Promise.resolve('granted'))

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
    const DeniedCtor = vi.fn(function () { return notificationInstance }) as unknown as typeof notificationCtor
    DeniedCtor.permission = 'denied'
    DeniedCtor.requestPermission = vi.fn(() => Promise.resolve('denied'))
    vi.stubGlobal('Notification', DeniedCtor)

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 2, 8) })

    expect(DeniedCtor).not.toHaveBeenCalled()
  })

  it('requests permission when status is default and tab is hidden', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    const DefaultCtor = vi.fn(function () { return notificationInstance }) as unknown as typeof notificationCtor
    DefaultCtor.permission = 'default'
    DefaultCtor.requestPermission = vi.fn(() => Promise.resolve('granted'))
    vi.stubGlobal('Notification', DefaultCtor)

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 1, 3) })

    expect(DefaultCtor.requestPermission).toHaveBeenCalled()
    expect(DefaultCtor).not.toHaveBeenCalled()
  })

  it('clicks notification focuses window and closes notification', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    const focusSpy = vi.fn()
    Object.defineProperty(window, 'focus', { value: focusSpy, writable: true })

    const { result } = renderHook(() => useIntervalNotification())
    act(() => { result.current.notify('Test Workout', 3, 10) })

    // Trigger the onclick handler
    act(() => {
      notificationInstance.onclick?.()
    })

    expect(focusSpy).toHaveBeenCalled()
    expect(notificationInstance.close).toHaveBeenCalled()
  })
})
