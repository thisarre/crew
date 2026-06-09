import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import { createMockSupabaseClient } from './mock';

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant');
  }
  return url;
};

const getServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const getAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY manquant');
  }
  return key;
};

const shouldUseMock = () =>
  process.env.SUPABASE_MOCK === 'true' ||
  process.env.NODE_ENV === 'test' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

export type SupabaseServerClient = SupabaseClient<Database>;

type CreateClientOptions = {
  useServiceRole?: boolean;
};

const decodeJwtPayload = (token: string | undefined): Record<string, unknown> | null => {
  if (!token || !token.includes('.')) return null;
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      Math.ceil(payload.length / 4) * 4,
      '=',
    );
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getProjectRefFromUrl = (url: string): string | null => {
  try {
    const [projectRef] = new URL(url).host.split('.');
    return projectRef || null;
  } catch {
    return null;
  }
};

const getProjectRefFromKey = (key: string | undefined): string | null => {
  const ref = decodeJwtPayload(key)?.ref;
  return typeof ref === 'string' ? ref : null;
};

const getProjectUrl = (projectRef: string) => `https://${projectRef}.supabase.co`;

const resolveServerConnection = (options: CreateClientOptions) => {
  const configuredUrl = getSupabaseUrl();
  const anonKey = getAnonKey();
  const serviceKey = getServiceRoleKey();
  const configuredRef = getProjectRefFromUrl(configuredUrl);
  const anonRef = getProjectRefFromKey(anonKey);
  const serviceRef = getProjectRefFromKey(serviceKey);

  if (options.useServiceRole) {
    return serviceKey && serviceRef
      ? { url: getProjectUrl(serviceRef), key: serviceKey }
      : { url: configuredUrl, key: anonKey };
  }

  // Production safety net: if Netlify's public Supabase env vars point to
  // the wrong project, server rendering can still use the correctly scoped
  // service key without exposing it to the browser.
  if (serviceKey && serviceRef && configuredRef !== serviceRef) {
    return { url: getProjectUrl(serviceRef), key: serviceKey };
  }

  if (configuredRef && anonRef && configuredRef === anonRef) {
    return { url: configuredUrl, key: anonKey };
  }

  return { url: configuredUrl, key: anonKey };
};

export const createClient = (options: CreateClientOptions = {}): SupabaseServerClient => {
  if (shouldUseMock()) {
    return createMockSupabaseClient() as unknown as SupabaseServerClient;
  }

  const { url, key } = resolveServerConnection(options);

  // Next.js patche `fetch` et met en cache les requêtes par défaut (Data Cache).
  // On force `cache: 'no-store'` pour que chaque requête Supabase reflète l'état réel de la base
  // — indispensable après une mutation suivie d'un router.refresh().
  const noStoreFetch: typeof fetch = (input, init) =>
    fetch(input, { ...init, cache: 'no-store' });

  return createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: noStoreFetch,
    },
  });
};

export const createServiceClient = (): SupabaseServerClient =>
  createClient({ useServiceRole: true });
