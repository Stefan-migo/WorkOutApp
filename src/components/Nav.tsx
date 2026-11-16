'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const mobileItems = [
  { href: '/', label: 'Today', icon: 'today' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_month' },
  { href: '/workouts', label: 'Workouts', icon: 'fitness_center' },
  { href: '/history', label: 'History', icon: 'history' },
]

const extraItems = [
  { href: '/sequences', label: 'Sequences', icon: 'reorder' },
  { href: '/exercises', label: 'Exercises', icon: 'accessibility_new' },
  { href: '/stats', label: 'Stats', icon: 'monitoring' },
]

export default function Nav() {
  const pathname = usePathname()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)
  const moreButton = useRef<HTMLButtonElement>(null)
  const { user, signOut } = useAuth()
  const isOpen = menuPath === pathname

  useEffect(() => {
    if (isOpen) firstLink.current?.focus()
  }, [isOpen])

  function closeMenu() {
    setMenuPath(null)
    moreButton.current?.focus()
  }

  function handleEscape(event: KeyboardEvent<HTMLElement>) {
    if (!isOpen || event.key !== 'Escape') return
    event.preventDefault()
    closeMenu()
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
  }

  return (
    <>
      {isOpen && (
        <div aria-hidden="true" className="fixed inset-0 z-20 bg-fg/25 md:hidden" onClick={closeMenu} />
      )}

      <aside className={`app-sidebar fixed z-30 border-border-soft bg-surface md:inset-y-0 md:left-0 md:w-64 md:rounded-none md:border-y-0 md:border-r ${isOpen ? 'flex' : 'hidden md:flex'} flex-col overflow-y-auto p-16`} id="app-menu" onKeyDown={handleEscape}>
        <Link ref={firstLink} href="/" onClick={() => setMenuPath(null)} className="mb-4 flex min-h-12 items-center gap-3 px-3 text-lg font-bold tracking-tight text-fg-2">
          <img src="/baronda-48.png" width={36} height={36} alt="" className="rounded-control" />
          Baronda
        </Link>
        <nav aria-label="All sections" className="flex flex-1 flex-col gap-1">
          {[...mobileItems, ...extraItems].map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} onClick={() => setMenuPath(null)} aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-sm hover:bg-surface-warm ${active ? 'bg-surface-warm font-bold text-accent' : 'font-medium text-muted'}`}>
                <span className="material-symbols-outlined text-xl" aria-hidden="true">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>
        {user && (
          <div className="mt-16 border-t border-border-soft pt-16">
            <p className="truncate px-3 text-sm text-muted">{user.email}</p>
            <button onClick={() => signOut()} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-medium text-muted hover:bg-surface-warm hover:text-danger">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">logout</span>
              Sign out
            </button>
          </div>
        )}
      </aside>

      <nav aria-label="Primary navigation" className="app-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border-soft bg-surface px-2 md:hidden" onKeyDown={handleEscape}>
        {mobileItems.map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} onClick={() => setMenuPath(null)} aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-control px-0.5 text-[11px] font-semibold ${active ? 'bg-surface-warm text-accent' : 'text-muted'}`}>
              <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{icon}</span>
              {label}
            </Link>
          )
        })}
        <button ref={moreButton} aria-expanded={isOpen} aria-controls="app-menu" onClick={() => isOpen ? closeMenu() : setMenuPath(pathname)}
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-control text-[11px] font-semibold ${isOpen || extraItems.some(({ href }) => isActive(href)) ? 'bg-surface-warm text-accent' : 'text-muted'}`}>
          <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{isOpen ? 'close' : 'more_horiz'}</span>
          More
        </button>
      </nav>
    </>
  )
}
