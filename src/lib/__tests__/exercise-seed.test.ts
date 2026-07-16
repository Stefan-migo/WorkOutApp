import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchAndSeedExercises } from '@/lib/exercise-seed'

const MOCK_EXERCISES_JSON = JSON.stringify([
  {
    id: 'Bench_Press',
    name: 'Bench Press',
    force: 'push',
    level: 'intermediate',
    mechanic: 'compound',
    equipment: 'barbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: ['Lie down', 'Press up'],
    category: 'strength',
    images: ['Bench_Press/0.jpg'],
  },
])

describe('fetchAndSeedExercises', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches and maps exercises successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(MOCK_EXERCISES_JSON, { status: 200 }),
    )

    const result = await fetchAndSeedExercises()

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Bench Press')
    expect(result[0]!.source).toBe('free-exercise-db')
    expect(result[0]!.difficulty).toBe('intermediate')
  })

  it('returns empty array and logs warning on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchAndSeedExercises()

    expect(result).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('returns empty array on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: 'Server Error' }),
    )

    const result = await fetchAndSeedExercises()

    expect(result).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })
})
