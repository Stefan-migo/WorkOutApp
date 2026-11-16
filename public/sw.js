const CACHE_PREFIX = 'baronda-offline-'
const CACHE = `${CACHE_PREFIX}v1`
const OFFLINE_PAGE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll([
      new Request(OFFLINE_PAGE, { cache: 'reload' }),
      new Request('/baronda-192.png', { cache: 'reload' }),
    ])
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE)
      .map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (url.pathname === '/baronda-192.png') {
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      return await cache.match(request) ?? fetch(request)
    }))
    return
  }

  // Keep authenticated pages, API responses and Next.js route data out of Cache Storage.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE)
      return await cache.match(OFFLINE_PAGE) ?? Response.error()
    }))
  }
})
