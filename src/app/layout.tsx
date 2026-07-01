import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { WorkoutProvider } from '@/context/WorkoutContext'
import Nav from '@/components/Nav'
import ErrorBoundary from '@/components/ErrorBoundary'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-jetbrains-mono',
})
// ponytail: Material Symbols CDN kept because next/font/google doesn't
// export it in this Next.js version. Self-host via next/font/local when
// support is added, or download the variable TTF to public/fonts/.

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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full bg-background text-on-background">
        <ErrorBoundary>
        <WorkoutProvider>
          <Nav />
          <main className="flex-1 md:ml-64 flex flex-col min-h-screen pt-14 md:pt-20 pb-[64px] md:pb-0">
            <div className="flex-1 flex flex-col px-margin-mobile md:px-margin-desktop py-24">
              {children}
            </div>
          </main>
        </WorkoutProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
