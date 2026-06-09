import { NextResponse } from 'next/server';

import { verifyAdminCode, verifyTeamCode } from '@/lib/auth';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, encodeSessionToken } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { fetchProfileById } from '@/lib/queries/admin';

export const runtime = 'nodejs';

const authError = (error: string, status = 500, cause?: unknown) => {
  const message = cause instanceof Error ? cause.message : undefined;

  return NextResponse.json(
    {
      ok: false,
      error,
      detail: process.env.NODE_ENV === 'production' ? undefined : message,
    },
    { status },
  );
};

export async function POST(request: Request) {
  let profileId = '';
  let isAdmin = false;

  try {
    const body = await request.json();
    const code = body.code;
    profileId = body.profile_id;
    isAdmin = Boolean(body.is_admin);

    if (!code || !profileId) {
      return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
    }

    const supabase = createClient();
    const profile = await fetchProfileById(supabase, profileId).catch(error => {
      throw Object.assign(new Error('supabase_profile_lookup_failed'), { cause: error });
    });
    if (!profile) {
      return NextResponse.json({ ok: false, error: 'profile_not_found' }, { status: 404 });
    }
    if (!(profile.is_active ?? true)) {
      return NextResponse.json({ ok: false, error: 'profile_inactive' }, { status: 403 });
    }

    const respondWithSession = (redirect: string, asAdmin: boolean) => {
      try {
        const token = encodeSessionToken({ profileId, isAdmin: asAdmin });
        const res = NextResponse.json({ ok: true, redirect });
        res.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: token,
          ...SESSION_COOKIE_OPTIONS,
        });
        return res;
      } catch (error) {
        throw Object.assign(new Error('session_cookie_failed'), { cause: error });
      }
    };

    if (isAdmin) {
      if (!verifyAdminCode(code)) {
        return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 401 });
      }
      if (profile.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'not_admin' }, { status: 401 });
      }
      return respondWithSession('/admin', true);
    }

    if (!verifyTeamCode(code)) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 401 });
    }

    return respondWithSession('/dashboard', false);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const cause = error instanceof Error ? error.cause : undefined;
    const causeMessage = cause instanceof Error ? cause.message : '';
    const isConfigError =
      message.includes('SUPABASE') ||
      message.includes('manquant') ||
      causeMessage.includes('Invalid API key') ||
      causeMessage.includes('JWT');

    if (message === 'supabase_profile_lookup_failed') {
      return authError(isConfigError ? 'supabase_config_error' : message, isConfigError ? 503 : 500, cause);
    }
    if (message === 'session_cookie_failed') {
      return authError(message, 500, cause);
    }

    return authError(isConfigError ? 'server_config_error' : 'auth_server_error', isConfigError ? 503 : 500, error);
  }
}
