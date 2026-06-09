import { NextResponse } from 'next/server';

import { fetchProfiles } from '@/lib/queries/admin';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requiredRuntimeEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SESSION_SECRET',
  'TEAM_CODE',
  'ADMIN_CODE',
] as const;

const optionalRuntimeEnv = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
] as const;

export async function GET() {
  const required = Object.fromEntries(
    requiredRuntimeEnv.map(key => [key, Boolean(process.env[key])]),
  );
  const optional = Object.fromEntries(
    optionalRuntimeEnv.map(key => [key, Boolean(process.env[key])]),
  );
  const missing = requiredRuntimeEnv.filter(key => !process.env[key]);
  const checks = {
    supabaseAnonRead: false,
    supabaseServiceRead: false,
  };

  try {
    await fetchProfiles(createClient());
    checks.supabaseAnonRead = true;
  } catch {
    checks.supabaseAnonRead = false;
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await fetchProfiles(createServiceClient());
      checks.supabaseServiceRead = true;
    } catch {
      checks.supabaseServiceRead = false;
    }
  }

  return NextResponse.json(
    {
      ok: missing.length === 0 && checks.supabaseAnonRead,
      service: 'crew',
      nodeEnv: process.env.NODE_ENV,
      required,
      optional,
      checks,
      missing,
    },
    { status: missing.length === 0 && checks.supabaseAnonRead ? 200 : 503 },
  );
}
