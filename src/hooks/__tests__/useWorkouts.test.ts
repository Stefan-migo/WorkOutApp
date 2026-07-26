import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Hoisted mocks (survive vi.mock hoisting) ───────────────────────

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

import { useWorkouts } from '../useWorkouts'
import type { Workout } from '@/types/workout'

// ── Helpers ────────────────────────────────────────────────────────

function mockQueryBuilder(resolvesTo: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    upsert: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    then<TR = typeof resolvesTo>(
      resolve: (value: TR) => TR | PromiseLike<TR>,
    ): Promise<TR> {
      return Promise.resolve(resolvesTo as unknown as TR).then(resolve)
    },
    catch: vi.fn(),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.single.mockReturnValue(builder)
  builder.upsert.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  return builder
}

const mockUser = { id: 'user-1', email: 'test@test.com' }

const mockRow = {
  id: 'w-1',
  user_id: 'user-1',
  title: 'Morning HIIT',
  description: null,
  image_url: null,
  intervals: [],
  created_at: '2026-07-25T10:00:00.000Z',
  updated_at: '2026-07-25T10:30:00.000Z',
}

const expectedWorkout: Workout = {
  id: 'w-1',
  title: 'Morning HIIT',
  description: undefined,
  imageUrl: undefined,
  intervals: [],
  createdAt: new Date('2026-07-25T10:00:00.000Z').getTime(),
  updatedAt: new Date('2026-07-25T10:30:00.000Z').getTime(),
}

// ── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: mockUser })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────

describe('useWorkouts', () => {
  it('loads workouts on mount (happy path)', async () => {
    const qb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.workouts).toHaveLength(1)
    expect(result.current.workouts[0]).toEqual(expectedWorkout)
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('workouts')
    expect(qb.select).toHaveBeenCalledWith('*')
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(qb.order).toHaveBeenCalledWith('updated_at', { ascending: false })
  })

  it('returns empty array when no workouts exist', async () => {
    const qb = mockQueryBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.workouts).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces supabase error', async () => {
    const qb = mockQueryBuilder({ data: null, error: new Error('DB down') })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.workouts).toEqual([])
    expect(result.current.error).toBe('DB down')
  })

  it('returns empty when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.workouts).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('getWorkout fetches a single workout by id', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const getQb = mockQueryBuilder({ data: mockRow, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb) // initial fetchWorkouts
      .mockReturnValue(getQb)      // getWorkout call

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const workout = await result.current.getWorkout('w-1')

    expect(workout).toEqual(expectedWorkout)
    expect(mockFrom).toHaveBeenCalledWith('workouts')
    expect(getQb.select).toHaveBeenCalledWith('*')
    expect(getQb.eq).toHaveBeenCalledWith('id', 'w-1')
  })

  it('getWorkout returns undefined when not found', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const getQb = mockQueryBuilder({ data: null, error: { message: 'Not found' } })
    mockFrom
      .mockReturnValueOnce(loadQb) // initial fetchWorkouts
      .mockReturnValue(getQb)      // getWorkout call

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const workout = await result.current.getWorkout('nonexistent')

    expect(workout).toBeUndefined()
  })

  it('getWorkout returns undefined when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const workout = await result.current.getWorkout('w-1')

    expect(workout).toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('saveWorkout upserts and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetchWorkouts
      .mockReturnValueOnce(upsertQb)  // upsert call
      .mockReturnValueOnce(refreshQb) // refresh after upsert

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const workoutToSave: Workout = {
      ...expectedWorkout,
      title: 'Updated HIIT',
    }

    await result.current.saveWorkout(workoutToSave)

    expect(upsertQb.upsert).toHaveBeenCalledWith({
      id: 'w-1',
      user_id: 'user-1',
      title: 'Updated HIIT',
      description: null,
      image_url: null,
      intervals: [],
      updated_at: expect.any(String),
    })
    // After save, list is refreshed
    expect(result.current.workouts).toHaveLength(1)
    expect(result.current.workouts[0].title).toBe('Morning HIIT')
  })

  it('saveWorkout sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: new Error('Upsert failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetchWorkouts
      .mockReturnValueOnce(upsertQb) // upsert call

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const workoutToSave: Workout = { ...expectedWorkout }
    await result.current.saveWorkout(workoutToSave)

    await waitFor(() => expect(result.current.error).toBe('Upsert failed'))
  })

  it('deleteWorkout deletes and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetchWorkouts
      .mockReturnValueOnce(deleteQb)  // delete call
      .mockReturnValueOnce(refreshQb) // refresh after delete

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteWorkout('w-1')

    await waitFor(() => expect(result.current.workouts).toEqual([]))
    expect(deleteQb.delete).toHaveBeenCalledWith()
    expect(deleteQb.eq).toHaveBeenCalledWith('id', 'w-1')
  })

  it('deleteWorkout sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: new Error('Delete failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetchWorkouts
      .mockReturnValueOnce(deleteQb)  // delete call

    const { result } = renderHook(() => useWorkouts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteWorkout('w-1')

    await waitFor(() => expect(result.current.error).toBe('Delete failed'))
  })
})
