import type { ComponentPropsWithoutRef } from 'react'

export type CardVariant = 'default' | 'raised' | 'inset'

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  variant?: CardVariant
  /** hover affordance; click handling stays at the call site (no asChild) */
  interactive?: boolean
}

// Token-only class maps (D11): every class exists in the @theme (DD-2).
const SHARED = 'rounded-xl border'

const VARIANTS: Record<CardVariant, string> = {
  default: 'bg-surface border-border-soft',
  raised: 'bg-surface border-border shadow-card-hover',
  inset: 'bg-bg border-border-soft',
}

const INTERACTIVE = 'cursor-pointer transition-colors hover:border-border hover:shadow-card-hover'

export function Card({
  variant = 'default',
  interactive = false,
  className = '',
  ...rest
}: CardProps) {
  const classes = [SHARED, VARIANTS[variant], interactive && INTERACTIVE, className]
    .filter(Boolean)
    .join(' ')

  return <div className={classes} {...rest} />
}
