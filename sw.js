// Service worker: offline senza restare congelati su una versione vecchia (lezione di Flip7).
//   - documento e moduli JS -> network-first con fallback cache;
//   - CSS, icone, immagini, manifest -> cache-first.
// Le immagini degli esercizi entrano in cache la prima volta che si vedono.
// Alzare VERSION a ogni rilascio.

const VERSION = 'v1'
const CACHE = `allenamento-${VERSION}`

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/core/rules.js',
  './js/core/rng.js',
  './js/core/catalog.js',
  './js/core/formats.js',
  './js/core/generator.js',
  './js/core/adapt.js',
  './js/core/storage.js',
  './js/core/player.js',
  './js/ui/app.js',
  './js/ui/screens.js',
  './js/ui/cues.js',
  './js/ui/deeplink.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

function isFreshnessCritical(request, url) {
  return request.mode === 'navigate'
    || request.destination === 'document'
    || request.destination === 'script'
    || url.pathname.endsWith('.js')
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response && response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' }) || await cache.match('./index.html')
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.ok) cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  event.respondWith(isFreshnessCritical(request, url) ? networkFirst(request) : cacheFirst(request))
})
