import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { WorkoutProvider } from '@/context/WorkoutContext'
import { WorkoutRecordingProvider } from '@/context/WorkoutRecordingContext'
import AppShell from '@/components/AppShell'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import ErrorBoundary from '@/components/ErrorBoundary'
import { themeColor } from '@/lib/brand'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
})
// ponytail: Material Symbols CDN kept because next/font/google doesn't
// export it in this Next.js version. Self-host via next/font/local when
// support is added, or download the variable TTF to public/fonts/.

export const metadata: Metadata = {
  title: 'Baronda',
  description: 'Plan calisthenics workouts, track sets, and train through timed circuits.',
  appleWebApp: { capable: true, title: 'Baronda', statusBarStyle: 'default' },
  icons: { apple: '/baronda-apple.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full bg-bg text-fg-2" suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <ErrorBoundary>
        <AuthProvider>
        <WorkoutProvider>
          <WorkoutRecordingProvider>
            <AppShell>{children}</AppShell>
          </WorkoutRecordingProvider>
        </WorkoutProvider>
        </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
