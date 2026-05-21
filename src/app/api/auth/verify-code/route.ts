import { NextResponse } from 'next/server';

import { verifyAdminCode, verifyTeamCode } from '@/lib/auth';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, encodeSessionToken } from '@/lib/auth/session';
import { PROFILES_SEED } from '@/data/seed';

export async function POST(request: Request) {
  const { code, profile_id: profileId, is_admin: isAdmin } = await request.json();

  if (!code || !profileId) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }

  const profile = PROFILES_SEED.find(profile => profile.id === profileId);
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'profile_not_found' }, { status: 404 });
  }

  const respondWithSession = (redirect: string, asAdmin: boolean) => {
    const token = encodeSessionToken({ profileId, isAdmin: asAdmin });
    const res = NextResponse.json({ ok: true, redirect });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      ...SESSION_COOKIE_OPTIONS,
    });
    return res;
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
}
