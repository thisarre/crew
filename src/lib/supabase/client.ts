import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

const ensureEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} manquant pour Supabase`);
  }
  return value;
};

export const createBrowserSupabaseClient = () => {
  const url = ensureEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = ensureEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createBrowserClient<Database>(url, key);
};
