/* Crew — service worker
 *
 * Stratégies :
 *  - Assets statiques (/_next/static, fonts, images) → cache-first
 *  - Pages HTML → network-first avec fallback offline
 *  - API → network only (pas de cache)
 *  - Push notifications → affiche une notif avec deep-link
 */

const VERSION = 'crew-v3';
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/offline.html';

// Seul l'offline.html est précaché — on ne précache plus '/' pour éviter qu'une vieille
// version du dashboard reste collée. Les pages sont mises en cache à la volée (network-first).
const PRECACHE_URLS = [
  '/offline.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !key.startsWith(VERSION))
          .map(key => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

const isStaticAsset = request =>
  request.destination === 'style' ||
  request.destination === 'script' ||
  request.destination === 'font' ||
  request.destination === 'image' ||
  request.url.includes('/_next/static/');

const isApiCall = url => url.pathname.startsWith('/api/');

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API : pas de cache, network only avec fallback gracieux
  if (isApiCall(url)) {
    return;
  }

  // Assets statiques : cache-first
  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Documents HTML : network-only (avec fallback offline UNIQUEMENT si pas de réseau).
  // On ne met plus en cache les HTML pour éviter qu'une page restée trop longtemps
  // affiche des données obsolètes — Crew est toujours data-driven.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
  }
});

// Message handler (future-proofing for controlled skipWaiting)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Crew', body: event.data.text() };
  }
  const title = payload.title ?? 'Crew';
  const options = {
    body: payload.body ?? '',
    icon: '/icon',
    badge: '/icon-maskable',
    data: { url: payload.url ?? '/' },
    tag: payload.tag,
    requireInteraction: payload.requireInteraction ?? false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
