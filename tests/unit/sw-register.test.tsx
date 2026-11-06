import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceWorkerRegister, nettoyerServiceWorkersDev } from '@/components/shared/sw-register';

type FauxRegistration = { unregister: ReturnType<typeof vi.fn> };

const installerFauxServiceWorker = (options: {
  registrations: FauxRegistration[];
  controller: object | null;
  caches?: string[];
}) => {
  const serviceWorker = {
    controller: options.controller,
    getRegistrations: vi.fn(async () => options.registrations),
    register: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: serviceWorker,
  });

  const cachesSupprimes: string[] = [];
  const fauxCaches = {
    keys: vi.fn(async () => options.caches ?? []),
    delete: vi.fn(async (key: string) => {
      cachesSupprimes.push(key);
      return true;
    }),
  };
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: fauxCaches });

  const reload = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });

  return { serviceWorker, cachesSupprimes, reload };
};

describe('ServiceWorkerRegister hors production', () => {
  const locationInitiale = window.location;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', { configurable: true, value: locationInitiale });
    Reflect.deleteProperty(window.navigator, 'serviceWorker');
    Reflect.deleteProperty(globalThis, 'caches');
  });

  it("n'enregistre jamais le service worker", async () => {
    const { serviceWorker } = installerFauxServiceWorker({ registrations: [], controller: null });

    render(<ServiceWorkerRegister />);

    await waitFor(() => expect(serviceWorker.getRegistrations).toHaveBeenCalled());
    expect(serviceWorker.register).not.toHaveBeenCalled();
  });

  it('désenregistre les service workers résiduels, vide leurs caches et recharge la page contrôlée', async () => {
    const registration = { unregister: vi.fn(async () => true) };
    const { cachesSupprimes, reload } = installerFauxServiceWorker({
      registrations: [registration],
      controller: {},
      caches: ['crew-v3-static', 'crew-v2-pages', 'autre-app'],
    });

    render(<ServiceWorkerRegister />);

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(registration.unregister).toHaveBeenCalledTimes(1);
    expect(cachesSupprimes).toEqual(['crew-v3-static', 'crew-v2-pages']);
  });

  it('ne recharge pas la page quand aucun service worker ne la contrôlait', async () => {
    const registration = { unregister: vi.fn(async () => true) };
    const { reload } = installerFauxServiceWorker({ registrations: [registration], controller: null });

    const recharge = await nettoyerServiceWorkersDev();

    expect(recharge).toBe(false);
    expect(registration.unregister).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });
});
