import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { WeekPlan, DayAssignment } from '@/types/workout'

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

vi.mock('@/lib/calendar-utils', () => ({
  getMonday: vi.fn((date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    return d.toISOString().slice(0, 10)
  }),
}))

import { useWeekPlans } from '../useWeekPlans'

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
    maybeSingle: vi.fn(),
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
  builder.maybeSingle.mockReturnValue(builder)
  builder.upsert.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  return builder
}

const mockUser = { id: 'user-1', email: 'test@test.com' }

const mockRow = {
  id: 'wp-1',
  user_id: 'user-1',
  title: null,
  start_date: '2026-07-20',
  days: [null, null, null, null, null, null, null] as (DayAssignment | null)[],
  created_at: '2026-07-25T10:00:00.000Z',
  updated_at: '2026-07-25T10:30:00.000Z',
}

const expectedWeekPlan: WeekPlan = {
  id: 'wp-1',
  title: undefined,
  startDate: '2026-07-20',
  days: [null, null, null, null, null, null, null],
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

describe('useWeekPlans', () => {
  it('loads week plans on mount (happy path)', async () => {
    const qb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.weekPlans).toHaveLength(1)
    expect(result.current.weekPlans[0]).toEqual(expectedWeekPlan)
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('week_plans')
    expect(qb.select).toHaveBeenCalledWith('*')
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(qb.order).toHaveBeenCalledWith('updated_at', { ascending: false })
  })

  it('returns empty array when no week plans exist', async () => {
    const qb = mockQueryBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.weekPlans).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces supabase error', async () => {
    const qb = mockQueryBuilder({ data: null, error: new Error('DB down') })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.weekPlans).toEqual([])
    expect(result.current.error).toBe('DB down')
  })

  it('returns empty when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.weekPlans).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('getWeekPlan returns existing plan from local state', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom.mockReturnValueOnce(loadQb)  // initial fetch

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Plan was loaded during initial fetch — getWeekPlan finds it locally
    const plan = await result.current.getWeekPlan('2026-07-20')

    expect(plan).toEqual(expectedWeekPlan)
    // No additional Supabase calls after initial fetch
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('getWeekPlan auto-creates a new plan when none exists for that date', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    // Insert returns the newly created row with a UUID
    const insertedRow = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user-1',
      title: null,
      start_date: '2026-07-27',
      days: [null, null, null, null, null, null, null],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const insertQb = mockQueryBuilder({ data: insertedRow, error: null })

    // For the getWeekPlan, it chains select/eq/maybeSingle for the lookup
    const lookupQb = mockQueryBuilder({ data: null, error: null })

    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(lookupQb)  // maybeSingle lookup
      .mockReturnValueOnce(insertQb)  // insert the new plan

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const plan = await result.current.getWeekPlan('2026-07-27')

    expect(plan).toBeDefined()
    expect(plan!.startDate).toBe('2026-07-27')
    expect(plan!.days).toEqual([null, null, null, null, null, null, null])
    // Insert was called with the correct shape (no hardcoded id)
    expect(insertQb.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      start_date: '2026-07-27',
      days: [null, null, null, null, null, null, null],
      updated_at: expect.any(String),
    })

    // Verify the plan was added to the local list
    await waitFor(() => expect(result.current.weekPlans).toHaveLength(2))
  })

  it('getWeekPlan returns undefined when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const plan = await result.current.getWeekPlan('2026-07-20')

    expect(plan).toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('saveWeekPlan upserts and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(upsertQb)  // upsert call
      .mockReturnValueOnce(refreshQb) // refresh after upsert

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const planToSave: WeekPlan = {
      ...expectedWeekPlan,
      days: [{ workoutId: 'w-1' }, null, null, null, null, null, null],
    }

    await result.current.saveWeekPlan(planToSave)

    expect(upsertQb.upsert).toHaveBeenCalledWith({
      id: 'wp-1',
      user_id: 'user-1',
      title: null,
      start_date: '2026-07-20',
      days: [{ workoutId: 'w-1' }, null, null, null, null, null, null],
      updated_at: expect.any(String),
    })
    // After save, list is refreshed
    expect(result.current.weekPlans).toHaveLength(1)
  })

  it('saveWeekPlan sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: new Error('Upsert failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetch
      .mockReturnValueOnce(upsertQb) // upsert call

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.saveWeekPlan(expectedWeekPlan)

    await waitFor(() => expect(result.current.error).toBe('Upsert failed'))
  })

  it('deleteWeekPlan deletes and refreshes', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(deleteQb)  // delete call
      .mockReturnValueOnce(refreshQb) // refresh after delete

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteWeekPlan('wp-1')

    await waitFor(() => expect(result.current.weekPlans).toEqual([]))
    expect(deleteQb.delete).toHaveBeenCalledWith()
    expect(deleteQb.eq).toHaveBeenCalledWith('id', 'wp-1')
  })

  it('deleteWeekPlan sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: new Error('Delete failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetch
      .mockReturnValueOnce(deleteQb) // delete call

    const { result } = renderHook(() => useWeekPlans())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteWeekPlan('wp-1')

    await waitFor(() => expect(result.current.error).toBe('Delete failed'))
  })
})
