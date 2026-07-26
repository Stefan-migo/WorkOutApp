import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Exercise } from '@/types/workout'

// ── Hoisted mocks ──────────────────────────────────────────────────

const { mockFrom, mockUseAuth, mockGetImages, mockSaveImage, mockDeleteImage } = vi.hoisted(
  () => ({
    mockFrom: vi.fn(),
    mockUseAuth: vi.fn(),
    mockGetImages: vi.fn().mockResolvedValue([]),
    mockSaveImage: vi.fn().mockResolvedValue('url'),
    mockDeleteImage: vi.fn().mockResolvedValue(undefined),
  }),
)

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('@/hooks/useIndexedDB', () => ({
  useIndexedDB: vi.fn(() => ({
    getImages: mockGetImages,
    saveImage: mockSaveImage,
    deleteImage: mockDeleteImage,
  })),
}))

import { useExercises } from '../useExercises'

// ── Helpers ────────────────────────────────────────────────────────

function mockQueryBuilder(resolvesTo: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
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
  builder.or.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.single.mockReturnValue(builder)
  builder.upsert.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  return builder
}

const mockUser = { id: 'user-1', email: 'test@test.com' }

const mockPublicRow = {
  id: 'ex-pub-1',
  user_id: null,
  name: 'Push-up',
  description: 'Classic bodyweight chest exercise',
  category: 'strength',
  primary_muscles: ['chest', 'triceps'],
  secondary_muscles: ['shoulders', 'core'],
  equipment: ['bodyweight'],
  instructions: [],
  force: 'push',
  mechanic: 'compound',
  difficulty: 'beginner',
  images: [],
  source: 'free-exercise-db',
  created_at: '2026-07-25T10:00:00.000Z',
  updated_at: '2026-07-25T10:00:00.000Z',
}

const mockUserRow = {
  id: 'ex-user-1',
  user_id: 'user-1',
  name: 'My Custom Exercise',
  description: null,
  category: 'strength',
  primary_muscles: [],
  secondary_muscles: [],
  equipment: [],
  instructions: [],
  force: null,
  mechanic: null,
  difficulty: 'beginner',
  images: [],
  source: 'user',
  created_at: '2026-07-25T11:00:00.000Z',
  updated_at: '2026-07-25T11:00:00.000Z',
}

const expectedExercises: Exercise[] = [
  {
    id: 'ex-pub-1',
    name: 'Push-up',
    description: 'Classic bodyweight chest exercise',
    category: 'strength',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders', 'core'],
    equipment: ['bodyweight'],
    instructions: [],
    force: 'push',
    mechanic: 'compound',
    difficulty: 'beginner',
    images: [],
    source: 'free-exercise-db',
    createdAt: new Date('2026-07-25T10:00:00.000Z').getTime(),
    updatedAt: new Date('2026-07-25T10:00:00.000Z').getTime(),
  },
  {
    id: 'ex-user-1',
    name: 'My Custom Exercise',
    description: undefined,
    category: 'strength',
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: [],
    instructions: [],
    force: undefined,
    mechanic: undefined,
    difficulty: 'beginner',
    images: [],
    source: 'user',
    createdAt: new Date('2026-07-25T11:00:00.000Z').getTime(),
    updatedAt: new Date('2026-07-25T11:00:00.000Z').getTime(),
  },
]

// ── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: mockUser })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ── Tests ──────────────────────────────────────────────────────────

describe('useExercises', () => {
  it('loads exercises on mount (user + public seed)', async () => {
    const qb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.exercises).toHaveLength(2)
    expect(result.current.exercises[0]).toEqual(expectedExercises[0])
    expect(result.current.exercises[1]).toEqual(expectedExercises[1])
    expect(result.current.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('exercises')
    expect(qb.select).toHaveBeenCalledWith('*')
    expect(qb.or).toHaveBeenCalledWith('user_id.eq.user-1,user_id.is.null')
    expect(qb.order).toHaveBeenCalledWith('name')
  })

  it('returns empty array when no exercises exist', async () => {
    const qb = mockQueryBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.exercises).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces supabase error', async () => {
    const qb = mockQueryBuilder({ data: null, error: new Error('DB error') })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.exercises).toEqual([])
    expect(result.current.error).toBe('DB error')
  })

  it('returns empty when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.exercises).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('getExercise fetches a single exercise by id', async () => {
    const loadQb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    const getQb = mockQueryBuilder({ data: mockPublicRow, error: null })
    mockFrom
      .mockReturnValueOnce(loadQb) // initial fetch
      .mockReturnValue(getQb)      // getExercise call

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const exercise = await result.current.getExercise('ex-pub-1')

    expect(exercise).toEqual(expectedExercises[0])
    expect(mockFrom).toHaveBeenCalledWith('exercises')
    expect(getQb.select).toHaveBeenCalledWith('*')
    expect(getQb.eq).toHaveBeenCalledWith('id', 'ex-pub-1')
  })

  it('getExercise returns undefined when not found', async () => {
    const loadQb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    const getQb = mockQueryBuilder({ data: null, error: { message: 'Not found' } })
    mockFrom
      .mockReturnValueOnce(loadQb) // initial fetch
      .mockReturnValue(getQb)      // getExercise call

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const exercise = await result.current.getExercise('nonexistent')

    expect(exercise).toBeUndefined()
  })

  it('saveExercise upserts and refreshes', async () => {
    const loadQb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(upsertQb)  // upsert call
      .mockReturnValueOnce(refreshQb) // refresh after upsert

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const updated = { ...expectedExercises[1]!, name: 'Updated Name' }
    await result.current.saveExercise(updated)

    expect(upsertQb.upsert).toHaveBeenCalledWith({
      id: 'ex-user-1',
      user_id: 'user-1',
      name: 'Updated Name',
      description: null,
      category: 'strength',
      primary_muscles: [],
      secondary_muscles: [],
      equipment: [],
      instructions: [],
      force: null,
      mechanic: null,
      difficulty: 'beginner',
      images: [],
      source: 'user',
      updated_at: expect.any(String),
    })
    // After upsert, list is refreshed
    expect(result.current.exercises).toHaveLength(2)
  })

  it('saveExercise sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    const upsertQb = mockQueryBuilder({ data: null, error: new Error('Upsert failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetch
      .mockReturnValueOnce(upsertQb) // upsert call

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const updated = { ...expectedExercises[1]!, name: 'Updated' }
    await result.current.saveExercise(updated)

    await waitFor(() => expect(result.current.error).toBe('Upsert failed'))
  })

  it('deleteExercise deletes and refreshes', async () => {
    const loadQb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: null })
    const refreshQb = mockQueryBuilder({ data: [mockPublicRow], error: null })
    mockFrom
      .mockReturnValueOnce(loadQb)   // initial fetch
      .mockReturnValueOnce(deleteQb)  // delete call
      .mockReturnValueOnce(refreshQb) // refresh after delete

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteExercise('ex-user-1')

    expect(deleteQb.delete).toHaveBeenCalledWith()
    expect(deleteQb.eq).toHaveBeenCalledWith('id', 'ex-user-1')
    await waitFor(() => expect(result.current.exercises).toHaveLength(1))
  })

  it('deleteExercise sets error on failure', async () => {
    const loadQb = mockQueryBuilder({ data: [mockPublicRow, mockUserRow], error: null })
    const deleteQb = mockQueryBuilder({ data: null, error: new Error('Delete failed') })
    mockFrom
      .mockReturnValueOnce(loadQb)  // initial fetch
      .mockReturnValueOnce(deleteQb) // delete call

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.deleteExercise('ex-user-1')

    await waitFor(() => expect(result.current.error).toBe('Delete failed'))
  })

  it('exposes IndexedDB image functions', async () => {
    const qb = mockQueryBuilder({ data: [mockPublicRow], error: null })
    mockFrom.mockReturnValue(qb)

    const { result } = renderHook(() => useExercises())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const urls = await result.current.getExerciseImages('ex-1')
    expect(urls).toEqual([])
    expect(mockGetImages).toHaveBeenCalledWith('ex-1')

    const url = await result.current.saveExerciseImage('ex-1', new File([], 'test.jpg'))
    expect(url).toBe('url')
    expect(mockSaveImage).toHaveBeenCalledWith('ex-1', expect.any(File))

    await result.current.deleteExerciseImage('ex-1', 'img.jpg')
    expect(mockDeleteImage).toHaveBeenCalledWith('ex-1', 'img.jpg')
  })
})
