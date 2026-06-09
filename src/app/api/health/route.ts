import { NextResponse } from 'next/server';

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

  return NextResponse.json(
    {
      ok: missing.length === 0,
      service: 'crew',
      nodeEnv: process.env.NODE_ENV,
      required,
      optional,
      missing,
    },
    { status: missing.length === 0 ? 200 : 503 },
  );
}
