import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Session } from '@/types/workout'

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

import { useSessions } from '../useSessions'

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
  id: 's-1',
  user_id: 'user-1',
  type: 'workout',
  workout_id: 'w-1',
  sequence_id: null,
  started_at: '2026-07-25T10:00:00.000Z',
  completed_at: '2026-07-25T10:30:00.000Z',
  intervals: [],
  created_at: '2026-07-25T10:00:00.000Z',
}

const expectedSession: Session = {
  id: 's-1',
  type: 'workout',
  workoutId: 'w-1',
  sequenceId: undefined,
  startedAt: new Date('2026-07-25T10:00:00.000Z').getTime(),
  completedAt: new Date('2026-07-25T10:30:00.000Z').getTime(),
  intervals: [],
}

// ── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: mockUser })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────

describe('useSessions', () => {
  it('loads sessions on mount (happy path)', async () => {
    const qb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sessions).toHaveLength(1)
    expect(result.current.sessions[0]).toEqual(expectedSession)
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('sessions')
    expect(qb.select).toHaveBeenCalledWith('*')
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(qb.order).toHaveBeenCalledWith('started_at', { ascending: false })
  })

  it('returns empty array when no sessions exist', async () => {
    const qb = mockQueryBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sessions).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces supabase error', async () => {
    const qb = mockQueryBuilder({ data: null, error: new Error('DB error') })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sessions).toEqual([])
    expect(result.current.error).toBe('DB error')
  })

  it('returns empty when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sessions).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('addSession inserts and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const insertQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(insertQb)  // insert call
      .mockReturnValueOnce(refreshQb) // refresh after insert

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const newSession: Session = {
      ...expectedSession,
      id: 's-2',
      startedAt: Date.now(),
    }

    await result.current.addSession(newSession)

    expect(insertQb.insert).toHaveBeenCalledWith({
      id: 's-2',
      user_id: 'user-1',
      type: 'workout',
      workout_id: 'w-1',
      sequence_id: null,
      started_at: expect.any(String),
      completed_at: expect.any(String),
      intervals: [],
    })
    // After insert, list is refreshed
    expect(result.current.sessions).toHaveLength(1)
  })

  it('addSession sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const insertQb = mockQueryBuilder({ data: null, error: new Error('Insert failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetch
      .mockReturnValueOnce(insertQb) // insert call

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const newSession: Session = { ...expectedSession, id: 's-2' }
    await result.current.addSession(newSession)

    await waitFor(() => expect(result.current.error).toBe('Insert failed'))
  })
})
