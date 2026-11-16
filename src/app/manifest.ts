import type { MetadataRoute } from 'next'
import { themeColor } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Baronda',
    short_name: 'Baronda',
    description: 'Calisthenics workouts, sets, and timed circuits',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: themeColor,
    theme_color: themeColor,
    icons: [
      { src: '/baronda-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/baronda-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/baronda-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
