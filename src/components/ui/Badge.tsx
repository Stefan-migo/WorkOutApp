import type { ComponentPropsWithoutRef } from 'react'

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warn'
  | 'danger'
  | 'segment-prepare'
  | 'segment-work'
  | 'segment-rest'
  | 'segment-cooldown'

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone
}

// Token-only class maps (D11): every class exists in the @theme (DD-2).
// Color is never the only differentiator (UIP-3): meaning MUST be in the text.
// Deviation from design.md lines 79-80 (documented in apply-progress): the
// design's `text-{tone}` on `/15` `/10` dark tints measures 1.23-3.58:1 —
// below WCAG AA 4.5:1. Tinted tones therefore use `text-fg-2` (light text on
// the dark tint), consistent with the neutral tone's own light-on-dark map.
const BASE =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label text-label-caps font-bold'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-muted border border-border-soft',
  primary: 'bg-accent text-accent-on',
  success: 'bg-success/15 text-fg-2',
  warn: 'bg-warn/15 text-fg-2',
  danger: 'bg-danger/15 text-fg-2',
  'segment-prepare': 'bg-segment-prepare/10 text-fg-2',
  'segment-work': 'bg-segment-work/10 text-fg-2',
  'segment-rest': 'bg-segment-rest/10 text-fg-2',
  'segment-cooldown': 'bg-segment-cooldown/10 text-fg-2',
}

export function Badge({ tone = 'neutral', className = '', ...rest }: BadgeProps) {
  const classes = [BASE, TONES[tone], className].filter(Boolean).join(' ')

  return <span className={classes} {...rest} />
}
