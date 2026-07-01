import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

const STORAGE_KEY = 'test.key'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useLocalStorage', () => {
  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('reads existing value from localStorage on init', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 'default'))
    expect(result.current[0]).toBe('stored')
  })

  it('persists value to localStorage on write', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, ''))
    act(() => { result.current[1]('hello') })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('"hello"')
  })

  it('updates state with setter function (prev => next)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(0))
    const { result } = renderHook(() => useLocalStorage<number>(STORAGE_KEY, 0))
    act(() => { result.current[1]((prev) => prev + 1) })
    expect(result.current[0]).toBe(1)
  })

  it('logs warning on quota error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Simulate quota error by making setItem throw
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, ''))
    act(() => { result.current[1]('data') })
    expect(warnSpy).toHaveBeenCalledWith('Storage quota exceeded for key:', STORAGE_KEY)
  })

  it('falls back gracefully on corrupted localStorage data', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json}')
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })
})
