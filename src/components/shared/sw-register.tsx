'use client';

import { useEffect } from 'react';

/**
 * Enregistre le service worker au mount.
 * Skip en mode dev pour éviter les caches qui gênent le HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

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
