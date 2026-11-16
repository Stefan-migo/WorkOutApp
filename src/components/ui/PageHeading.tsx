import type { ReactNode } from 'react'

export function PageHeading({ title, description, action }: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-16 border-b border-border-soft pb-16">
      <div className="min-w-0">
        <h1 className="font-headline text-headline-lg tracking-tight text-fg-2">{title}</h1>
        {description && <p className="mt-xs text-body-md text-muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}
