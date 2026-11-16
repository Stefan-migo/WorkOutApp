import Link from 'next/link'

const links = [
  { href: '/exercises', label: 'Exercise library', icon: 'search' },
  { href: '/history', label: 'Training log', icon: 'history' },
]

export default function QuickActions() {
  return (
    <nav className="grid gap-8 sm:grid-cols-2" aria-label="Training shortcuts">
      {links.map(({ href, label, icon }) => (
        <Link key={href} href={href} className="glass-card flex min-h-12 items-center gap-3 rounded-card px-4 text-sm font-semibold text-fg-2 hover:bg-surface-warm">
          <span className="material-symbols-outlined text-accent" aria-hidden="true">{icon}</span>
          {label}
          <span className="material-symbols-outlined ml-auto text-muted" aria-hidden="true">chevron_right</span>
        </Link>
      ))}
    </nav>
  )
}
