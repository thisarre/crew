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

const getUrlHost = (value: string | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return 'invalid_url';
  }
};

const getErrorName = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'unknown_error';
};

export async function GET() {
  const required = Object.fromEntries(
    requiredRuntimeEnv.map(key => [key, Boolean(process.env[key])]),
  );
  const optional = Object.fromEntries(
    optionalRuntimeEnv.map(key => [key, Boolean(process.env[key])]),
  );
  const missing = requiredRuntimeEnv.filter(key => !process.env[key]);
  const anonPayload = decodeJwtPayload(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const servicePayload = decodeJwtPayload(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const diagnostics = {
    supabaseUrlHost: getUrlHost(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKeyRole: anonPayload?.role ?? null,
    anonKeyProjectRef: anonPayload?.ref ?? null,
    serviceKeyRole: servicePayload?.role ?? null,
    serviceKeyProjectRef: servicePayload?.ref ?? null,
    anonReadError: null as string | null,
    serviceReadError: null as string | null,
  };
  const checks = {
    supabaseAnonRead: false,
    supabaseServiceRead: false,
  };

  try {
    await fetchProfiles(createClient());
    checks.supabaseAnonRead = true;
  } catch (error) {
    checks.supabaseAnonRead = false;
    diagnostics.anonReadError = getErrorName(error);
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await fetchProfiles(createServiceClient());
      checks.supabaseServiceRead = true;
    } catch (error) {
      checks.supabaseServiceRead = false;
      diagnostics.serviceReadError = getErrorName(error);
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
      diagnostics,
      missing,
    },
    { status: missing.length === 0 && checks.supabaseAnonRead ? 200 : 503 },
  );
}
