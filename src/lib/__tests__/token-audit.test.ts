import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

// Contract-lock for the Happy Hues token audit (design D6). Mirrors the
// `audit:tokens` npm script as a test so the palette contract cannot drift.
// NOTE: this file itself is intentionally hex-free and never contains the
// banned class names as literals — the audit scans every src file.

const SRC = path.resolve(process.cwd(), 'src')
const GLOBALS_CSS = readFileSync(path.join(SRC, 'app', 'globals.css'), 'utf8')

function allTsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { recursive: true })) {
    const name = String(entry).replaceAll('\\', '/')
    if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      out.push(path.join(dir, name))
    }
  }
  return out
}

const ALL_FILES = allTsFiles(SRC)
const PRODUCTION_FILES = ALL_FILES.filter((f) => !f.includes('/__tests__/'))
const CONTENTS = new Map(ALL_FILES.map((f) => [f, readFileSync(f, 'utf8')]))

describe('token audit contract (D6)', () => {
  it('rule 1: no Material utility classes in production src', () => {
    // ponytail: __tests__ excluded — the contract-lock test itself must
    // reference these names to assert against them.
    const MATERIAL_UTILITIES = [
      'text-on-surface',
      'text-on-background',
      'text-on-surface-variant',
      'bg-surface-container',
      'bg-surface-dim',
      'bg-surface-bright',
      'bg-surface-variant',
      'border-outline-variant',
      'border-outline',
      'bg-primary',
      'text-primary',
      'bg-secondary',
      'text-secondary',
      'bg-primary-btn',
      'text-on-primary',
      'bg-error',
      'text-error',
      'ring-primary',
      'ring-secondary',
      'bg-sidebar',
      'text-on-sidebar',
      'bg-background',
      'text-outline',
      'bg-surface-tint',
      'text-on-primary-container',
      'bg-primary-container',
      'bg-secondary-container',
      'bg-error-container',
      'text-on-error',
      'text-on-error-container',
      'text-on-primary-fixed',
    ]
    const offenders: string[] = []
    for (const file of PRODUCTION_FILES) {
      const text = CONTENTS.get(file)!
      for (const util of MATERIAL_UTILITIES) {
        if (text.includes(util)) offenders.push(`${path.relative(SRC, file)}: ${util}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('rule 2: no Material tokens or prefers-color-scheme in globals.css', () => {
    const MATERIAL_TOKEN_RE =
      /--color-(primary|secondary|tertiary|error|background|on-background|on-surface|surface-container|surface-dim|surface-bright|surface-variant|inverse|outline|surface-tint|sidebar|primary-btn|on-primary-dark-bg)|prefers-color-scheme/
    expect(GLOBALS_CSS).not.toMatch(MATERIAL_TOKEN_RE)
  })

  it('rule 3: no raw hex or rgba outside @theme and the themeColor mirror', () => {
    const RAW_COLOR_RE = /#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/
    const offenders: string[] = []
    for (const file of ALL_FILES) {
      const lines = CONTENTS.get(file)!.split('\n')
      lines.forEach((line, i) => {
        if (line.includes('themeColor')) return
        if (RAW_COLOR_RE.test(line)) {
          offenders.push(`${path.relative(SRC, file)}:${i + 1}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it('rule 4: no second accent (blue/purple/indigo/violet)', () => {
    // Escapes keep the banned literals out of this file (it scans itself).
    const BLUE_PURPLE_RES = [
      /\x233b82f6/,
      /\x238b5cf6/,
      /[b]g-blue/,
      /[t]ext-blue/,
      /[b]g-purple/,
      /[t]ext-purple/,
      /[b]g-violet/,
      /[t]ext-violet/,
      /[b]g-indigo/,
      /[t]ext-indigo/,
    ]
    const offenders: string[] = []
    for (const file of ALL_FILES) {
      const text = CONTENTS.get(file)!
      for (const re of BLUE_PURPLE_RES) {
        if (re.test(text)) offenders.push(path.relative(SRC, file))
      }
    }
    expect(offenders).toEqual([])
  })
})
