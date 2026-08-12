'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

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
  const { user, signOut } = useAuth()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-surface/80 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Desktop (fixed) + Mobile (overlay) */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-surface z-50 flex flex-col py-24 px-16 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="mb-32 px-8">
          <h1 className="font-headline text-[24px] font-bold text-fg-2 leading-tight tracking-tight">WorkOutApp</h1>
          <p className="font-mono text-sm text-muted mt-1">Nordic Athletic</p>
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
                className={`flex items-center gap-16 px-8 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? 'text-fg-2 font-bold bg-surface-warm'
                    : 'text-muted hover:bg-surface-warm hover:text-fg-2 transition-colors'
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

        {/* User + sign out */}
        {user && (
          <div className="border-t border-border-soft pt-16 mt-16">
            <div className="flex items-center gap-16 px-8 pb-8">
              <span className="material-symbols-outlined text-[20px] text-muted">account_circle</span>
              <span className="font-body text-body-sm text-muted truncate">{user.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-16 px-8 py-2.5 rounded-lg text-muted hover:bg-surface-warm hover:text-danger transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-label text-label-caps uppercase tracking-wider">Sign out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Top App Bar — hidden on mobile, visible on desktop */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 h-20 bg-surface border-b border-border-soft items-center px-margin-desktop z-[60]">
        <span className="font-headline text-headline-md font-bold text-accent tracking-tight">WorkOutApp</span>
      </header>

      {/* Bottom Nav — Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border-soft flex justify-around items-center px-2 py-1 z-40 ">
        {navItems.slice(0, 5).map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-0 transition-colors ${
                active ? 'text-accent' : 'text-muted'
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-surface/80 backdrop-blur-md border border-border-soft shadow-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-[24px] text-fg-2">
          {sidebarOpen ? 'close' : 'menu'}
        </span>
      </button>
    </>
  )
}
