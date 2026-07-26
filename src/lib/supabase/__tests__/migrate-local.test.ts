import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mock setup ─────────────────────────────────────────────

const { mockUpsert } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: mockUpsert,
    })),
  })),
}))

// ── Helpers ────────────────────────────────────────────────────────

function setLocalStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function clearLocalStorage() {
  localStorage.clear()
}

// ── Tests ──────────────────────────────────────────────────────────

describe('migrateLocalData', () => {
  beforeEach(() => {
    clearLocalStorage()
    vi.clearAllMocks()
    // Set up mock to return success by default
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('skips migration if already migrated', async () => {
    localStorage.setItem('workoutapp.migrated_user-1', 'true')

    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    expect(result.total).toBe(0)
    expect(result.migrated).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('migrates workouts from localStorage to supabase', async () => {
    const mockWorkouts = [
      { id: 'w-1', title: 'Morning HIIT', intervals: [] },
      { id: 'w-2', title: 'Yoga Flow', intervals: [] },
    ]
    setLocalStorage('workoutapp.workouts', mockWorkouts)

    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    expect(result.total).toBe(2)
    expect(result.migrated).toBe(2)
    expect(result.errors).toHaveLength(0)
    expect(mockUpsert).toHaveBeenCalledWith(
      [
        { id: 'w-1', title: 'Morning HIIT', intervals: [], user_id: 'user-1' },
        { id: 'w-2', title: 'Yoga Flow', intervals: [], user_id: 'user-1' },
      ],
      { onConflict: 'id', ignoreDuplicates: false },
    )
  })

  it('migrates all 6 table entities', async () => {
    setLocalStorage('workoutapp.workouts', [{ id: 'w-1', title: 'Test' }])
    setLocalStorage('workoutapp.exercises', [{ id: 'e-1', name: 'Push-up' }])
    setLocalStorage('workoutapp.sessions', [{ id: 's-1', type: 'workout' }])
    setLocalStorage('workoutapp.sequences', [{ id: 'seq-1', title: 'Circuit' }])
    setLocalStorage('workoutapp.weekplans', [{ id: 'wp-1', startDate: '2026-07-27' }])
    setLocalStorage('workoutapp.programtemplates', [{ id: 'pt-1', title: '5/3/1' }])

    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    // 6 entities × 1 item each = 6 total, 6 migrated
    expect(result.total).toBe(6)
    expect(result.migrated).toBe(6)
    expect(result.errors).toHaveLength(0)
    // upsert was called 6 times (once per table)
    expect(mockUpsert).toHaveBeenCalledTimes(6)
  })

  it('migrates favorites array from localStorage', async () => {
    setLocalStorage('workoutapp.favorites', ['e-1', 'e-2', 'e-3'])

    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    expect(result.total).toBe(3)
    expect(result.migrated).toBe(3)
    expect(mockUpsert).toHaveBeenCalledWith(
      [
        { user_id: 'user-1', exercise_id: 'e-1' },
        { user_id: 'user-1', exercise_id: 'e-2' },
        { user_id: 'user-1', exercise_id: 'e-3' },
      ],
      { onConflict: 'user_id,exercise_id', ignoreDuplicates: true },
    )
  })

  it('migrates favorites as an object map', async () => {
    setLocalStorage('workoutapp.favorites', { 'e-1': true, 'e-2': false, 'e-3': true })

    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    // Only truthy keys become rows
    expect(result.total).toBe(3)
    expect(result.migrated).toBe(3)
    expect(mockUpsert).toHaveBeenCalledWith(
      [
        { user_id: 'user-1', exercise_id: 'e-1' },
        { user_id: 'user-1', exercise_id: 'e-2' },
        { user_id: 'user-1', exercise_id: 'e-3' },
      ],
      { onConflict: 'user_id,exercise_id', ignoreDuplicates: true },
    )
  })

  it('handles empty localStorage gracefully', async () => {
    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    expect(result.total).toBe(0)
    expect(result.migrated).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('tolerates partial failure and continues', async () => {
    setLocalStorage('workoutapp.workouts', [{ id: 'w-1', title: 'HIIT' }])
    setLocalStorage('workoutapp.exercises', [{ id: 'e-1', name: 'Push-up' }])

    // Make first table upsert fail
    mockUpsert
      .mockResolvedValueOnce({ error: new Error('DB timeout') })
      .mockResolvedValue({ error: null })

    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    expect(result.total).toBe(2)
    expect(result.migrated).toBe(1) // only exercises succeeded
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('workouts')
  })

  it('sets migrated flag after successful migration', async () => {
    setLocalStorage('workoutapp.workouts', [{ id: 'w-1', title: 'HIIT' }])

    const { migrateLocalData } = await import('../migrate-local')
    await migrateLocalData('user-1')

    expect(localStorage.getItem('workoutapp.migrated_user-1')).toBe('true')
  })

  it('handles corrupted JSON gracefully', async () => {
    localStorage.setItem('workoutapp.workouts', 'not valid json')

    const { migrateLocalData } = await import('../migrate-local')
    const result = await migrateLocalData('user-1')

    expect(result.total).toBe(0)
    expect(result.migrated).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('workouts')
  })
})
