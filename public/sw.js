/*
 * Minimal app-shell service worker.
 *
 * Strategy: network-first for HTML (so deploys land immediately for returning
 * users) with a cached fallback when offline. Stale-while-revalidate for
 * static assets so repeat loads feel instant.
 *
 * We intentionally do NOT cache /api/* — that data is user-specific and
 * should never be served stale. Also skipped: third-party hosts (TMDB,
 * fanart.tv, wsrv.nl, etc.) because we have no control over their TTLs.
 */

// Bump this on every deploy that changes CSS/JS people might already have
// cached. The activate handler nukes all caches that don't match the current
// version, so a bump forces a clean re-fetch on the user's next page load.
const VERSION = 'bynge-v3-2026-05-27';
const HTML_CACHE = `${VERSION}-html`;
const ASSET_CACHE = `${VERSION}-assets`;
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(HTML_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only — don't intercept TMDB / fanart / wsrv requests.
  if (url.origin !== self.location.origin) return;

  // Never cache the API proxy — user-specific, must always hit fresh.
  if (url.pathname.startsWith('/api/')) return;

  // HTML pages → network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(HTML_CACHE).then((cache) => cache.put(OFFLINE_URL, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL).then((cached) => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images, manifest) → stale-while-revalidate.
  if (['script', 'style', 'font', 'image', 'manifest'].includes(request.destination)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone()).catch(() => {});
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
