'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPlayback = /^\/(workouts|sequences)\/[^/]+\/play\/?$/.test(pathname)
  if (isPlayback) return <div className="training-theme min-h-dvh bg-bg text-fg-2">{children}</div>
  if (pathname === '/login') return <main className="min-h-dvh">{children}</main>

  return (
    <>
      <a href="#app-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-control focus:bg-surface focus:p-3">Skip to content</a>
      <Nav />
      <main id="app-content" tabIndex={-1} className="app-content flex min-h-dvh flex-col md:ml-64">
        <div className="flex flex-1 flex-col px-margin-mobile py-24 md:px-margin-desktop md:py-10">
          {children}
        </div>
      </main>
    </>
  )
}
