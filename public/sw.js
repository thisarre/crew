/* Crew — service worker
 *
 * Stratégies :
 *  - Assets immuables (/_next/static hachés, fonts, images) → cache-first
 *  - Scripts et styles non hachés (dev) → network-first, cache seulement hors ligne
 *  - Pages HTML → network-only avec fallback offline
 *  - API → network only (pas de cache)
 *  - Push notifications → affiche une notif avec deep-link
 */

const VERSION = 'crew-v4';
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

// Un asset Next n'est servi en cache-first que si son nom de fichier contient un hash de contenu
// (build de production : app/layout-0a1b2c3d4e5f6789.js, css/a1b2c3d4.css, media/…-s.p.woff2).
// En développement, Next sert /_next/static/chunks/app/layout.js SANS hash (et webpack.js?v=…) :
// les servir depuis le cache ferait tourner d'anciens chunks face à un HTML serveur à jour,
// d'où des erreurs d'hydratation sur toutes les pages. Ces assets passent en network-first.
const HASHED_FILENAME = /[a-f0-9]{8,}/i;

const isHashedNextAsset = url => {
  if (!url.pathname.startsWith('/_next/static/')) return false;
  if (url.search) return false;
  const filename = url.pathname.slice(url.pathname.lastIndexOf('/') + 1);
  return HASHED_FILENAME.test(filename);
};

const isStaticAsset = (request, url) =>
  isHashedNextAsset(url) ||
  request.destination === 'font' ||
  request.destination === 'image';

const isNetworkFirstAsset = (request, url) =>
  request.destination === 'style' ||
  request.destination === 'script' ||
  url.pathname.startsWith('/_next/static/');

const isApiCall = url => url.pathname.startsWith('/api/');

const putInCache = (request, response) => {
  if (response && response.ok) {
    const clone = response.clone();
    caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
  }
  return response;
};

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API : pas de cache, network only avec fallback gracieux
  if (isApiCall(url)) {
    return;
  }

  // Assets immuables (hash de contenu, polices, images) : cache-first
  if (isStaticAsset(request, url)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => putInCache(request, response));
      }),
    );
    return;
  }

  // Scripts et styles non hachés (dev) : network-first, le cache ne sert qu'hors ligne
  if (isNetworkFirstAsset(request, url)) {
    event.respondWith(
      fetch(request)
        .then(response => putInCache(request, response))
        .catch(() => caches.match(request)),
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
