import { describe, it, expect } from 'vitest'
import { createInterval } from '../WorkoutEditor'

describe('createInterval', () => {
  it('creates work interval with default title "Work" and default duration 30', () => {
    const interval = createInterval('work')
    expect(interval.type).toBe('work')
    expect(interval.title).toBe('Work')
    expect(interval.duration).toBe(30)
  })

  it('creates prepare interval with default title "Prepare" and default duration 180 (3 min)', () => {
    const interval = createInterval('prepare')
    expect(interval.type).toBe('prepare')
    expect(interval.title).toBe('Prepare')
    expect(interval.duration).toBe(180)
  })

  it('creates rest interval with default title "Rest" and default duration 30', () => {
    const interval = createInterval('rest')
    expect(interval.type).toBe('rest')
    expect(interval.title).toBe('Rest')
    expect(interval.duration).toBe(30)
  })

  it('creates cooldown interval with default title "Cooldown" and default duration 120 (2 min)', () => {
    const interval = createInterval('cooldown')
    expect(interval.type).toBe('cooldown')
    expect(interval.title).toBe('Cooldown')
    expect(interval.duration).toBe(120)
  })

  it('generates ID matching int-{number} pattern', () => {
    const interval = createInterval('work')
    expect(interval.id).toMatch(/^int-\d+$/)
  })
})
