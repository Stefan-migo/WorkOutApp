import type { Metadata, Viewport } from 'next'
import { WorkoutProvider } from '@/context/WorkoutContext'
import Nav from '@/components/Nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorkOutApp',
  description: 'Interval timer and workout planner',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#091426',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-background text-on-background">
        <WorkoutProvider>
          <Nav />
          <main className="flex-1 md:ml-64 flex flex-col min-h-screen pt-14 md:pt-20 pb-16 md:pb-0">
            <div className="flex-1 flex flex-col px-margin-mobile md:px-margin-desktop py-lg">
              {children}
            </div>
          </main>
        </WorkoutProvider>
      </body>
    </html>
  )
}
