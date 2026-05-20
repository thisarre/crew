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

const shouldUseMock = () => process.env.SUPABASE_MOCK === 'true' || process.env.NODE_ENV === 'test';

export type SupabaseServerClient = SupabaseClient<Database>;

export const createClient = (): SupabaseServerClient => {
  if (shouldUseMock()) {
    return createMockSupabaseClient() as unknown as SupabaseServerClient;
  }

  const url = getSupabaseUrl();
  const key = getServiceRoleKey() ?? getAnonKey();

  return createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: false,
    },
  });
};
