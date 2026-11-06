import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

/**
 * Charge public/sw.js dans un contexte isolé avec un faux `self` et récupère les prédicats
 * qui décident de la stratégie de cache. Le service worker est un script classique (pas un
 * module), on l'évalue donc avec `vm` et on lit ses constantes de premier niveau.
 */
type Predicats = {
  isHashedNextAsset: (url: URL) => boolean;
  isStaticAsset: (request: { destination: string }, url: URL) => boolean;
  isNetworkFirstAsset: (request: { destination: string }, url: URL) => boolean;
};

const chargerPredicats = (): Predicats => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../public/sw.js'), 'utf8');
  const contexte = vm.createContext({
    self: { addEventListener: () => undefined, location: { origin: 'http://localhost' } },
    caches: {},
    URL,
  });
  vm.runInContext(`${source}\n;globalThis.__predicats = { isHashedNextAsset, isStaticAsset, isNetworkFirstAsset };`, contexte);
  return (contexte as unknown as { __predicats: Predicats }).__predicats;
};

const url = (chemin: string) => new URL(chemin, 'http://localhost');
const script = { destination: 'script' };
const style = { destination: 'style' };
const font = { destination: 'font' };

describe('Stratégie de cache du service worker', () => {
  const { isHashedNextAsset, isStaticAsset, isNetworkFirstAsset } = chargerPredicats();

  it('met en cache-first les assets de production dont le nom contient un hash de contenu', () => {
    const haches = [
      '/_next/static/chunks/app/layout-0a1b2c3d4e5f6789.js',
      '/_next/static/chunks/1234-abcdef0123456789.js',
      '/_next/static/css/a1b2c3d4e5f6.css',
      '/_next/static/media/636a5ac981f94f8b-s.p.woff2',
    ];
    for (const chemin of haches) {
      expect(isHashedNextAsset(url(chemin)), chemin).toBe(true);
      expect(isStaticAsset(script, url(chemin)), chemin).toBe(true);
    }
  });

  it("ne met jamais en cache-first les chunks de développement, qui n'ont pas de hash", () => {
    const dev = [
      '/_next/static/chunks/app/layout.js',
      '/_next/static/chunks/app/(auth)/page.js',
      '/_next/static/chunks/app-pages-internals.js',
      '/_next/static/chunks/main-app.js?v=1793986183417',
      '/_next/static/chunks/webpack.js?v=1793986183417',
      '/_next/static/css/app/layout.css?v=1793986183417',
    ];
    for (const chemin of dev) {
      expect(isHashedNextAsset(url(chemin)), chemin).toBe(false);
      expect(isStaticAsset(script, url(chemin)), chemin).toBe(false);
      expect(isNetworkFirstAsset(script, url(chemin)), chemin).toBe(true);
    }
    expect(isNetworkFirstAsset(style, url('/_next/static/css/app/layout.css?v=1'))).toBe(true);
  });

  it('garde les polices et images en cache-first', () => {
    expect(isStaticAsset(font, url('/fonts/jakarta.woff2'))).toBe(true);
    expect(isStaticAsset({ destination: 'image' }, url('/icon'))).toBe(true);
  });

  it("ne considère pas un hash dans le dossier comme un hash de fichier", () => {
    expect(isHashedNextAsset(url('/_next/static/abcdef0123456789/_buildManifest.js'))).toBe(false);
  });
});
