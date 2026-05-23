import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromRequest } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { fetchSpiritualContent } from '@/lib/queries/admin';
import { suggestSpiritualContent } from '@/lib/ai/spiritual-suggest';

const Body = z.object({
  theme: z.string().nullish(),
});

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const recent = await fetchSpiritualContent(supabase);
    const recentReferences = recent
      .slice(0, 8)
      .map(item => item.verse_reference)
      .filter((ref): ref is string => Boolean(ref));
    const suggestion = await suggestSpiritualContent({
      theme: payload.theme ?? null,
      recentReferences,
    });
    return NextResponse.json({ ok: true, ...suggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
