import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ProgramTemplate, DayAssignment } from '@/types/workout'

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

import { useProgramTemplates } from '../useProgramTemplates'

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
  id: 'pt-1',
  user_id: 'user-1',
  title: '5/3/1 Template',
  description: 'Jim Wendler 5/3/1 program',
  days: [
    { workoutId: 'w-1' },
    null,
    { workoutId: 'w-2' },
    null,
    null,
    null,
    null,
  ] as (DayAssignment | null)[],
  created_at: '2026-07-25T10:00:00.000Z',
  updated_at: '2026-07-25T10:30:00.000Z',
}

const expectedTemplate: ProgramTemplate = {
  id: 'pt-1',
  title: '5/3/1 Template',
  description: 'Jim Wendler 5/3/1 program',
  days: [
    { workoutId: 'w-1' },
    null,
    { workoutId: 'w-2' },
    null,
    null,
    null,
    null,
  ],
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

describe('useProgramTemplates', () => {
  it('loads templates on mount (happy path)', async () => {
    const qb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.templates).toHaveLength(1)
    expect(result.current.templates[0]).toEqual(expectedTemplate)
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('program_templates')
    expect(qb.select).toHaveBeenCalledWith('*')
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(qb.order).toHaveBeenCalledWith('updated_at', { ascending: false })
  })

  it('returns empty array when no templates exist', async () => {
    const qb = mockQueryBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.templates).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces supabase error', async () => {
    const qb = mockQueryBuilder({ data: null, error: new Error('DB down') })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.templates).toEqual([])
    expect(result.current.error).toBe('DB down')
  })

  it('returns empty when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.templates).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('saveTemplate upserts and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [mockRow], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(upsertQb)  // upsert call
      .mockReturnValueOnce(refreshQb) // refresh after upsert

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const templateToSave: ProgramTemplate = {
      ...expectedTemplate,
      title: 'Updated Template',
    }

    await result.current.saveTemplate(templateToSave)

    expect(upsertQb.upsert).toHaveBeenCalledWith({
      id: 'pt-1',
      user_id: 'user-1',
      title: 'Updated Template',
      description: 'Jim Wendler 5/3/1 program',
      days: expect.any(Array),
      updated_at: expect.any(String),
    })
    // After save, list is refreshed
    expect(result.current.templates).toHaveLength(1)
    expect(result.current.templates[0]!.title).toBe('5/3/1 Template')
  })

  it('saveTemplate sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: new Error('Upsert failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetch
      .mockReturnValueOnce(upsertQb) // upsert call

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.saveTemplate(expectedTemplate)

    await waitFor(() => expect(result.current.error).toBe('Upsert failed'))
  })

  it('deleteTemplate deletes and refreshes the list', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(deleteQb)  // delete call
      .mockReturnValueOnce(refreshQb) // refresh after delete

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteTemplate('pt-1')

    await waitFor(() => expect(result.current.templates).toEqual([]))
    expect(deleteQb.delete).toHaveBeenCalledWith()
    expect(deleteQb.eq).toHaveBeenCalledWith('id', 'pt-1')
  })

  it('deleteTemplate sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: new Error('Delete failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetch
      .mockReturnValueOnce(deleteQb) // delete call

    const { result } = renderHook(() => useProgramTemplates())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteTemplate('pt-1')

    await waitFor(() => expect(result.current.error).toBe('Delete failed'))
  })
})
