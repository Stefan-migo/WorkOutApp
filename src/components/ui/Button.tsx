import type { ComponentPropsWithoutRef } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** rounded-full — FAB/pill shape */
  pill?: boolean
  /** shadow-fab — floating action button elevation */
  elevated?: boolean
}

// Token-only class maps (D11): every class exists in the @theme (DD-2).
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-label text-label-caps font-bold tracking-wide transition-colors focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-active',
  ghost: 'text-fg-2 hover:bg-surface-warm active:bg-surface-warm/80',
  outline: 'border border-border-soft text-fg-2 hover:bg-surface-warm active:bg-surface-warm/80',
  danger: 'bg-danger text-accent-on hover:bg-danger/80',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  lg: 'h-12 px-5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  pill = false,
  elevated = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [BASE, VARIANTS[variant], SIZES[size], pill && 'rounded-full', elevated && 'shadow-fab', className]
    .filter(Boolean)
    .join(' ')

  return <button type={type} className={classes} {...rest} />
}
