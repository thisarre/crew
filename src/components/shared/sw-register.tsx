'use client';

import { useEffect } from 'react';

const SW_CACHE_PREFIX = 'crew-';

/**
 * Hors production, un service worker peut rester enregistré sur l'origine (par exemple après
 * un `npm run build && npm start` sur le même localhost). Or `public/sw.js` sert `/_next/static/`
 * en cache-first, et en développement les chunks (`app/layout.js`, `app/(auth)/page.js`…) ne sont
 * pas hachés : le navigateur reçoit alors d'anciens chunks pendant que le serveur rend le HTML avec
 * le code courant, ce qui provoque des erreurs d'hydratation sur toutes les pages.
 *
 * On désenregistre donc tout service worker résiduel et on vide ses caches, puis on recharge une
 * seule fois si la page courante était déjà contrôlée (donc potentiellement servie depuis le cache).
 *
 * @returns `true` si un rechargement a été déclenché.
 */
export async function nettoyerServiceWorkersDev(): Promise<boolean> {
  const etaitControlee = navigator.serviceWorker.controller !== null;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(registration => registration.unregister()));

  if (typeof caches !== 'undefined') {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(SW_CACHE_PREFIX)).map(key => caches.delete(key)));
  }

  if (etaitControlee && registrations.length > 0) {
    window.location.reload();
    return true;
  }
  return false;
}

/**
 * Enregistre le service worker au mount.
 * Skip en mode dev pour éviter les caches qui gênent le HMR — et nettoie tout service worker
 * résiduel pour que le navigateur ne serve jamais de chunks périmés (voir nettoyerServiceWorkersDev).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      nettoyerServiceWorkersDev().catch(err => {
        // eslint-disable-next-line no-console
        console.warn('Nettoyage du service worker impossible', err);
      });
      return;
    }

    let refreshing = false;

    // Reload once when a new SW takes control (after skipWaiting)
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // Listen for new SW arriving
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            // When the new SW is activated and a controller already exists,
            // controllerchange will fire and trigger the reload above.
          });
        });

        // Poll for updates every 60 seconds
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60_000);

        return interval;
      } catch (err) {
        // Échec silencieux, le SW est un nice-to-have
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('SW registration failed', err);
        }
      }
    };

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const init = async () => {
      intervalId = await register();
    };

    // Register après le load pour ne pas ralentir le first paint
    if (document.readyState === 'complete') {
      void init();
    } else {
      window.addEventListener('load', () => void init(), { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
}
