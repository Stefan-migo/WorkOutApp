import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SEGMENT_COLORS } from '../segment-styles'
import type { IntervalType } from '@/types/workout'

const GLOBALS_CSS = readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf8')

/** Extract `--color-segment-*` tokens from globals.css @theme block. */
function parseSegmentTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const match of css.matchAll(/--color-segment-(\w+):\s*([^;]+);/g)) {
    const [, name, value] = match
    if (name && value) tokens[name] = value.trim()
  }
  return tokens
}

/** @theme token key per IntervalType; rest_between_cycles shares the rest token. */
const TOKEN_KEY: Record<IntervalType, string> = {
  prepare: 'prepare',
  work: 'work',
  rest: 'rest',
  rest_between_cycles: 'rest',
  cooldown: 'cooldown',
}

describe('SEGMENT_COLORS ↔ @theme segment tokens (DSF-2a drift guard)', () => {
  const tokens = parseSegmentTokens(GLOBALS_CSS)

  it('finds all four --color-segment-* tokens in globals.css', () => {
    for (const key of ['prepare', 'work', 'rest', 'cooldown']) {
      expect(tokens[key], `missing --color-segment-${key} in @theme`).toBeTruthy()
    }
  })

  it('matches every SEGMENT_COLORS entry to its @theme token', () => {
    const entries = Object.entries(SEGMENT_COLORS) as [IntervalType, string][]
    expect(entries.length).toBeGreaterThan(0)
    for (const [interval, hex] of entries) {
      expect(hex, `${interval} drifts from --color-segment-${TOKEN_KEY[interval]}`).toBe(
        tokens[TOKEN_KEY[interval]],
      )
    }
  })

  it('matches rest_between_cycles to the rest token', () => {
    expect(SEGMENT_COLORS.rest_between_cycles).toBe(tokens.rest)
  })
})
