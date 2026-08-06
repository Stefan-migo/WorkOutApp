import type { ComponentPropsWithoutRef } from 'react'
import type { ButtonVariant } from './Button'

export interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
  /** Required accessible name (UIP-2): unlabeled icon buttons fail a11y. */
  'aria-label': string
  size?: 'sm' | 'md'
}

// Token-only class maps (D11). md = h-11 w-11 = 44x44px touch target (Constraint).
const BASE =
  'inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-active',
  ghost: 'text-fg-2 hover:bg-surface-warm active:bg-surface-warm/80',
  outline: 'border border-border-soft text-fg-2 hover:bg-surface-warm active:bg-surface-warm/80',
  danger: 'bg-danger text-accent-on hover:bg-danger/80',
}

const SIZES: Record<'sm' | 'md', string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
}

export function IconButton({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ')

  return <button type={type} className={classes} {...rest} />
}
