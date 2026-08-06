const CACHE_VERSION = 'gasoline-web-v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`

// Critical App Shell resources to precache
const APP_SHELL = [
	'/',
	'/manifest.json',
	'/offline',
	'/icons/icon-192x192.png',
	'/icons/icon-512x512.png',
]

// Install Event - Precache App Shell
self.addEventListener('install', event => {
	console.log('[SW] Installing Service Worker version:', CACHE_VERSION)
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then(cache => {
				console.log('[SW] Precaching App Shell resources...')
				return cache.addAll(APP_SHELL)
			})
			.catch(err => {
				console.warn('[SW] Precache failed for some assets, continuing:', err)
			}),
	)
	self.skipWaiting()
})

// Activate Event - Clean up stale caches
self.addEventListener('activate', event => {
	console.log('[SW] Activating Service Worker...')
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames
					.filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
					.map(name => {
						console.log('[SW] Deleting old cache:', name)
						return caches.delete(name)
					}),
			)
		}),
	)
	self.clients.claim()
})

// Fetch Event - Tiered Caching Strategy
self.addEventListener('fetch', event => {
	const { request } = event
	const url = new URL(request.url)

	// Only intercept GET requests from the same origin
	if (request.method !== 'GET' || url.origin !== location.origin) return

	// Strategy A: Cache-First for static assets (images, fonts, scripts, styles)
	if (
		url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff2|ico)$/) ||
		url.pathname.startsWith('/_next/static/')
	) {
		event.respondWith(cacheFirst(request))
		return
	}

	// Strategy B: Stale-While-Revalidate for API requests
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(staleWhileRevalidate(request))
		return
	}

	// Strategy C: Network-First with Offline Fallback for HTML Page Navigations
	if (request.mode === 'navigate' || request.headers.get('Accept')?.includes('text/html')) {
		event.respondWith(networkFirst(request))
		return
	}
})

// Strategy A: Cache First
async function cacheFirst(request) {
	const cached = await caches.match(request)
	if (cached) return cached
	try {
		const response = await fetch(request)
		if (response.status === 200) {
			const cache = await caches.open(STATIC_CACHE)
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		return new Response('Asset unavailable offline', { status: 503 })
	}
}

// Strategy B: Stale While Revalidate
async function staleWhileRevalidate(request) {
	const cache = await caches.open(DYNAMIC_CACHE)
	const cached = await cache.match(request)
	const fetchPromise = fetch(request)
		.then(response => {
			if (response.status === 200) {
				cache.put(request, response.clone())
			}
			return response
		})
		.catch(err => {
			console.warn('[SW] API fetch failed offline:', err)
			return cached
		})

	return cached || fetchPromise
}

// Strategy C: Network First (with /offline fallback)
async function networkFirst(request) {
	try {
		const response = await fetch(request)
		if (response.status === 200) {
			const cache = await caches.open(DYNAMIC_CACHE)
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		console.log('[SW] Network failed, attempting cache match for:', request.url)
		const cached = await caches.match(request)
		if (cached) return cached
		const offlinePage = await caches.match('/offline')
		return (
			offlinePage ||
			new Response('Offline - Gasoline Web', {
				status: 503,
				headers: { 'Content-Type': 'text/html' },
			})
		)
	}
}
