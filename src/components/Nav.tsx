'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/workouts', label: 'Workouts' },
  { href: '/stats', label: 'Stats' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/history', label: 'History' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-around border-t border-border-soft bg-surface px-2 py-1">
      {links.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-accent text-accent-on'
                : 'text-muted hover:text-fg hover:bg-surface-alt'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
