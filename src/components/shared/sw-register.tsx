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

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (err) {
        // Échec silencieux, le SW est un nice-to-have
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('SW registration failed', err);
        }
      }
    };

    // Register après le load pour ne pas ralentir le first paint
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
