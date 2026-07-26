import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Sequence } from '@/types/workout'

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

import { useSequences } from '../useSequences'

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
  id: 'seq-1',
  user_id: 'user-1',
  title: 'Morning Circuit',
  description: null,
  workout_ids: ['w-1', 'w-2'],
  repeat_count: 3,
  created_at: '2026-07-25T10:00:00.000Z',
  updated_at: '2026-07-25T10:30:00.000Z',
}

const expectedSequence: Sequence = {
  id: 'seq-1',
  title: 'Morning Circuit',
  description: undefined,
  workoutIds: ['w-1', 'w-2'],
  repeatCount: 3,
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

describe('useSequences', () => {
  it('loads sequences on mount (happy path)', async () => {
    const qb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sequences).toHaveLength(1)
    expect(result.current.sequences[0]).toEqual(expectedSequence)
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('sequences')
    expect(qb.select).toHaveBeenCalledWith('*')
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(qb.order).toHaveBeenCalledWith('updated_at', { ascending: false })
  })

  it('returns empty array when no sequences exist', async () => {
    const qb = mockQueryBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sequences).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces supabase error', async () => {
    const qb = mockQueryBuilder({ data: null, error: new Error('DB down') })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sequences).toEqual([])
    expect(result.current.error).toBe('DB down')
  })

  it('returns empty when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sequences).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('getSequence fetches a single sequence by id', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const getQb = mockQueryBuilder({ data: mockRow, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb) // initial fetchSequences
      .mockReturnValue(getQb)      // getSequence call

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const seq = await result.current.getSequence('seq-1')

    expect(seq).toEqual(expectedSequence)
    expect(mockFrom).toHaveBeenCalledWith('sequences')
    expect(getQb.select).toHaveBeenCalledWith('*')
    expect(getQb.eq).toHaveBeenCalledWith('id', 'seq-1')
  })

  it('getSequence returns undefined when not found', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const getQb = mockQueryBuilder({ data: null, error: { message: 'Not found' } })
    mockFrom
      .mockReturnValueOnce(loadQb) // initial fetchSequences
      .mockReturnValue(getQb)      // getSequence call

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const seq = await result.current.getSequence('nonexistent')

    expect(seq).toBeUndefined()
  })

  it('getSequence returns undefined when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const seq = await result.current.getSequence('seq-1')

    expect(seq).toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('saveSequence upserts and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetchSequences
      .mockReturnValueOnce(upsertQb)  // upsert call
      .mockReturnValueOnce(refreshQb) // refresh after upsert

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const seqToSave: Sequence = {
      ...expectedSequence,
      title: 'Updated Circuit',
    }

    await result.current.saveSequence(seqToSave)

    expect(upsertQb.upsert).toHaveBeenCalledWith({
      id: 'seq-1',
      user_id: 'user-1',
      title: 'Updated Circuit',
      description: null,
      workout_ids: ['w-1', 'w-2'],
      repeat_count: 3,
      updated_at: expect.any(String),
    })
    // After save, list is refreshed
    expect(result.current.sequences).toHaveLength(1)
    expect(result.current.sequences[0]!.title).toBe('Morning Circuit')
  })

  it('saveSequence sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: new Error('Upsert failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetchSequences
      .mockReturnValueOnce(upsertQb) // upsert call

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const seqToSave: Sequence = { ...expectedSequence }
    await result.current.saveSequence(seqToSave)

    await waitFor(() => expect(result.current.error).toBe('Upsert failed'))
  })

  it('deleteSequence deletes and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetchSequences
      .mockReturnValueOnce(deleteQb)  // delete call
      .mockReturnValueOnce(refreshQb) // refresh after delete

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteSequence('seq-1')

    await waitFor(() => expect(result.current.sequences).toEqual([]))
    expect(deleteQb.delete).toHaveBeenCalledWith()
    expect(deleteQb.eq).toHaveBeenCalledWith('id', 'seq-1')
  })

  it('deleteSequence sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: new Error('Delete failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetchSequences
      .mockReturnValueOnce(deleteQb)  // delete call

    const { result } = renderHook(() => useSequences())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteSequence('seq-1')

    await waitFor(() => expect(result.current.error).toBe('Delete failed'))
  })
})
