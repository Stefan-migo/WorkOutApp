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
const BASE =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label text-label-caps font-bold'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-muted border border-border-soft',
  primary: 'bg-accent text-accent-on',
  success: 'bg-success/15 text-success',
  warn: 'bg-warn/15 text-warn',
  danger: 'bg-danger/15 text-danger',
  'segment-prepare': 'bg-segment-prepare/10 text-segment-prepare',
  'segment-work': 'bg-segment-work/10 text-segment-work',
  'segment-rest': 'bg-segment-rest/10 text-segment-rest',
  'segment-cooldown': 'bg-segment-cooldown/10 text-segment-cooldown',
}

export function Badge({ tone = 'neutral', className = '', ...rest }: BadgeProps) {
  const classes = [BASE, TONES[tone], className].filter(Boolean).join(' ')

  return <span className={classes} {...rest} />
}
