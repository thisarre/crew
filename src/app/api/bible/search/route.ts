import { NextResponse } from 'next/server';

import { getSessionFromRequest } from '@/lib/auth/session';
import { searchBible } from '@/lib/bible/search';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q') ?? '';

  try {
    const results = searchBible(q, { limit: 8 });
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
