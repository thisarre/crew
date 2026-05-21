import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { publishSpiritualContent } from '@/lib/mutations/spiritual';

const Body = z.object({
  verseText: z.string().min(3).max(800),
  verseReference: z.string().min(1).max(120),
  title: z.string().max(120).optional(),
  contentType: z.enum(['weekly_thought', 'service_theme']).optional(),
  serviceId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const result = await publishSpiritualContent(supabase, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
