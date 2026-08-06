import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SEGMENT_COLORS } from '../segment-styles'
import type { IntervalType } from '@/types/workout'

const GLOBALS_CSS = readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf8')

/** Extract `--color-<name>: value;` tokens from globals.css (first definition wins). */
function parseTokens(css: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const match of css.matchAll(/--color-([\w-]+):\s*([^;]+);/g)) {
    const name = match[1]!
    const value = match[2]!
    if (!map.has(name)) map.set(name, value.trim())
  }
  return map
}

/** Follow `var(--x)` chains to the terminal value (palette hex or color-mix). */
function resolveToken(name: string, tokens: Map<string, string>, depth = 0): string {
  if (depth > 8) return ''
  const value = tokens.get(name)
  if (!value) return ''
  const ref = /^var\(--color-([\w-]+)\)$/.exec(value)
  return ref ? resolveToken(ref[1]!, tokens, depth + 1) : value
}

const tokens = parseTokens(GLOBALS_CSS)

/** @theme token key per IntervalType; rest_between_cycles shares the rest token. */
const TOKEN_KEY: Record<IntervalType, string> = {
  prepare: 'prepare',
  work: 'work',
  rest: 'rest',
  rest_between_cycles: 'rest',
  cooldown: 'cooldown',
}

describe('SEGMENT_COLORS ↔ @theme segment tokens (DSF-2a drift guard)', () => {
  it('finds all four --color-segment-* tokens in globals.css', () => {
    for (const key of ['prepare', 'work', 'rest', 'cooldown']) {
      expect(tokens.get(`segment-${key}`), `missing --color-segment-${key} in @theme`).toBeTruthy()
    }
  })

  it('matches every SEGMENT_COLORS entry to its @theme token reference', () => {
    const entries = Object.entries(SEGMENT_COLORS) as [IntervalType, string][]
    expect(entries.length).toBeGreaterThan(0)
    for (const [interval, value] of entries) {
      expect(value, `${interval} drifts from --color-segment-${TOKEN_KEY[interval]}`).toBe(
        `var(--color-segment-${TOKEN_KEY[interval]})`,
      )
    }
  })

  it('resolves work/rest to the palette state tokens (terminal values)', () => {
    // work → success, rest → danger (pure aliases through the segment token chain)
    expect(resolveToken('segment-work', tokens)).toBe(resolveToken('success', tokens))
    expect(resolveToken('segment-rest', tokens)).toBe(resolveToken('danger', tokens))
    expect(resolveToken('segment-work', tokens)).not.toBe(resolveToken('danger', tokens))
  })

  it('resolves cooldown to the danger/surface color-mix', () => {
    expect(tokens.get('segment-cooldown')).toBe(
      'color-mix(in srgb, var(--color-danger) 45%, var(--color-surface))',
    )
  })

  it('resolves prepare to the warn/surface color-mix (terminal values)', () => {
    const prepare = tokens.get('segment-prepare')
    expect(prepare).toBe('color-mix(in srgb, var(--color-warn) 45%, var(--color-surface))')
    const resolved = prepare!.replace(/var\(--color-([\w-]+)\)/g, (_m, name: string) => resolveToken(name, tokens))
    expect(resolved).toBe(
      `color-mix(in srgb, ${resolveToken('warn', tokens)} 45%, ${resolveToken('surface', tokens)})`,
    )
  })

  it('keeps the four segment states pairwise distinct (DSF-2)', () => {
    const resolved = ['prepare', 'work', 'rest', 'cooldown'].map((k) => resolveToken(`segment-${k}`, tokens))
    expect(new Set(resolved).size).toBe(4)
  })
})
