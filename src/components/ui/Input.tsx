'use client'

// useId powers the default field id (SSR-safe; single render — see tasks.md
// 2c.8 risk note: useId SSR hydration is harmless).
import { useId, type ComponentProps, type ReactNode } from 'react'

export interface InputProps extends Omit<ComponentProps<'input'>, 'id'> {
  /** Visible label — never placeholder-only (UIP-4). */
  label: string
  /** Field id; defaults to a useId-generated id. */
  id?: string
  /** Rendered near the field and announced via aria-describedby (UIP-4). */
  error?: string
  /** Left slot inside the field; the input gets pl-10. */
  leadingIcon?: ReactNode
}

// Token-only class maps (D11): every class exists in the @theme (DD-2/7/8).
// Deviation from design.md lines 102-104 (documented in apply-progress): the
// design's `text-muted` label and `text-danger` error sit on the page bg
// `--color-bg` (#55423d) and measure 3.74:1 / 3.25:1 — below WCAG AA 4.5:1
// (verified with real axe in chromium). Same defect class as Badge (2b).
// Label → `text-fg-2` (8.64:1); error → the Badge danger map
// `bg-danger/15 text-fg-2` chip (7.18:1). UIP-7 (MUST a11y) wins.
const WRAPPER = 'flex flex-col gap-1'
const LABEL = 'font-label text-label-caps text-fg-2'
const FIELD =
  'h-11 w-full rounded-lg border bg-surface px-3 font-body text-body-md text-fg-2 placeholder:text-muted transition-colors focus:border-accent focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none'
const ERROR =
  'w-fit rounded-md bg-danger/15 px-2 py-0.5 font-body text-data-sm text-fg-2'
const ICON = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted'

export function Input({
  label,
  id,
  error,
  leadingIcon,
  className = '',
  ...rest
}: InputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`

  const fieldClasses = [
    FIELD,
    error ? 'border-danger' : 'border-border-soft',
    leadingIcon && 'pl-10',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={WRAPPER}>
      <label htmlFor={fieldId} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        {leadingIcon && (
          <span aria-hidden="true" className={ICON}>
            {leadingIcon}
          </span>
        )}
        <input
          id={fieldId}
          className={fieldClasses}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} className={ERROR}>
          {error}
        </p>
      )}
    </div>
  )
}
