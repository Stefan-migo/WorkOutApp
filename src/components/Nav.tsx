'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/workouts', label: 'Workouts', icon: 'fitness_center' },
  { href: '/sequences', label: 'Sequences', icon: 'reorder' },
  { href: '/exercises', label: 'Exercises', icon: 'settings_accessibility' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/history', label: 'History', icon: 'history' },
  { href: '/stats', label: 'Stats', icon: 'monitoring' },
]

export default function Nav() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Desktop (fixed) + Mobile (overlay) */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-primary z-50 flex flex-col py-lg px-md transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="mb-xl px-sm">
          <h1 className="font-headline text-[24px] font-bold text-surface leading-tight tracking-tight">WorkOutApp</h1>
          <p className="font-mono text-sm text-on-primary-container mt-1">Nordic Athletic</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-xs">
          {navItems.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-md px-sm py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? 'text-secondary-container font-bold bg-primary-container/50 opacity-90'
                    : 'text-on-primary-fixed-variant hover:bg-primary-container hover:text-on-primary-fixed transition-colors'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {icon}
                </span>
                <span className="font-label text-label-caps uppercase tracking-wider">{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Top App Bar — hidden on mobile, visible on desktop */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 h-20 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 items-center justify-between px-margin-desktop z-30">
        <span className="font-headline text-headline-md font-bold text-primary tracking-tight">WorkOutApp</span>
        <div className="flex items-center gap-md">
          <Link
            href="/workouts/new"
            className="bg-primary-container text-on-primary font-label text-label-caps px-4 py-2 rounded-full hover:bg-primary transition-colors flex items-center gap-2 ambient-shadow"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create New
          </Link>
        </div>
      </header>

      {/* Bottom Nav — Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-outline-variant/30 flex justify-around items-center px-2 py-1 z-40 pb-safe">
        {navItems.slice(0, 5).map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-0 transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className="text-[10px] font-label leading-none truncate max-w-full">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-surface/80 backdrop-blur-md border border-outline-variant/30 shadow-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-[24px] text-on-surface">
          {sidebarOpen ? 'close' : 'menu'}
        </span>
      </button>
    </>
  )
}
