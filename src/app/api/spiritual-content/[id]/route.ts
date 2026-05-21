import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { updateSpiritualContent } from '@/lib/mutations/spiritual';

const Body = z.object({
  verseText: z.string().min(3).max(800).optional(),
  verseReference: z.string().min(1).max(120).optional(),
  title: z.string().max(120).optional(),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
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
    await updateSpiritualContent(supabase, context.params.id, payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
