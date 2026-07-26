import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Hoisted mocks ──────────────────────────────────────────────────

const { mockFrom, mockUseAuth } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

import { useFavorites } from '../useFavorites'

// ── Helpers ────────────────────────────────────────────────────────

function mockQueryBuilder(resolvesTo: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    upsert: vi.fn(),
    then<TR = typeof resolvesTo>(
      resolve: (value: TR) => TR | PromiseLike<TR>,
    ): Promise<TR> {
      return Promise.resolve(resolvesTo as unknown as TR).then(resolve)
    },
    catch: vi.fn(),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.single.mockReturnValue(builder)
  builder.upsert.mockReturnValue(builder)
  return builder
}

const mockUser = { id: 'user-1', email: 'test@test.com' }

const mockFavoriteRows = [
  { id: 'fav-1', user_id: 'user-1', exercise_id: 'ex-1' },
  { id: 'fav-2', user_id: 'user-1', exercise_id: 'ex-2' },
]

// ── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: mockUser })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────

describe('useFavorites', () => {
  it('loads favorites on mount (happy path)', async () => {
    const qb = mockQueryBuilder({ data: mockFavoriteRows, error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.favoriteIds).toEqual(['ex-1', 'ex-2'])
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('favorites')
    expect(qb.select).toHaveBeenCalledWith('exercise_id')
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('starts with empty favorites when no rows exist', async () => {
    const qb = mockQueryBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.favoriteIds).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces supabase error', async () => {
    const qb = mockQueryBuilder({ data: null, error: new Error('DB down') })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.favoriteIds).toEqual([])
    expect(result.current.error).toBe('DB down')
  })

  it('returns empty when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.favoriteIds).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('isFavorite returns true for favorited ID (sync)', async () => {
    const qb = mockQueryBuilder({ data: mockFavoriteRows, error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isFavorite('ex-1')).toBe(true)
    expect(result.current.isFavorite('ex-2')).toBe(true)
  })

  it('isFavorite returns false for unfavorited ID (sync)', async () => {
    const qb = mockQueryBuilder({ data: mockFavoriteRows, error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isFavorite('nonexistent')).toBe(false)
  })

  it('toggleFavorite adds an ID when not present', async () => {
    const loadQb = mockQueryBuilder({ data: mockFavoriteRows, error: null })
    const insertQb = mockQueryBuilder({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)    // initial fetch
      .mockReturnValueOnce(insertQb)  // insert

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.toggleFavorite('ex-3')

    await waitFor(() => expect(result.current.favoriteIds).toEqual(['ex-1', 'ex-2', 'ex-3']))
    expect(insertQb.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      exercise_id: 'ex-3',
    })
  })

  it('toggleFavorite removes an ID when already present', async () => {
    const loadQb = mockQueryBuilder({ data: mockFavoriteRows, error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(deleteQb)  // delete

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.toggleFavorite('ex-1')

    await waitFor(() => expect(result.current.favoriteIds).toEqual(['ex-2']))
    expect(deleteQb.delete).toHaveBeenCalledWith()
    expect(deleteQb.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(deleteQb.eq).toHaveBeenCalledWith('exercise_id', 'ex-1')
  })

  it('addFavorite inserts and adds to local state', async () => {
    const loadQb = mockQueryBuilder({ data: mockFavoriteRows, error: null })
    const insertQb = mockQueryBuilder({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(insertQb)  // insert

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.addFavorite('ex-3')

    await waitFor(() => expect(result.current.favoriteIds).toEqual(['ex-1', 'ex-2', 'ex-3']))
    expect(insertQb.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', exercise_id: 'ex-3' },
      { onConflict: 'user_id, exercise_id', ignoreDuplicates: true },
    )
  })

  it('removeFavorite deletes and removes from local state', async () => {
    const loadQb = mockQueryBuilder({ data: mockFavoriteRows, error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(deleteQb)  // delete

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.removeFavorite('ex-1')

    await waitFor(() => expect(result.current.favoriteIds).toEqual(['ex-2']))
    expect(deleteQb.delete).toHaveBeenCalledWith()
    expect(deleteQb.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(deleteQb.eq).toHaveBeenCalledWith('exercise_id', 'ex-1')
  })

  it('handles toggling same ID twice (add then remove)', async () => {
    const loadQb = mockQueryBuilder({ data: [], error: null })
    const insertQb = mockQueryBuilder({ data: null, error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)    // initial fetch
      .mockReturnValueOnce(insertQb)  // insert
      .mockReturnValueOnce(deleteQb)  // delete

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.toggleFavorite('ex-1')
    await waitFor(() => expect(result.current.favoriteIds).toEqual(['ex-1']))

    await result.current.toggleFavorite('ex-1')
    await waitFor(() => expect(result.current.favoriteIds).toEqual([]))
  })

  it('sets error when toggle fails', async () => {
    const loadQb = mockQueryBuilder({ data: [], error: null })
    const insertQb = mockQueryBuilder({ data: null, error: new Error('Insert failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)
      .mockReturnValueOnce(insertQb)

    const { result } = renderHook(() => useFavorites())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.toggleFavorite('ex-1')

    await waitFor(() => expect(result.current.error).toBe('Insert failed'))
  })
})
