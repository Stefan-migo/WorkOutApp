import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '../useFavorites'

const STORAGE_KEY = 'workoutapp.favorites'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useFavorites', () => {
  it('starts with empty favorites when localStorage is empty', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favoriteIds).toEqual([])
  })

  it('reads existing favorites from localStorage on init', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['ex-1', 'ex-2']))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favoriteIds).toEqual(['ex-1', 'ex-2'])
  })

  it('toggleFavorite adds an ID when not present', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.toggleFavorite('ex-1') })
    expect(result.current.favoriteIds).toEqual(['ex-1'])
  })

  it('toggleFavorite removes an ID when already present', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['ex-1', 'ex-2']))
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.toggleFavorite('ex-1') })
    expect(result.current.favoriteIds).toEqual(['ex-2'])
  })

  it('isFavorite returns true for favorited ID', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['ex-1']))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.isFavorite('ex-1')).toBe(true)
  })

  it('isFavorite returns false for unfavorited ID', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.isFavorite('ex-1')).toBe(false)
  })

  it('clearOrphans removes IDs not in validIds', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['ex-1', 'ex-2', 'ex-3']))
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.clearOrphans(['ex-1', 'ex-3']) })
    expect(result.current.favoriteIds).toEqual(['ex-1', 'ex-3'])
  })

  it('clearOrphans preserves all IDs when all are valid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['ex-1', 'ex-2']))
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.clearOrphans(['ex-1', 'ex-2', 'ex-3']) })
    expect(result.current.favoriteIds).toEqual(['ex-1', 'ex-2'])
  })

  it('persists to localStorage on toggle', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.toggleFavorite('ex-1') })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(['ex-1'])
  })

  it('persists to localStorage on clearOrphans', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['ex-1', 'ex-2', 'ex-3']))
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.clearOrphans(['ex-1']) })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(['ex-1'])
  })

  it('handles toggling same ID twice (add then remove)', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.toggleFavorite('ex-1') })
    expect(result.current.favoriteIds).toEqual(['ex-1'])
    act(() => { result.current.toggleFavorite('ex-1') })
    expect(result.current.favoriteIds).toEqual([])
  })

  it('handles multiple independent favorites', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => { result.current.toggleFavorite('ex-1') })
    act(() => { result.current.toggleFavorite('ex-2') })
    act(() => { result.current.toggleFavorite('ex-3') })
    expect(result.current.favoriteIds).toEqual(['ex-1', 'ex-2', 'ex-3'])
  })
})
