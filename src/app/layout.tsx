import type { Metadata, Viewport } from 'next'
import { WorkoutProvider } from '@/context/WorkoutContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorkOutApp',
  description: 'Interval timer and workout editor',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7a1a28',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <WorkoutProvider>{children}</WorkoutProvider>
      </body>
    </html>
  )
}
