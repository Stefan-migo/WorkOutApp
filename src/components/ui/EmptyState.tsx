import type { ReactNode } from 'react'

export interface EmptyStateProps {
  /** Decorative icon above the title (optional). */
  icon?: ReactNode
  /** Heading text — the only required content (UIP-5). */
  title: string
  /** Supporting message (optional). */
  body?: string
  /** Call-to-action node, e.g. a Button (optional). */
  action?: ReactNode
}

// Token-only class maps (D11): every class exists in the @theme (DD-8).
// Deviation from design.md line 113 (documented in apply-progress): the
// design's `text-muted` body measures 3.74:1 on the page bg token -- below
// WCAG AA 4.5:1 (verified with real axe in chromium). Same defect class as
// Input label (2c). Body therefore uses `text-fg-2` (8.64:1). UIP-7 (MUST
// a11y) wins; title/body stay distinct via size and weight.
const WRAPPER = 'flex flex-col items-center justify-center gap-2 py-16 text-center'
const ICON = 'text-meta'
const TITLE = 'font-headline text-headline-md font-semibold text-fg-2'
const BODY = 'font-body text-body-md text-fg-2'

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className={WRAPPER}>
      {icon && (
        <div aria-hidden="true" className={ICON}>
          {icon}
        </div>
      )}
      <h2 className={TITLE}>{title}</h2>
      {body && <p className={BODY}>{body}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
